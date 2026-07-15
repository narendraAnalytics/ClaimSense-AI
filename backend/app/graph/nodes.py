from app.agents.billing.agent import run as billing_run
from app.agents.document.agent import run as document_run
from app.agents.fraud.agent import run as fraud_run
from app.agents.history.agent import run as history_run
from app.agents.human_approval.agent import run as human_approval_run
from app.agents.medical.agent import run as medical_run
from app.agents.policy.agent import run as policy_run
from app.agents.report.agent import run as report_run
from app.agents.settlement.agent import run as settlement_run
from app.agents.supervisor.agent import decide_next_step
from app.graph.state import ClaimState


def supervisor_node(state: ClaimState) -> dict:
    return decide_next_step(state)


def policy_node(state: ClaimState) -> dict:
    return policy_run(state)


async def document_node(state: ClaimState) -> dict:
    return await document_run(state)


def medical_node(state: ClaimState) -> dict:
    return medical_run(state)


def billing_node(state: ClaimState) -> dict:
    return billing_run(state)


def fraud_node(state: ClaimState) -> dict:
    return fraud_run(state)


def history_node(state: ClaimState) -> dict:
    return history_run(state)


def settlement_node(state: ClaimState) -> dict:
    return settlement_run(state)


def human_approval_node(state: ClaimState) -> dict:
    return human_approval_run(state)


async def report_node(state: ClaimState) -> dict:
    return await report_run(state)
