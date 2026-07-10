from app.core.logger import logger
from app.graph.state import ClaimState

STAGE_NAME = "medical"


def run(state: ClaimState) -> dict:
    logger.info(f"[{STAGE_NAME}] placeholder stage running for claim {state['claim_id']}")
    return {"workflow_history": [STAGE_NAME]}
