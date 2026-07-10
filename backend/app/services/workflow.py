from app.agents.intake.agent import initialize_claim_state
from app.graph.builder import get_claim_graph
from app.graph.state import ClaimState
from app.models.claim import Claim
from app.models.document import Document
from app.services.claim_registry import get_claim
from app.services.document_registry import get_documents_for_claim

# The only module allowed to touch the compiled LangGraph graph directly —
# API routes must go through this service instead.


def invoke_graph(state: ClaimState) -> ClaimState:
    return get_claim_graph().invoke(state)


def start_workflow(claim: Claim, documents: list[Document]) -> ClaimState:
    initial_state = initialize_claim_state(claim, documents)
    return invoke_graph(initial_state)


def resume_workflow(
    claim: Claim, documents: list[Document], previous_state: ClaimState | None = None
) -> ClaimState:
    # Phase 5: re-runs the graph from a fresh Supervisor pass with the
    # latest documents, prepending prior workflow_history. True checkpointed
    # resume (picking up mid-graph) needs LangGraph persistence, which isn't
    # wired in yet.
    state = initialize_claim_state(claim, documents)
    if previous_state is not None:
        state["workflow_history"] = previous_state.get("workflow_history", []) + state[
            "workflow_history"
        ]
    return invoke_graph(state)


def get_graph_state(claim_id: str) -> ClaimState | None:
    # No graph-level persistence/checkpointing yet — this reconstructs a
    # best-effort current state from the in-memory registries rather than
    # fetching a saved run.
    claim = get_claim(claim_id)
    if claim is None:
        return None
    documents = get_documents_for_claim(claim_id)
    return initialize_claim_state(claim, documents)
