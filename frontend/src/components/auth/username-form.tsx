"use client";

import { useMutation } from "convex/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { api } from "../../../convex/_generated/api";

export function UsernameForm() {
  const setProfile = useMutation(api.users.setProfile);
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  return (
    <div className="w-full max-w-[420px] rounded-3xl border border-emerald-500/20 bg-white/70 p-8 shadow-[0_20px_60px_rgba(16,185,129,.15)] backdrop-blur-md">
      <h1 className="font-heading text-[28px] font-bold tracking-tight text-[#0c2b24]">
        One more step
      </h1>
      <p className="mt-1.5 text-[15px] text-[#4c7d6e]">
        Choose a username to finish setting up your account.
      </p>

      <form
        className="mt-6 flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          setError(null);
          setSubmitting(true);
          const formData = new FormData(event.currentTarget);
          const name = (formData.get("name") as string)?.trim();
          const phone = (formData.get("phone") as string)?.trim();
          if (!name) {
            setError("Please enter a username.");
            setSubmitting(false);
            return;
          }
          void setProfile({ name, phone: phone || undefined })
            .then(() => router.push("/"))
            .catch(() => setError("Something went wrong. Please try again."))
            .finally(() => setSubmitting(false));
        }}
      >
        <label className="flex flex-col gap-1.5">
          <span className="text-[13.5px] font-semibold text-[#1c4a3f]">Username</span>
          <input
            name="name"
            type="text"
            required
            placeholder="jane_doe"
            className="rounded-xl border border-emerald-500/25 bg-white/80 px-4 py-2.5 text-[15px] text-[#0c2b24] outline-none transition-colors focus:border-[#0e8a6d]"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[13.5px] font-semibold text-[#1c4a3f]">
            Phone number <span className="font-normal text-[#4c7d6e]">(optional)</span>
          </span>
          <input
            name="phone"
            type="tel"
            placeholder="+1 555 010 1234"
            className="rounded-xl border border-emerald-500/25 bg-white/80 px-4 py-2.5 text-[15px] text-[#0c2b24] outline-none transition-colors focus:border-[#0e8a6d]"
          />
        </label>

        {error && <p className="text-[13.5px] text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="mt-1 inline-flex items-center justify-center gap-2.5 rounded-full bg-[linear-gradient(110deg,#0ea77a,#0ab6c4_45%,#0ea77a_90%)] bg-[length:250%_auto] px-6 py-3 text-[15.5px] font-bold text-white shadow-[0_12px_34px_rgba(14,167,122,.42)] transition-all hover:-translate-y-0.5 hover:shadow-[0_18px_44px_rgba(14,167,122,.55)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Saving…" : "Continue"}
          {!submitting && <ArrowRight className="h-[16px] w-[16px]" />}
        </button>
      </form>
    </div>
  );
}
