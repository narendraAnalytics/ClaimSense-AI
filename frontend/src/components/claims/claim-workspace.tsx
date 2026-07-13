"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { DocumentUploader } from "./document-uploader";
import { DocumentList } from "./document-list";
import { ProcessClaimButton } from "./process-claim-button";
import { ClaimResults } from "./claim-results";

export function ClaimWorkspace({ claimId }: { claimId: Id<"claims"> }) {
  const claim = useQuery(api.claims.get, { claimId });

  if (claim === undefined) {
    return <p className="text-[14.5px] text-[#4c7d6e]">Loading claim…</p>;
  }
  if (claim === null || !claim.backendClaimId) {
    return <p className="text-[14.5px] text-red-600">Claim not found or not fully created.</p>;
  }

  return (
    <div className="mx-auto flex w-full max-w-[720px] flex-col gap-6 px-6 py-10">
      <div>
        <h1 className="font-heading text-[26px] font-bold tracking-tight text-[#0c2b24]">
          {claim.claimNumber} — {claim.claimantName}
        </h1>
        <p className="mt-1 text-[14.5px] text-[#4c7d6e]">
          {claim.claimType} · Policy {claim.policyNumber} · {claim.incidentDate}
        </p>
        <p className="mt-1 text-[13.5px] text-[#4c7d6e]">{claim.incidentDescription}</p>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-[16px] font-semibold text-[#0c2b24]">Documents</h2>
        <DocumentUploader claimId={claimId} backendClaimId={claim.backendClaimId} />
        <DocumentList claimId={claimId} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-[16px] font-semibold text-[#0c2b24]">Process</h2>
        <ProcessClaimButton claimId={claimId} backendClaimId={claim.backendClaimId} />
      </section>

      <ClaimResults claim={claim} />
    </div>
  );
}
