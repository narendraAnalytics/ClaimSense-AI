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

EXPECTED_PREFIX = ["intake", "document", "supervisor", "policy", "medical"]
# billing/fraud/history run in parallel (fan out from medical), so their
# relative order within the superstep isn't guaranteed.
EXPECTED_PARALLEL_STAGES = {"billing", "fraud", "history"}
EXPECTED_SUFFIX = ["settlement", "report"]


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

    history = body["workflow_history"]
    assert history[:5] == EXPECTED_PREFIX
    assert set(history[5:8]) == EXPECTED_PARALLEL_STAGES
    assert history[8:] == EXPECTED_SUFFIX

    billing = body["billing_result"]
    assert billing is not None
    assert billing["payable_amount"] is not None
    assert billing["payable_amount"] >= 0

    fraud = body["fraud_result"]
    assert fraud is not None
    assert 0 <= fraud["fraud_score"] <= 100
    # The fixture claim's own narrative ("appendicitis surgery") doesn't
    # match the real medical documents (dengue fever) — this is a known,
    # deliberate mismatch in the test data used to verify Fraud actually
    # catches it: narrative_medical_consistency must come back false, the
    # score must be forced to at least the enforced floor (see
    # app/services/fraud.py::_NARRATIVE_MISMATCH_FRAUD_FLOOR), and a
    # narrative-mismatch red flag must be present.
    assert fraud["narrative_medical_consistency"] is False
    assert fraud["fraud_score"] >= 50
    assert any("narrative" in flag.lower() for flag in fraud["red_flags"])

    settlement = body["settlement_result"]
    assert settlement is not None
    assert settlement["approval_status"] in ("approve", "reject", "need_review")
    # A fraud score >= 50 lands in Settlement's existing need_review band
    # (30 <= fraud_score < 70) — confirms the fraud fix actually changes
    # the downstream settlement decision, not just an isolated field.
    assert settlement["approval_status"] == "need_review"

    report = body["report_result"]
    assert report is not None
    assert report["report_url"]
    assert Path(report["report_url"]).exists()

    download_response = client.get(f"/api/v1/claims/{claim_id}/report")
    assert download_response.status_code == 200
    assert download_response.headers["content-type"] == "application/pdf"
    assert len(download_response.content) > 0
