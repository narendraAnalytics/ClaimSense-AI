from functools import lru_cache

from langgraph.graph import END, START, StateGraph
from langgraph.graph.state import CompiledStateGraph

from app.graph.nodes import document_node, policy_node, supervisor_node
from app.graph.state import ClaimState


def build_claim_graph() -> CompiledStateGraph:
    workflow = StateGraph(ClaimState)

    # Phase 6: Document Intelligence runs before the Supervisor (per
    # projectfolder.txt's Phase 6 recommendation) so the Supervisor reasons
    # over structured OCR data instead of raw files. medical/billing/fraud/
    # history/settlement/report node functions already exist in
    # graph/nodes.py, ready to attach once a later phase gives them real
    # logic.
    workflow.add_node("document", document_node)
    workflow.add_node("supervisor", supervisor_node)
    workflow.add_node("policy", policy_node)

    workflow.add_edge(START, "document")
    workflow.add_edge("document", "supervisor")
    workflow.add_edge("supervisor", "policy")
    workflow.add_edge("policy", END)

    return workflow.compile()


@lru_cache
def get_claim_graph() -> CompiledStateGraph:
    return build_claim_graph()
