"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";

export function SignInForm() {
  const { signIn } = useAuthActions();
  const router = useRouter();
  const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  return (
    <div className="w-full max-w-[420px] rounded-3xl border border-emerald-500/20 bg-white/70 p-8 shadow-[0_20px_60px_rgba(16,185,129,.15)] backdrop-blur-md">
      <h1 className="font-heading text-[28px] font-bold tracking-tight text-[#0c2b24]">
        {flow === "signIn" ? "Welcome back" : "Create your account"}
      </h1>
      <p className="mt-1.5 text-[15px] text-[#4c7d6e]">
        {flow === "signIn"
          ? "Sign in to continue to ClaimSense AI."
          : "Start your free trial of ClaimSense AI."}
      </p>

      <form
        className="mt-6 flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          setError(null);
          setSubmitting(true);
          const formData = new FormData(event.currentTarget);
          void signIn("password", formData)
            .then(() => router.push("/"))
            .catch(() => setError("Something went wrong. Check your details and try again."))
            .finally(() => setSubmitting(false));
        }}
      >
        <label className="flex flex-col gap-1.5">
          <span className="text-[13.5px] font-semibold text-[#1c4a3f]">Email</span>
          <input
            name="email"
            type="email"
            required
            placeholder="you@company.com"
            className="rounded-xl border border-emerald-500/25 bg-white/80 px-4 py-2.5 text-[15px] text-[#0c2b24] outline-none transition-colors focus:border-[#0e8a6d]"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[13.5px] font-semibold text-[#1c4a3f]">Password</span>
          <input
            name="password"
            type="password"
            required
            placeholder="••••••••"
            className="rounded-xl border border-emerald-500/25 bg-white/80 px-4 py-2.5 text-[15px] text-[#0c2b24] outline-none transition-colors focus:border-[#0e8a6d]"
          />
        </label>
        <input name="flow" type="hidden" value={flow} />

        {error && <p className="text-[13.5px] text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="mt-1 inline-flex items-center justify-center gap-2.5 rounded-full bg-[linear-gradient(110deg,#0ea77a,#0ab6c4_45%,#0ea77a_90%)] bg-[length:250%_auto] px-6 py-3 text-[15.5px] font-bold text-white shadow-[0_12px_34px_rgba(14,167,122,.42)] transition-all hover:-translate-y-0.5 hover:shadow-[0_18px_44px_rgba(14,167,122,.55)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Please wait…" : flow === "signIn" ? "Sign in" : "Sign up"}
          {!submitting && <ArrowRight className="h-[16px] w-[16px]" />}
        </button>
      </form>

      <div className="my-5 flex items-center gap-3">
        <div className="h-px flex-1 bg-emerald-500/20" />
        <span className="text-[13px] text-[#4c7d6e]">or</span>
        <div className="h-px flex-1 bg-emerald-500/20" />
      </div>

      <button
        type="button"
        onClick={() => void signIn("google").then(() => router.push("/"))}
        className="inline-flex w-full items-center justify-center gap-2.5 rounded-full border-[1.5px] border-[#0e8a6d]/40 bg-white/50 px-6 py-3 text-[15.5px] font-semibold text-[#0e8a6d] backdrop-blur-sm transition-all hover:border-[#0e8a6d] hover:bg-emerald-500/10 hover:text-[#0a6b55]"
      >
        Continue with Google
      </button>

      <button
        type="button"
        onClick={() => setFlow(flow === "signIn" ? "signUp" : "signIn")}
        className="mt-5 w-full text-center text-[14px] font-medium text-[#2c5c50] hover:text-[#0a6b55]"
      >
        {flow === "signIn"
          ? "Don't have an account? Sign up"
          : "Already have an account? Sign in"}
      </button>
    </div>
  );
}
