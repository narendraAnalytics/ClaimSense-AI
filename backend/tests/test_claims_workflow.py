from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

CLAIM_PAYLOAD = {
    "policy_number": "POL-12345",
    "claimant_name": "Jane Doe",
    "claim_type": "health",
    "incident_date": "2026-01-15",
    "incident_description": "Hospitalized for appendicitis surgery.",
}


def test_create_claim_runs_orchestration():
    response = client.post("/api/v1/claims", json=CLAIM_PAYLOAD)

    assert response.status_code == 200
    body = response.json()
    assert body["claim_id"]
    assert body["status"] == "processing"
    assert "intake -> document -> supervisor -> policy" in body["message"]


def test_process_claim_completes_full_workflow_history():
    create_response = client.post("/api/v1/claims", json=CLAIM_PAYLOAD)
    claim_id = create_response.json()["claim_id"]

    process_response = client.post(f"/api/v1/claims/{claim_id}/process")

    assert process_response.status_code == 200
    body = process_response.json()
    assert body["claim_id"] == claim_id
    assert body["status"] == "processing"
    assert body["workflow_history"] == ["intake", "document", "supervisor", "policy"]
    # No documents attached in this test, so the document stage has nothing
    # to OCR and short-circuits without calling Sarvam.
    assert body["document_status"] == "parsed"
    assert body["errors"] == []


def test_process_unknown_claim_returns_404():
    response = client.post("/api/v1/claims/does-not-exist/process")

    assert response.status_code == 404
