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

UPLOADS = [
    ("BuildFlow_Health.pdf", "policy"),
    ("Discharge_Summary_Rajesh_Kumar.pdf", "discharge_summary"),
    ("NewLife_Hospital_Prescription_Rajesh_Kumar.pdf", "prescription"),
    ("NewLife_Hospital_Lab_Report_Rajesh_Kumar.pdf", "lab_report"),
    ("NewLife_Hospital_Bill_Rajesh_Kumar.pdf", "hospital_bill"),
]

EXPECTED_WORKFLOW_HISTORY = [
    "intake",
    "document",
    "supervisor",
    "policy",
    "medical",
    "billing",
    "fraud",
    "history",
    "settlement",
    "report",
]


@pytest.mark.skipif(not settings.sarvam_api_key, reason="requires SARVAM_API_KEY")
def test_full_claim_pipeline_completes_all_nine_agents():
    create_response = client.post("/api/v1/claims", json=CLAIM_PAYLOAD)
    claim_id = create_response.json()["claim_id"]

    for filename, document_type in UPLOADS:
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

    assert body["workflow_history"] == EXPECTED_WORKFLOW_HISTORY

    billing = body["billing_result"]
    assert billing is not None
    assert billing["payable_amount"] is not None
    assert billing["payable_amount"] >= 0

    fraud = body["fraud_result"]
    assert fraud is not None
    assert 0 <= fraud["fraud_score"] <= 100

    settlement = body["settlement_result"]
    assert settlement is not None
    assert settlement["approval_status"] in ("approve", "reject", "need_review")

    report = body["report_result"]
    assert report is not None
    assert report["report_url"]
    assert Path(report["report_url"]).exists()

    download_response = client.get(f"/api/v1/claims/{claim_id}/report")
    assert download_response.status_code == 200
    assert download_response.headers["content-type"] == "application/pdf"
    assert len(download_response.content) > 0
