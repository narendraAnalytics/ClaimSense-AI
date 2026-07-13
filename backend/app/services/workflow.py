from langgraph.types import Command

from app.agents.intake.agent import initialize_claim_state
from app.core.constants import ClaimStatus
from app.graph.builder import get_claim_graph
from app.graph.checkpointer import get_checkpointer
from app.graph.state import ClaimState
from app.models.claim import Claim
from app.models.document import Document

# The only module allowed to touch the compiled LangGraph graph directly —
# API routes must go through this service instead.


def _thread_config(claim_id: str) -> dict:
    return {"configurable": {"thread_id": claim_id}}


async def invoke_graph(state: ClaimState) -> ClaimState:
    return await get_claim_graph().ainvoke(state, config=_thread_config(state["claim_id"]))


async def _mark_if_paused(config: dict, result: ClaimState) -> ClaimState:
    # A graph paused on interrupt() (e.g. human_approval) doesn't set its own
    # "status" field — only the supervisor node does, to PROCESSING — so the
    # caller can't tell "still running" from "awaiting a human decision"
    # without checking the checkpoint's pending tasks directly.
    snapshot = await get_claim_graph().aget_state(config)
    if snapshot.next:
        result = dict(result)
        result["status"] = ClaimStatus.AWAITING_APPROVAL
    return result


async def resume_workflow(claim: Claim, documents: list[Document], force: bool = False) -> ClaimState:
    config = _thread_config(claim.claim_id)

    if force:
        # Discard any prior checkpoint for this thread so the fresh-start
        # path below re-runs from scratch with the current documents —
        # needed since claimants commonly add/replace documents after their
        # first /process call, and a cached checkpoint would otherwise mask
        # the new upload.
        await get_checkpointer().adelete_thread(claim.claim_id)
    else:
        existing = await get_claim_graph().aget_state(config)
        if existing.values:
            if existing.next:
                # Paused mid-graph (e.g. awaiting a human decision) — return
                # the paused state as-is instead of re-invoking, so a
                # repeated /process call while awaiting approval doesn't
                # restart the pipeline or re-trigger the interrupt.
                result = dict(existing.values)
                result["status"] = ClaimStatus.AWAITING_APPROVAL
                return result

            # A checkpoint already exists for this claim — resume instead of
            # restarting. Passing `None` as input is LangGraph's documented
            # convention for continuing from the last checkpoint rather than
            # overwriting state; if the graph already reached END, this is a
            # no-op and simply returns the cached final state (the whole
            # point of checkpointing — no repeat OCR/LLM calls/credits).
            result = await get_claim_graph().ainvoke(None, config=config)
            return await _mark_if_paused(config, result)

    initial_state = initialize_claim_state(claim, documents)
    result = await invoke_graph(initial_state)
    return await _mark_if_paused(config, result)


async def submit_officer_decision(
    claim_id: str, decision: str, modified_amount: float | None, notes: str | None
) -> ClaimState:
    config = _thread_config(claim_id)
    snapshot = await get_claim_graph().aget_state(config)
    if not snapshot.next or "human_approval" not in snapshot.next:
        raise ValueError(f"Claim {claim_id} is not awaiting an officer decision")

    return await get_claim_graph().ainvoke(
        Command(resume={"decision": decision, "modified_amount": modified_amount, "notes": notes}),
        config=config,
    )


async def get_graph_state(claim_id: str) -> ClaimState | None:
    snapshot = await get_claim_graph().aget_state(_thread_config(claim_id))
    return snapshot.values or None
