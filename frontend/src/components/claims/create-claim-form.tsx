"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { ArrowRight } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { createClaim } from "@/lib/backend-api";

const CLAIM_TYPES = ["health", "accident", "life", "property", "vehicle", "other"];

export function CreateClaimForm() {
  const router = useRouter();
  const createConvexClaim = useMutation(api.claims.create);
  const setBackendClaimId = useMutation(api.claims.setBackendClaimId);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [policyNumber] = useState(() => "POL-" + Date.now().toString(36).toUpperCase());

  return (
    <div className="w-full max-w-[520px] rounded-3xl border border-emerald-500/20 bg-white/70 p-8 shadow-[0_20px_60px_rgba(16,185,129,.15)] backdrop-blur-md">
      <h1 className="font-heading text-[26px] font-bold tracking-tight text-[#0c2b24]">
        New Claim
      </h1>
      <p className="mt-1.5 text-[15px] text-[#4c7d6e]">
        Enter the claim details to get started. You&apos;ll upload documents next.
      </p>

      <form
        className="mt-6 flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          setError(null);
          setSubmitting(true);

          const form = new FormData(event.currentTarget);
          const claimantName = String(form.get("claimantName") ?? "");
          const claimType = String(form.get("claimType") ?? "");
          const incidentDate = String(form.get("incidentDate") ?? "");
          const incidentDescription = String(form.get("incidentDescription") ?? "");

          void (async () => {
            try {
              const claimId = await createConvexClaim({
                policyNumber,
                claimantName,
                claimType,
                incidentDate,
                incidentDescription,
              });
              const backendClaim = await createClaim({
                policy_number: policyNumber,
                claimant_name: claimantName,
                claim_type: claimType,
                incident_date: incidentDate,
                incident_description: incidentDescription,
              });
              await setBackendClaimId({ claimId, backendClaimId: backendClaim.claim_id });
              router.push(`/claims/${claimId}`);
            } catch (err) {
              const message = err instanceof Error ? err.message : "";
              setError(
                message.includes("Free plan limit reached")
                  ? message
                  : "Could not create claim. Check your details and try again.",
              );
              setSubmitting(false);
            }
          })();
        }}
      >
        <label className="flex flex-col gap-1.5">
          <span className="text-[13.5px] font-semibold text-[#1c4a3f]">
            Policy Number <span className="font-normal text-[#4c7d6e]">(auto-generated)</span>
          </span>
          <input
            value={policyNumber}
            disabled
            readOnly
            className="cursor-not-allowed rounded-xl border border-emerald-500/25 bg-emerald-500/5 px-4 py-2.5 text-[15px] text-[#4c7d6e] outline-none"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[13.5px] font-semibold text-[#1c4a3f]">Claimant Name</span>
          <input
            name="claimantName"
            required
            placeholder="Full name"
            className="rounded-xl border border-emerald-500/25 bg-white/80 px-4 py-2.5 text-[15px] text-[#0c2b24] outline-none transition-colors focus:border-[#0e8a6d]"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[13.5px] font-semibold text-[#1c4a3f]">Claim Type</span>
          <select
            name="claimType"
            required
            defaultValue=""
            className="rounded-xl border border-emerald-500/25 bg-white/80 px-4 py-2.5 text-[15px] text-[#0c2b24] outline-none transition-colors focus:border-[#0e8a6d]"
          >
            <option value="" disabled>
              Select a claim type
            </option>
            {CLAIM_TYPES.map((type) => (
              <option key={type} value={type}>
                {type[0].toUpperCase() + type.slice(1)}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[13.5px] font-semibold text-[#1c4a3f]">Incident Date</span>
          <input
            name="incidentDate"
            type="date"
            required
            className="rounded-xl border border-emerald-500/25 bg-white/80 px-4 py-2.5 text-[15px] text-[#0c2b24] outline-none transition-colors focus:border-[#0e8a6d]"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[13.5px] font-semibold text-[#1c4a3f]">Incident Description</span>
          <textarea
            name="incidentDescription"
            required
            rows={4}
            placeholder="Describe what happened…"
            className="rounded-xl border border-emerald-500/25 bg-white/80 px-4 py-2.5 text-[15px] text-[#0c2b24] outline-none transition-colors focus:border-[#0e8a6d]"
          />
        </label>

        {error && (
          <p className="text-[13.5px] text-red-600">
            {error}
            {error.includes("Free plan limit reached") && (
              <>
                {" "}
                <Link href="/pricing" className="font-semibold underline">
                  Upgrade
                </Link>
              </>
            )}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="mt-1 inline-flex items-center justify-center gap-2.5 rounded-full bg-[linear-gradient(110deg,#0ea77a,#0ab6c4_45%,#0ea77a_90%)] bg-[length:250%_auto] px-6 py-3 text-[15.5px] font-bold text-white shadow-[0_12px_34px_rgba(14,167,122,.42)] transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Creating…" : "Create Claim"}
          {!submitting && <ArrowRight className="h-[16px] w-[16px]" />}
        </button>
      </form>
    </div>
  );
}
