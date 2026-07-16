"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { UploadCloud, X } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { DOCUMENT_TYPES, uploadDocument, type DocumentType } from "@/lib/backend-api";

const MAX_FILE_SIZE = 25 * 1024 * 1024;
const ACCEPTED_TYPES = ["application/pdf", "image/png", "image/jpeg", "image/webp"];

type StagedFile = { key: string; file: File; type: DocumentType };

export function DocumentUploader({
  claimId,
  backendClaimId,
}: {
  claimId: Id<"claims">;
  backendClaimId: string;
}) {
  const generateUploadUrl = useMutation(api.documents.generateUploadUrl);
  const insertDocument = useMutation(api.documents.insert);
  const existingDocs = useQuery(api.documents.listByClaim, { claimId });
  const usage = useQuery(api.claims.getUsage);
  const [stagedFiles, setStagedFiles] = useState<StagedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [backendWarnings, setBackendWarnings] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const docsLimit = usage?.docsLimitPerClaim ?? null;
  const docsUsed = existingDocs?.length ?? 0;
  const atDocsLimit = docsLimit !== null && docsUsed + stagedFiles.length >= docsLimit;

  function stageFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);
    try {
      const next: StagedFile[] = [];
      for (const file of Array.from(files)) {
        if (file.size > MAX_FILE_SIZE) {
          throw new Error(`${file.name} exceeds the 25MB limit`);
        }
        if (!ACCEPTED_TYPES.includes(file.type)) {
          throw new Error(`${file.name} is not a supported file type`);
        }
        if (docsLimit !== null && docsUsed + stagedFiles.length + next.length >= docsLimit) {
          throw new Error(
            `Free plan limit reached: ${docsLimit} document(s) per claim. Upgrade to Pro or Plus for more.`,
          );
        }
        next.push({
          key: `${file.name}-${file.size}-${file.lastModified}-${Math.random()}`,
          file,
          type: "other",
        });
      }
      setStagedFiles((prev) => [...prev, ...next]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add file(s)");
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function updateStagedType(key: string, type: DocumentType) {
    setStagedFiles((prev) => prev.map((sf) => (sf.key === key ? { ...sf, type } : sf)));
  }

  function removeStaged(key: string) {
    setStagedFiles((prev) => prev.filter((sf) => sf.key !== key));
  }

  async function handleUploadAll() {
    if (stagedFiles.length === 0) return;
    setError(null);
    setBackendWarnings([]);
    setUploading(true);
    try {
      for (const { file, type } of stagedFiles) {
        const uploadUrl = await generateUploadUrl({ claimId });
        const result = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": file.type },
          body: file,
        });
        if (!result.ok) throw new Error(`Failed to store ${file.name}`);
        const { storageId } = await result.json();

        await insertDocument({
          claimId,
          storageId,
          filename: file.name,
          mimeType: file.type,
          size: file.size,
          documentType: type,
          backendUploaded: false,
        });

        try {
          await uploadDocument(backendClaimId, file, type);
        } catch (err) {
          // Stored in Convex; don't block the rest of the batch, but this
          // document will never actually be processed until it reaches the
          // backend — silently leaving it as a permanent "Pending" clock icon
          // (document-list.tsx) with no explanation was the actual root
          // cause of a "no fraud score / no report" bug report, so surface
          // it visibly instead.
          const message = err instanceof Error ? err.message : "unknown error";
          setBackendWarnings((prev) => [
            ...prev,
            `${file.name}: not received by the processing backend (${message}) — it will not be included when you click Process Claim.`,
          ]);
        }
      }
      setStagedFiles([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-emerald-500/20 bg-white/70 p-5 backdrop-blur-md">
      <div className="flex flex-wrap items-center gap-3">
        <label
          className={`inline-flex items-center gap-2 rounded-full bg-[linear-gradient(110deg,#0ea77a,#0ab6c4_55%,#0ea77a)] bg-[length:220%_auto] px-5 py-2.5 text-[14.5px] font-semibold text-white shadow-[0_8px_24px_rgba(14,167,122,.3)] transition-all hover:bg-right ${
            uploading || atDocsLimit ? "cursor-not-allowed opacity-60" : "cursor-pointer"
          }`}
        >
          <UploadCloud className="h-[16px] w-[16px]" />
          Select PDF/Image(s)
          <input
            ref={inputRef}
            type="file"
            multiple
            accept={ACCEPTED_TYPES.join(",")}
            disabled={uploading || atDocsLimit}
            className="hidden"
            onChange={(e) => stageFiles(e.target.files)}
          />
        </label>
        {docsLimit !== null && (
          <span className="text-[13px] text-[#4c7d6e]">
            {docsUsed}/{docsLimit} documents
            {atDocsLimit && (
              <>
                {" — "}
                <Link href="/pricing" className="font-semibold text-[#0e8a6d] underline">
                  Upgrade
                </Link>
              </>
            )}
          </span>
        )}
      </div>

      {stagedFiles.length > 0 && (
        <div className="mt-4 flex flex-col gap-2">
          <p className="text-[12.5px] font-medium text-[#4c7d6e]">
            Set the document type for each file, then upload.
          </p>
          {stagedFiles.map((sf) => (
            <div
              key={sf.key}
              className="flex flex-wrap items-center gap-2.5 rounded-xl border border-emerald-500/15 bg-white/60 px-3 py-2"
            >
              <span className="min-w-0 flex-1 truncate text-[13.5px] text-[#0c2b24]">{sf.file.name}</span>
              <select
                value={sf.type}
                onChange={(e) => updateStagedType(sf.key, e.target.value as DocumentType)}
                disabled={uploading}
                className="rounded-lg border border-emerald-500/25 bg-white/80 px-2.5 py-1.5 text-[13px] text-[#0c2b24] outline-none focus:border-[#0e8a6d]"
              >
                {DOCUMENT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => removeStaged(sf.key)}
                disabled={uploading}
                aria-label={`Remove ${sf.file.name}`}
                className="flex h-7 w-7 items-center justify-center rounded-full text-[#4c7d6e] transition-colors hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <X className="h-[14px] w-[14px]" />
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={() => void handleUploadAll()}
            disabled={uploading}
            className="mt-1 inline-flex w-fit items-center gap-2 rounded-full bg-[#0e8a6d] px-5 py-2.5 text-[14.5px] font-semibold text-white transition-all disabled:cursor-not-allowed disabled:opacity-60"
          >
            <UploadCloud className="h-[16px] w-[16px]" />
            {uploading ? "Uploading…" : `Upload All ${stagedFiles.length} File${stagedFiles.length === 1 ? "" : "s"}`}
          </button>
        </div>
      )}

      {error && <p className="mt-3 text-[13.5px] text-red-600">{error}</p>}
      {backendWarnings.length > 0 && (
        <div className="mt-3 flex flex-col gap-1">
          {backendWarnings.map((warning, idx) => (
            <p key={idx} className="text-[13.5px] text-amber-600">
              {warning}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
