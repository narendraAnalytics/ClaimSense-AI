from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.core.config import settings
from app.main import app

client = TestClient(app)
FIXTURES_DIR = Path(__file__).parent / "fixtures"

CLAIM_PAYLOAD = {
    "policy_number": "POL-54321",
    "claimant_name": "Priya Sharma",
    "claim_type": "health",
    "incident_date": "2026-06-01",
    "incident_description": "Hospitalized for appendicitis surgery.",
}


@pytest.mark.skipif(not settings.sarvam_api_key, reason="requires SARVAM_API_KEY")
def test_document_intelligence_runs_against_real_sarvam_api():
    create_response = client.post("/api/v1/claims", json=CLAIM_PAYLOAD)
    claim_id = create_response.json()["claim_id"]

    with open(FIXTURES_DIR / "claim_form.pdf", "rb") as pdf_file:
        upload_response = client.post(
            f"/api/v1/claims/{claim_id}/upload",
            files={"files": ("claim_form.pdf", pdf_file, "application/pdf")},
            data={"document_type": "policy"},
        )
    assert upload_response.status_code == 200
    assert upload_response.json()["uploaded"]

    process_response = client.post(f"/api/v1/claims/{claim_id}/process")

    assert process_response.status_code == 200
    body = process_response.json()
    assert body["status"] == "processing"
    assert "document" in body["workflow_history"]
    assert body["document_status"] == "parsed"
    assert body["document_summary"]["parsed_count"] == 1
    assert body["document_summary"]["total_pages"] >= 1
