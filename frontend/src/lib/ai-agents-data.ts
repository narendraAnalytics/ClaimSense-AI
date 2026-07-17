export type AiAgent = {
  step: number;
  name: string;
  model: string;
  runsText: string;
  parallel: boolean;
  summary: string;
  detail: string;
  image: string;
};

export const aiAgents: AiAgent[] = [
  {
    step: 1,
    name: "Document Intelligence",
    model: "Sarvam Vision — OCR Job API",
    runsText: "First, before every other agent",
    parallel: false,
    summary: "Converts any scanned or photographed paperwork into clean, structured text every downstream agent can use.",
    detail:
      "OCRs every uploaded file — policy PDF, discharge summary, prescription, lab report, hospital bill, ID proof — into structured markdown and per-page block data via an async job pipeline (create job → upload → start → poll → download). Per-document failure isolation means one corrupt or unreadable file never stops the rest of the claim.",
    image:
      "https://res.cloudinary.com/dkqbzwicr/image/upload/v1784263448/DocumentIntelligenceagent_bshoni.png",
  },
  {
    step: 2,
    name: "Intake Supervisor",
    model: "Deterministic Python logic",
    runsText: "Second, immediately after Document Intelligence",
    parallel: false,
    summary: "Triages the claim and routes it forward at zero LLM cost.",
    detail:
      "Inspects the document set, stamps the claim PROCESSING, and routes it into Policy Coverage. It's the natural checkpoint for future logic — like short-circuiting a claim with no documents before four paid model calls run for nothing.",
    image:
      "https://res.cloudinary.com/dkqbzwicr/image/upload/v1784263447/IntakeSupervisorAgent_wvx3yb.png",
  },
  {
    step: 3,
    name: "Policy Coverage",
    model: "Sarvam-30B — structured JSON output",
    runsText: "Third, after Intake Supervisor",
    parallel: false,
    summary: "Answers \"is this covered, and under what limits?\" straight from the policy wording.",
    detail:
      "Extracts coverage decision, sum insured, deductible, copayment, policy period, and exclusions relevant to the claim from the OCR'd policy document — with a one-shot repair retry if the model's JSON output is malformed.",
    image:
      "https://res.cloudinary.com/dkqbzwicr/image/upload/v1784263449/PolicyCoverageAgent_dj09sb.png",
  },
  {
    step: 4,
    name: "Medical Validation",
    model: "Sarvam-30B — structured JSON output",
    runsText: "Fourth, after Policy Coverage",
    parallel: false,
    summary: "Catches clinical inconsistency before it reaches Fraud Detection or a human reviewer.",
    detail:
      "Reads every discharge summary, lab report, prescription, and medical certificate attached to the claim together — not one document in isolation — validating diagnosis consistency and treatment appropriateness across all of them at once.",
    image:
      "https://res.cloudinary.com/dkqbzwicr/image/upload/v1784263448/medicalvalidationagent_ihyh6h.png",
  },
  {
    step: 5,
    name: "Billing Validation",
    model: "Sarvam-30B — structured JSON output",
    runsText: "Fifth, in parallel with Fraud Detection and Historical Similarity",
    parallel: true,
    summary: "Keeps the payable amount deterministic — never computed by the model.",
    detail:
      "The model itemizes per-line deductions with reasons, but the payable amount itself is always computed in Python as billed minus deductions — eliminating LLM arithmetic drift and bill padding from the number that actually matters.",
    image:
      "https://res.cloudinary.com/dkqbzwicr/image/upload/v1784263481/parallelfanoutthree_pao1w1.png",
  },
  {
    step: 6,
    name: "Fraud Detection",
    model: "Sarvam-30B — structured JSON output",
    runsText: "Fifth, in parallel with Billing Validation and Historical Similarity",
    parallel: true,
    summary: "Cross-checks the whole claim narrative and grades a real, auditable fraud risk.",
    detail:
      "The one agent that reasons over the entire claim rather than a single document — flags duplicate invoices, altered documents, suspicious timing, and narrative-vs-medical mismatches. fraud_level is derived in Python from fixed score thresholds, never self-reported by the model.",
    image:
      "https://res.cloudinary.com/dkqbzwicr/image/upload/v1784263481/parallelfanoutthree_pao1w1.png",
  },
  {
    step: 7,
    name: "Historical Similarity",
    model: "FastEmbed (BAAI/bge-small-en) + Qdrant",
    runsText: "Fifth, in parallel with Billing Validation and Fraud Detection",
    parallel: true,
    summary: "Surfaces precedent from every prior completed claim, instantly and for free.",
    detail:
      "Embeds a short summary of the current claim and searches Qdrant Cloud for the top 3 most similar prior claims — with a payload filter guaranteeing a claim can never match itself. No LLM call, no per-claim cost.",
    image:
      "https://res.cloudinary.com/dkqbzwicr/image/upload/v1784263481/parallelfanoutthree_pao1w1.png",
  },
  {
    step: 8,
    name: "Settlement Recommendation",
    model: "Deterministic Python rule cascade",
    runsText: "Eighth, after Billing, Fraud, and History all complete",
    parallel: false,
    summary: "A fully auditable rule cascade decides the number — never a black box.",
    detail:
      "Risk-bands the fraud score into Approve, Need Review, Manual Investigation, or SIU Review, then computes the recommended amount by deterministically applying deductible, copayment, and a sum-insured cap in a fixed, auditable order. Every outcome — even the strictest — still proceeds to Human Approval.",
    image:
      "https://res.cloudinary.com/dkqbzwicr/image/upload/v1784263476/settlementrecommendatioagent_tfq6pj.png",
  },
  {
    step: 9,
    name: "Human Approval",
    model: "LangGraph interrupt() — no model call",
    runsText: "Ninth, after Settlement Recommendation",
    parallel: false,
    summary: "Guarantees a human makes the final call on every single claim.",
    detail:
      "Genuinely pauses the graph — state checkpointed to Convex — and surfaces the full AI recommendation to a claims officer, who can approve, reject, or modify it. Nothing continues until that decision is submitted, even across a backend restart.",
    image:
      "https://res.cloudinary.com/dkqbzwicr/image/upload/v1784263449/humanapproval_hyknaz.png",
  },
  {
    step: 10,
    name: "Report Generation",
    model: "Deterministic PDF templating (fpdf2)",
    runsText: "Tenth and last",
    parallel: false,
    summary: "Produces the one adjuster-ready record everyone actually needs.",
    detail:
      "Builds a multi-section PDF — coverage, validation, fraud, similar claims, the AI's recommendation, and the officer's final decision — and uploads it straight to Convex File Storage. Also writes the claim's summary to Qdrant, making it discoverable by Historical Similarity on future claims.",
    image:
      "https://res.cloudinary.com/dkqbzwicr/image/upload/v1784263450/reportgenerationagent_mbdczj.png",
  },
];
