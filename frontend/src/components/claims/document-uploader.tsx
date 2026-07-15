"use client";

import { useRef, useState } from "react";
import { useMutation } from "convex/react";
import { UploadCloud } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { DOCUMENT_TYPES, uploadDocument, type DocumentType } from "@/lib/backend-api";

const MAX_FILE_SIZE = 25 * 1024 * 1024;
const ACCEPTED_TYPES = ["application/pdf", "image/png", "image/jpeg", "image/webp"];

export function DocumentUploader({
  claimId,
  backendClaimId,
}: {
  claimId: Id<"claims">;
  backendClaimId: string;
}) {
  const generateUploadUrl = useMutation(api.documents.generateUploadUrl);
  const insertDocument = useMutation(api.documents.insert);
  const [documentType, setDocumentType] = useState<DocumentType>("policy");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [backendWarnings, setBackendWarnings] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);
    setBackendWarnings([]);
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        if (file.size > MAX_FILE_SIZE) {
          throw new Error(`${file.name} exceeds the 25MB limit`);
        }
        if (!ACCEPTED_TYPES.includes(file.type)) {
          throw new Error(`${file.name} is not a supported file type`);
        }

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
          documentType,
          backendUploaded: false,
        });

        try {
          await uploadDocument(backendClaimId, file, documentType);
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="rounded-2xl border border-emerald-500/20 bg-white/70 p-5 backdrop-blur-md">
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={documentType}
          onChange={(e) => setDocumentType(e.target.value as DocumentType)}
          className="rounded-xl border border-emerald-500/25 bg-white/80 px-3.5 py-2 text-[14px] text-[#0c2b24] outline-none focus:border-[#0e8a6d]"
        >
          {DOCUMENT_TYPES.map((type) => (
            <option key={type} value={type}>
              {type.replace(/_/g, " ")}
            </option>
          ))}
        </select>

        <label className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-[linear-gradient(110deg,#0ea77a,#0ab6c4_55%,#0ea77a)] bg-[length:220%_auto] px-5 py-2.5 text-[14.5px] font-semibold text-white shadow-[0_8px_24px_rgba(14,167,122,.3)] transition-all hover:bg-right">
          <UploadCloud className="h-[16px] w-[16px]" />
          {uploading ? "Uploading…" : "Upload PDF/Image"}
          <input
            ref={inputRef}
            type="file"
            multiple
            accept={ACCEPTED_TYPES.join(",")}
            disabled={uploading}
            className="hidden"
            onChange={(e) => void handleFiles(e.target.files)}
          />
        </label>
      </div>
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
