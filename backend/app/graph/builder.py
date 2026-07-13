from functools import lru_cache

from langgraph.graph import END, START, StateGraph
from langgraph.graph.state import CompiledStateGraph

from app.graph.checkpointer import get_checkpointer
from app.graph.nodes import (
    billing_node,
    document_node,
    fraud_node,
    history_node,
    human_approval_node,
    medical_node,
    policy_node,
    report_node,
    settlement_node,
    supervisor_node,
)
from app.graph.state import ClaimState


def build_claim_graph() -> CompiledStateGraph:
    workflow = StateGraph(ClaimState)

    # Phase 6: Document Intelligence runs before the Supervisor (per
    # projectfolder.txt's Phase 6 recommendation) so the Supervisor reasons
    # over structured OCR data instead of raw files. Billing/Fraud/History
    # fan out from Medical and join at Settlement (Phase 10 Step 1) — all
    # three write disjoint result keys, so no reducers are needed for their
    # outputs; `updated_at` in state.py uses a `max` reducer since all three
    # independently stamp it in the same superstep.
    workflow.add_node("document", document_node)
    workflow.add_node("supervisor", supervisor_node)
    workflow.add_node("policy", policy_node)
    workflow.add_node("medical", medical_node)
    workflow.add_node("billing", billing_node)
    workflow.add_node("fraud", fraud_node)
    workflow.add_node("history", history_node)
    workflow.add_node("settlement", settlement_node)
    workflow.add_node("human_approval", human_approval_node)
    workflow.add_node("report", report_node)

    workflow.add_edge(START, "document")
    workflow.add_edge("document", "supervisor")
    workflow.add_edge("supervisor", "policy")
    workflow.add_edge("policy", "medical")
    workflow.add_edge("medical", "billing")
    workflow.add_edge("medical", "fraud")
    workflow.add_edge("medical", "history")
    workflow.add_edge("billing", "settlement")
    workflow.add_edge("fraud", "settlement")
    workflow.add_edge("history", "settlement")
    workflow.add_edge("settlement", "human_approval")
    workflow.add_edge("human_approval", "report")
    workflow.add_edge("report", END)

    return workflow.compile(checkpointer=get_checkpointer())


@lru_cache
def get_claim_graph() -> CompiledStateGraph:
    return build_claim_graph()
