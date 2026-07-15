from datetime import datetime, timezone

from fpdf import FPDF
from fpdf.enums import XPos, YPos

from app.core.constants import SettlementDecision
from app.core.logger import logger
from app.graph.state import ClaimState
from app.models.report import ReportResult
from app.services import convex_registry, history_store, storage

# Displayed labels only — the underlying SettlementDecision values ("approve"/
# "reject"/"need_review") are unchanged; production insurance workflows have
# the AI recommend/flag, not issue an absolute "reject", so the report/UI
# never shows that raw value directly.
_DECISION_LABELS = {
    SettlementDecision.APPROVE: "Approved",
    SettlementDecision.REJECT: "High Risk - Manual Review Required",
    SettlementDecision.NEED_REVIEW: "Manual Review Required",
}


class ReportGenerationError(Exception):
    pass


def _sanitize(text: str) -> str:
    # The core "helvetica" font only supports Latin-1 — LLM-generated
    # reasoning text can contain smart quotes, em dashes, currency symbols,
    # etc. that would otherwise crash fpdf2's renderer mid-report.
    return text.encode("latin-1", "replace").decode("latin-1")


def _add_heading(pdf: FPDF, text: str) -> None:
    pdf.set_font("helvetica", style="B", size=13)
    pdf.ln(4)
    pdf.multi_cell(0, 8, _sanitize(text), new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.set_font("helvetica", size=10)


def _add_line(pdf: FPDF, text: str) -> None:
    pdf.multi_cell(0, 6, _sanitize(text), new_x=XPos.LMARGIN, new_y=YPos.NEXT)


def _build_pdf(state: ClaimState) -> FPDF:
    claim = state["claim"]
    policy_result = state.get("policy_result")
    medical_result = state.get("medical_result")
    billing_result = state.get("billing_result")
    fraud_result = state.get("fraud_result")
    historical_result = state.get("historical_result")
    settlement_result = state.get("settlement_result")

    pdf = FPDF()
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.add_page()

    pdf.set_font("helvetica", style="B", size=16)
    pdf.multi_cell(0, 10, "ClaimSense AI - Claim Assessment Report", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.set_font("helvetica", size=10)
    pdf.multi_cell(
        0,
        6,
        f"Claim ID: {claim.claim_id}    Generated: {datetime.now(timezone.utc).isoformat()}",
        new_x=XPos.LMARGIN,
        new_y=YPos.NEXT,
    )

    _add_heading(pdf, "Executive Summary")
    decision_label = (
        _DECISION_LABELS.get(settlement_result.approval_status, "Unknown") if settlement_result else "Unknown"
    )
    amount = settlement_result.recommended_amount if settlement_result else None
    _add_line(
        pdf,
        f"Claimant: {claim.claimant_name} | Policy: {claim.policy_number} | Type: {claim.claim_type}\n"
        f"Recommended decision: {decision_label}"
        + (f" | Recommended amount: {amount:,.2f}" if amount is not None else ""),
    )
    if settlement_result:
        _add_line(pdf, settlement_result.reasoning)

    _add_heading(pdf, "Timeline")
    _add_line(pdf, " -> ".join(state.get("workflow_history", [])))
    _add_line(pdf, f"Incident date: {claim.incident_date}")

    _add_heading(pdf, "Documents Reviewed")
    doc_summary = state.get("document_summary", {})
    _add_line(
        pdf,
        f"{doc_summary.get('document_count', 0)} document(s) uploaded, "
        f"{doc_summary.get('parsed_count', 0)} parsed successfully, "
        f"{doc_summary.get('total_pages', 0)} total pages.",
    )

    _add_heading(pdf, "Policy Findings")
    if policy_result:
        _add_line(
            pdf,
            f"Policy number: {policy_result.policy_number or 'n/a'} | Covered: {policy_result.covered}\n"
            f"{policy_result.reasoning}",
        )
    else:
        _add_line(pdf, "No policy document was available for review.")

    _add_heading(pdf, "Medical Findings")
    if medical_result:
        _add_line(
            pdf,
            f"Diagnosis: {medical_result.diagnosis or 'n/a'} | Treatment: {medical_result.treatment or 'n/a'}\n"
            f"Clinical consistency: {medical_result.clinical_consistency}\n"
            f"{medical_result.reasoning}",
        )
    else:
        _add_line(pdf, "No medical documents were available for review.")

    _add_heading(pdf, "Billing Findings")
    if billing_result:
        _add_line(
            pdf,
            f"Total billed: {billing_result.total_billed_amount} | Payable: {billing_result.payable_amount}\n"
            f"Non-payable items: {', '.join(billing_result.non_payable_items) or 'none'}\n"
            f"{billing_result.reasoning}",
        )
    else:
        _add_line(pdf, "No hospital bill was available for review.")

    _add_heading(pdf, "Fraud Findings")
    if fraud_result:
        _add_line(
            pdf,
            f"Fraud score: {fraud_result.fraud_score}/100 ({fraud_result.fraud_level.value})\n"
            f"Red flags: {', '.join(fraud_result.red_flags) or 'none'}\n"
            f"{fraud_result.reasoning}",
        )
    else:
        _add_line(pdf, "Fraud assessment was not completed.")

    _add_heading(pdf, "Historical Similarity")
    if historical_result:
        _add_line(pdf, historical_result.historical_summary)
    else:
        _add_line(pdf, "No historical comparison was performed.")

    _add_heading(pdf, "Settlement Recommendation")
    if settlement_result:
        _add_line(
            pdf,
            f"Decision: {_DECISION_LABELS.get(settlement_result.approval_status, 'Unknown')} | "
            f"Recommended amount: {settlement_result.recommended_amount}\n"
            f"Confidence: {settlement_result.confidence}\n"
            f"Contributing factors: {', '.join(settlement_result.contributing_factors)}",
        )
    else:
        _add_line(pdf, "No settlement recommendation was produced.")

    _add_heading(pdf, "Final Decision (Claims Officer)")
    human_decision = state.get("human_decision")
    if human_decision:
        final_amount = state.get("human_amount")
        if final_amount is None and settlement_result:
            final_amount = settlement_result.recommended_amount
        decided_at = state.get("human_decided_at")
        _add_line(
            pdf,
            f"Officer decision: {human_decision.capitalize()} | "
            f"Final amount: {final_amount if final_amount is not None else 'n/a'}\n"
            f"Notes: {state.get('human_notes') or 'none'}\n"
            f"Decided at: {decided_at.isoformat() if decided_at else 'n/a'}",
        )
    else:
        _add_line(pdf, "No claims officer decision was recorded for this claim.")

    return pdf


async def generate_report(state: ClaimState) -> ReportResult:
    claim = state["claim"]
    try:
        pdf = _build_pdf(state)
        pdf_bytes = bytes(pdf.output())
        page_count = pdf.page_no()

        storage_id = await storage.upload_file_bytes(
            pdf_bytes, f"{claim.claim_id}.pdf", "application/pdf"
        )
        await convex_registry.set_report_storage_id(claim.claim_id, storage_id)
        report_url = await storage.get_file_url(storage_id)

        settlement_result = state.get("settlement_result")
        human_decision = state.get("human_decision")
        final_amount = state.get("human_amount")
        if final_amount is None and settlement_result:
            final_amount = settlement_result.recommended_amount

        # Log the human-decided outcome (the true final result), not the AI's
        # raw recommendation — that's what should inform future
        # historical-similarity matches.
        final_decision = human_decision or (settlement_result.approval_status.value if settlement_result else None)

        history_store.save_claim_summary(
            {
                "claim_id": claim.claim_id,
                "diagnosis": state["medical_result"].diagnosis if state.get("medical_result") else None,
                "claim_type": claim.claim_type,
                "policy_number": claim.policy_number,
                "payable_amount": final_amount,
                "fraud_score": state.get("fraud_score"),
                "settlement_decision": final_decision,
                "incident_date": str(claim.incident_date),
            }
        )

        return ReportResult(
            claim_id=claim.claim_id,
            report_url=report_url,
            page_count=page_count,
            processed_at=datetime.now(timezone.utc),
        )
    except Exception as exc:
        logger.error(f"[report] generation failed for claim {claim.claim_id}: {exc}")
        raise ReportGenerationError(f"PDF report generation failed: {exc}") from exc
