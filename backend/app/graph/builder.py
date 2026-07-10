from functools import lru_cache

from langgraph.graph import END, START, StateGraph
from langgraph.graph.state import CompiledStateGraph

from app.graph.nodes import policy_node, supervisor_node
from app.graph.state import ClaimState


def build_claim_graph() -> CompiledStateGraph:
    workflow = StateGraph(ClaimState)

    # Phase 5: only supervisor + policy are wired in (per spec, kept
    # intentionally simple). document/medical/billing/fraud/history/
    # settlement/report node functions already exist in graph/nodes.py,
    # ready to attach once a later phase gives them real logic.
    workflow.add_node("supervisor", supervisor_node)
    workflow.add_node("policy", policy_node)

    workflow.add_edge(START, "supervisor")
    workflow.add_edge("supervisor", "policy")
    workflow.add_edge("policy", END)

    return workflow.compile()


@lru_cache
def get_claim_graph() -> CompiledStateGraph:
    return build_claim_graph()
