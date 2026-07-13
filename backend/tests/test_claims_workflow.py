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


def test_create_claim_does_not_run_pipeline():
    # As of checkpointing (app/graph/checkpointer.py), claim creation no
    # longer eagerly invokes the graph — doing so would create a completed
    # checkpoint under the claim's thread_id before any documents exist,
    # which would make the real /process call below resume into that
    # empty-document terminal state instead of processing real documents.
    response = client.post("/api/v1/claims", json=CLAIM_PAYLOAD)

    assert response.status_code == 200
    body = response.json()
    assert body["claim_id"]
    assert body["status"] == "new"


def test_process_claim_pauses_for_human_approval():
    create_response = client.post("/api/v1/claims", json=CLAIM_PAYLOAD)
    claim_id = create_response.json()["claim_id"]

    process_response = client.post(f"/api/v1/claims/{claim_id}/process")

    assert process_response.status_code == 200
    body = process_response.json()
    assert body["claim_id"] == claim_id
    # The graph now pauses at the human_approval interrupt() right after
    # settlement — report generation doesn't happen until an officer
    # decision is submitted via /decision (see test below).
    assert body["status"] == "awaiting_approval"
    history = body["workflow_history"]
    assert history[:5] == ["intake", "document", "supervisor", "policy", "medical"]
    # billing/fraud/history run in parallel (fan out from medical), so their
    # relative order within the superstep isn't guaranteed.
    assert set(history[5:8]) == {"billing", "fraud", "history"}
    assert history[8:] == ["settlement"]
    assert body["report_url"] is None
    # No documents attached in this test, so the document stage has nothing
    # to OCR and short-circuits without calling Sarvam.
    assert body["document_status"] == "parsed"
    assert body["errors"] == []


def test_decision_resumes_and_completes_report():
    create_response = client.post("/api/v1/claims", json=CLAIM_PAYLOAD)
    claim_id = create_response.json()["claim_id"]

    client.post(f"/api/v1/claims/{claim_id}/process")

    decision_response = client.post(
        f"/api/v1/claims/{claim_id}/decision",
        json={"decision": "approve", "modified_amount": None, "notes": "looks fine"},
    )

    assert decision_response.status_code == 200
    body = decision_response.json()
    assert body["status"] == "approved"
    assert body["workflow_history"][8:] == ["settlement", "human_approval", "report"]
    assert body["report_url"] is not None


def test_decision_without_pending_approval_returns_409():
    create_response = client.post("/api/v1/claims", json=CLAIM_PAYLOAD)
    claim_id = create_response.json()["claim_id"]

    # /process was never called, so the graph isn't paused at human_approval.
    decision_response = client.post(
        f"/api/v1/claims/{claim_id}/decision",
        json={"decision": "approve", "modified_amount": None, "notes": None},
    )

    assert decision_response.status_code == 409


def test_process_unknown_claim_returns_404():
    response = client.post("/api/v1/claims/does-not-exist/process")

    assert response.status_code == 404
