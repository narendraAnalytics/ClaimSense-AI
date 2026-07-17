import type { LucideIcon } from "lucide-react";
import {
  FileText,
  ShieldCheck,
  Activity,
  ShieldAlert,
  Network,
  CheckCircle2,
} from "lucide-react";

export type Solution = {
  title: string;
  outcome: string;
  detail: string;
  icon: LucideIcon;
  poweredBy: string;
  color: string;
  tint: string;
};

export const solutions: Solution[] = [
  {
    title: "Instant Document Understanding",
    outcome: "Turn any scanned claim packet into structured data in seconds.",
    detail:
      "Policy PDFs, discharge summaries, prescriptions, lab reports, and bills are OCR'd and structured automatically — no manual data entry, no bottleneck waiting on a human to transcribe paperwork.",
    icon: FileText,
    poweredBy: "Document Intelligence Agent",
    color: "#0ea77a",
    tint: "rgba(16,185,129,.14)",
  },
  {
    title: "Automated Coverage Validation",
    outcome: "Know what's covered, and under what limits, straight from the policy.",
    detail:
      "Sum insured, deductible, copayment, policy period, and exclusions are extracted and checked against the claim automatically, replacing hours of manual policy-wording review.",
    icon: ShieldCheck,
    poweredBy: "Policy Coverage Agent",
    color: "#0891b2",
    tint: "rgba(34,211,238,.14)",
  },
  {
    title: "Clinical & Billing Accuracy",
    outcome: "Catch inconsistency before it becomes an overpayment.",
    detail:
      "Every medical document on a claim is cross-checked together for diagnosis and treatment consistency, while the payable amount is always computed deterministically — never left to model arithmetic.",
    icon: Activity,
    poweredBy: "Medical + Billing Validation Agents",
    color: "#d97706",
    tint: "rgba(245,158,11,.15)",
  },
  {
    title: "Real-Time Fraud Risk Scoring",
    outcome: "A transparent, auditable risk score on every claim.",
    detail:
      "Duplicate invoices, altered documents, suspicious timing, and narrative mismatches are flagged with a 0-100 score whose risk band is derived from fixed thresholds, never self-reported by the model.",
    icon: ShieldAlert,
    poweredBy: "Fraud Detection Agent",
    color: "#e11d48",
    tint: "rgba(251,113,133,.14)",
  },
  {
    title: "Precedent-Aware Settlements",
    outcome: "Every recommendation is grounded in what happened before.",
    detail:
      "Semantic search surfaces the most similar prior claims instantly, and a fixed rule cascade — not a black box — applies deductible, copayment, and sum-insured caps to compute the recommended amount.",
    icon: Network,
    poweredBy: "Historical Similarity + Settlement Recommendation Agents",
    color: "#db2777",
    tint: "rgba(219,39,119,.14)",
  },
  {
    title: "Human-in-the-Loop Assurance",
    outcome: "Nothing is finalized without a person signing off.",
    detail:
      "Every AI recommendation pauses for a claims officer's decision — approve, reject, or modify — before a single adjuster-ready report is generated, keeping a full audit trail on every outcome.",
    icon: CheckCircle2,
    poweredBy: "Human Approval + Report Generation Agents",
    color: "#0a6b55",
    tint: "rgba(10,107,85,.14)",
  },
];

export type Persona = {
  title: string;
  blurb: string;
};

export const personas: Persona[] = [
  {
    title: "Insurers",
    blurb: "Cut claims processing time while keeping every decision explainable and auditable.",
  },
  {
    title: "TPAs & Adjusters",
    blurb: "Skip manual document review and get a decision-ready package for every claim.",
  },
  {
    title: "SIU & Fraud Teams",
    blurb: "Prioritize investigation effort with a transparent, threshold-based risk score.",
  },
  {
    title: "Policyholders",
    blurb: "Faster, more consistent settlement decisions backed by a human review, every time.",
  },
];
