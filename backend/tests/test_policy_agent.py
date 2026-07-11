from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.core.config import settings
from app.main import app

client = TestClient(app)
FIXTURES_DIR = Path(__file__).parent / "fixtures"

CLAIM_PAYLOAD = {
    "policy_number": "BF-HEALTH-2026",
    "claimant_name": "Priya Sharma",
    "claim_type": "health",
    "incident_date": "2026-06-01",
    "incident_description": "Hospitalized for appendicitis surgery.",
}


@pytest.mark.skipif(not settings.sarvam_api_key, reason="requires SARVAM_API_KEY")
def test_policy_agent_extracts_real_policy_document():
    create_response = client.post("/api/v1/claims", json=CLAIM_PAYLOAD)
    claim_id = create_response.json()["claim_id"]

    with open(FIXTURES_DIR / "BuildFlow_Health.pdf", "rb") as pdf_file:
        upload_response = client.post(
            f"/api/v1/claims/{claim_id}/upload",
            files={"files": ("BuildFlow_Health.pdf", pdf_file, "application/pdf")},
            data={"document_type": "policy"},
        )
    assert upload_response.status_code == 200
    assert upload_response.json()["uploaded"]

    process_response = client.post(f"/api/v1/claims/{claim_id}/process")

    assert process_response.status_code == 200
    body = process_response.json()

    assert body["workflow_history"] == ["intake", "document", "supervisor", "policy"]
    assert body["policy_status"] == "extracted"

    policy = body["policy_result"]
    assert policy is not None
    assert policy["is_policy_document"] is True
    assert policy["policy_number"]
    assert policy["policy_holder"] or policy["insurance_company"]
    assert 0.0 <= policy["confidence"] <= 1.0
    assert policy["covered"] in (True, False)
