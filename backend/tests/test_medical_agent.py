from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.core.config import settings
from app.main import app

client = TestClient(app)
FIXTURES_DIR = Path(__file__).parent / "fixtures"

CLAIM_PAYLOAD = {
    "policy_number": "BF-HEALTH-2026",
    "claimant_name": "Rajesh Kumar",
    "claim_type": "health",
    "incident_date": "2026-06-01",
    "incident_description": "Hospitalized for appendicitis surgery.",
}

MEDICAL_UPLOADS = [
    ("Discharge_Summary_Rajesh_Kumar.pdf", "discharge_summary"),
    ("NewLife_Hospital_Prescription_Rajesh_Kumar.pdf", "prescription"),
    ("NewLife_Hospital_Lab_Report_Rajesh_Kumar.pdf", "lab_report"),
]


@pytest.mark.skipif(not settings.sarvam_api_key, reason="requires SARVAM_API_KEY")
def test_medical_agent_validates_real_medical_documents():
    create_response = client.post("/api/v1/claims", json=CLAIM_PAYLOAD)
    claim_id = create_response.json()["claim_id"]

    with open(FIXTURES_DIR / "BuildFlow_Health.pdf", "rb") as pdf_file:
        upload_response = client.post(
            f"/api/v1/claims/{claim_id}/upload",
            files={"files": ("BuildFlow_Health.pdf", pdf_file, "application/pdf")},
            data={"document_type": "policy"},
        )
    assert upload_response.status_code == 200

    for filename, document_type in MEDICAL_UPLOADS:
        with open(FIXTURES_DIR / filename, "rb") as pdf_file:
            upload_response = client.post(
                f"/api/v1/claims/{claim_id}/upload",
                files={"files": (filename, pdf_file, "application/pdf")},
                data={"document_type": document_type},
            )
        assert upload_response.status_code == 200
        assert upload_response.json()["uploaded"]

    process_response = client.post(f"/api/v1/claims/{claim_id}/process")

    assert process_response.status_code == 200
    body = process_response.json()

    history = body["workflow_history"]
    assert history[:5] == ["intake", "document", "supervisor", "policy", "medical"]
    # billing/fraud/history run in parallel (fan out from medical), so their
    # relative order within the superstep isn't guaranteed.
    assert set(history[5:8]) == {"billing", "fraud", "history"}
    assert history[8:] == ["settlement", "report"]
    assert body["medical_status"] == "validated"

    medical = body["medical_result"]
    assert medical is not None
    assert medical["diagnosis"]
    assert medical["treatment"]
    assert 0.0 <= medical["confidence"] <= 1.0
    assert medical["confidence"] > 0.8
    assert medical["clinical_consistency"] is True
