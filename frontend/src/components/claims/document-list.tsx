"use client";

import { useMutation, useQuery } from "convex/react";
import { FileText, Trash2, CheckCircle2, Clock } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

export function DocumentList({ claimId }: { claimId: Id<"claims"> }) {
  const documents = useQuery(api.documents.listByClaim, { claimId });
  const removeDocument = useMutation(api.documents.remove);

  if (!documents || documents.length === 0) {
    return (
      <p className="text-[14px] text-[#4c7d6e]">No documents uploaded yet.</p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {documents.map((doc) => (
        <div
          key={doc._id}
          className="flex items-center justify-between rounded-xl border border-emerald-500/15 bg-white/60 px-4 py-3"
        >
          <div className="flex items-center gap-3">
            <FileText className="h-[18px] w-[18px] text-emerald-600/70" />
            <div>
              <p className="text-[14.5px] font-medium text-[#0c2b24]">{doc.filename}</p>
              <p className="text-[12.5px] text-[#4c7d6e] capitalize">
                {doc.documentType.replace(/_/g, " ")} · {(doc.size / 1024).toFixed(0)} KB
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {doc.backendUploaded ? (
              <CheckCircle2
                className="h-[18px] w-[18px] text-emerald-600"
                aria-label="Sent to backend"
              />
            ) : (
              <Clock className="h-[18px] w-[18px] text-amber-500" aria-label="Pending backend delivery" />
            )}
            <button
              type="button"
              onClick={() => void removeDocument({ documentId: doc._id })}
              className="text-[#4c7d6e] hover:text-red-600"
              aria-label={`Remove ${doc.filename}`}
            >
              <Trash2 className="h-[17px] w-[17px]" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
