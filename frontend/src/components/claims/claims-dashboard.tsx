"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { Plus, FileText } from "lucide-react";
import { api } from "../../../convex/_generated/api";

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-neutral-500/10 text-neutral-600",
  uploaded: "bg-cyan-500/10 text-cyan-700",
  processing: "bg-amber-500/10 text-amber-700",
  completed: "bg-emerald-500/10 text-emerald-700",
  failed: "bg-red-500/10 text-red-700",
};

export function ClaimsDashboard() {
  const claims = useQuery(api.claims.listMine);

  return (
    <div className="mx-auto w-full max-w-[900px] px-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-[28px] font-bold tracking-tight text-[#0c2b24]">
            My Claims
          </h1>
          <p className="mt-1 text-[15px] text-[#4c7d6e]">
            Submit and track your insurance claims.
          </p>
        </div>
        <Link
          href="/claims/new"
          className="inline-flex items-center gap-2 rounded-full bg-[linear-gradient(110deg,#0ea77a,#0ab6c4_55%,#0ea77a)] bg-[length:220%_auto] px-5 py-2.5 text-[15px] font-semibold text-white shadow-[0_8px_24px_rgba(14,167,122,.35)] transition-all hover:bg-right"
        >
          <Plus className="h-[18px] w-[18px]" />
          New Claim
        </Link>
      </div>

      <div className="mt-8 flex flex-col gap-3">
        {claims === undefined && (
          <p className="text-[14.5px] text-[#4c7d6e]">Loading claims…</p>
        )}
        {claims?.length === 0 && (
          <div className="rounded-3xl border border-emerald-500/20 bg-white/70 p-10 text-center backdrop-blur-md">
            <FileText className="mx-auto h-10 w-10 text-emerald-500/50" />
            <p className="mt-3 text-[15px] text-[#4c7d6e]">
              No claims yet. Create your first claim to get started.
            </p>
          </div>
        )}
        {claims?.map((claim) => (
          <Link
            key={claim._id}
            href={`/claims/${claim._id}`}
            className="flex items-center justify-between rounded-2xl border border-emerald-500/20 bg-white/70 p-5 backdrop-blur-md transition-colors hover:border-[#0e8a6d]/40"
          >
            <div>
              <p className="text-[15.5px] font-semibold text-[#0c2b24]">
                {claim.claimNumber} — {claim.claimantName}
              </p>
              <p className="mt-0.5 text-[13.5px] text-[#4c7d6e]">
                {claim.claimType} · Policy {claim.policyNumber} ·{" "}
                {new Date(claim.createdAt).toLocaleDateString()}
              </p>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-[12.5px] font-semibold capitalize ${STATUS_STYLES[claim.status] ?? STATUS_STYLES.draft}`}
            >
              {claim.status}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
