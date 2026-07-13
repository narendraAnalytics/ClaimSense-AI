from app.agents.intake.agent import initialize_claim_state
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
            # A checkpoint already exists for this claim — resume instead of
            # restarting. Passing `None` as input is LangGraph's documented
            # convention for continuing from the last checkpoint rather than
            # overwriting state; if the graph already reached END, this is a
            # no-op and simply returns the cached final state (the whole
            # point of checkpointing — no repeat OCR/LLM calls/credits).
            return await get_claim_graph().ainvoke(None, config=config)

    initial_state = initialize_claim_state(claim, documents)
    return await invoke_graph(initial_state)


async def get_graph_state(claim_id: str) -> ClaimState | None:
    snapshot = await get_claim_graph().aget_state(_thread_config(claim_id))
    return snapshot.values or None
