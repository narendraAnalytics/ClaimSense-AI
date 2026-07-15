const API_ROOT = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const API_BASE_URL = `${API_ROOT.replace(/\/$/, "")}/api/v1`;

export const DOCUMENT_TYPES = [
  "policy",
  "claim_form",
  "hospital_bill",
  "discharge_summary",
  "admission_note",
  "lab_report",
  "diagnostic_report",
  "prescription",
  "medical_certificate",
  "id_proof",
  "fir",
  "mlc",
  "accident_report",
  "photo",
  "video",
  "other",
] as const;

export type DocumentType = (typeof DOCUMENT_TYPES)[number];

export interface CreateClaimRequest {
  policy_number: string;
  claimant_name: string;
  claim_type: string;
  incident_date: string;
  incident_description: string;
}

export interface CreateClaimResponse {
  claim_id: string;
  status: string;
  created_at: string;
  message: string;
}

export interface UploadedDocument {
  document_id: string;
  filename: string;
  content_type: string;
  size: number;
  document_type: DocumentType;
  upload_status: string;
}

export interface UploadError {
  filename: string;
  error: string;
}

export interface UploadResponse {
  claim_id: string;
  uploaded: UploadedDocument[];
  errors: UploadError[];
  message: string;
}

// Mirrors backend/app/schemas/claim.py::ProcessClaimResponse
export interface ProcessClaimResponse {
  claim_id: string;
  status: string;
  workflow_history: string[];
  document_status: string;
  document_summary: Record<string, unknown>;
  policy_result: Record<string, unknown> | null;
  policy_status: string | null;
  medical_result: Record<string, unknown> | null;
  medical_status: string | null;
  billing_result: Record<string, unknown> | null;
  billing_status: string | null;
  fraud_result: Record<string, unknown> | null;
  fraud_status: string | null;
  historical_result: Record<string, unknown> | null;
  historical_status: string | null;
  settlement_result: Record<string, unknown> | null;
  settlement_status: string | null;
  report_result: Record<string, unknown> | null;
  report_status: string | null;
  report_url: string | null;
  errors: string[];
  message: string;
}

// claim.resultsJson is a stringified ProcessClaimResponse persisted by the
// frontend itself (create-claim-form.tsx/process-claim-button.tsx/
// claim-approval-panel.tsx) — parsing it in a render body without a guard
// means any unexpected/malformed payload crashes the whole component tree
// instead of degrading gracefully.
export function parseResultsJson(resultsJson: string | undefined): ProcessClaimResponse | null {
  if (!resultsJson) return null;
  try {
    return JSON.parse(resultsJson) as ProcessClaimResponse;
  } catch {
    return null;
  }
}

async function parseErrorBody(response: Response): Promise<string> {
  try {
    const body = await response.json();
    return body.detail ?? JSON.stringify(body);
  } catch {
    return response.statusText;
  }
}

export async function createClaim(
  payload: CreateClaimRequest,
): Promise<CreateClaimResponse> {
  const response = await fetch(`${API_BASE_URL}/claims`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(`Failed to create claim: ${await parseErrorBody(response)}`);
  }
  return response.json();
}

export async function uploadDocument(
  backendClaimId: string,
  file: File,
  documentType: DocumentType,
): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("files", file);
  formData.append("document_type", documentType);
  const response = await fetch(
    `${API_BASE_URL}/claims/${backendClaimId}/upload`,
    { method: "POST", body: formData },
  );
  if (!response.ok) {
    throw new Error(`Failed to upload document: ${await parseErrorBody(response)}`);
  }
  return response.json();
}

export async function processClaim(
  backendClaimId: string,
): Promise<ProcessClaimResponse> {
  const response = await fetch(
    `${API_BASE_URL}/claims/${backendClaimId}/process`,
    { method: "POST" },
  );
  if (!response.ok) {
    throw new Error(`Failed to process claim: ${await parseErrorBody(response)}`);
  }
  return response.json();
}

export interface OfficerDecisionRequest {
  decision: "approve" | "reject" | "modify";
  modified_amount?: number;
  notes?: string;
}

export async function submitDecision(
  backendClaimId: string,
  payload: OfficerDecisionRequest,
): Promise<ProcessClaimResponse> {
  const response = await fetch(
    `${API_BASE_URL}/claims/${backendClaimId}/decision`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );
  if (!response.ok) {
    throw new Error(`Failed to submit decision: ${await parseErrorBody(response)}`);
  }
  return response.json();
}

export function getReportUrl(backendClaimId: string): string {
  return `${API_BASE_URL}/claims/${backendClaimId}/report`;
}
