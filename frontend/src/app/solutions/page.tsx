import Link from "next/link";
import { ArrowLeft, Sparkles, Workflow } from "lucide-react";
import { AuroraBackground } from "@/components/landing/aurora-background";
import { SiteHeader } from "@/components/landing/site-header";
import { solutions, personas } from "@/lib/solutions-data";

const BADGES = [
  "Coverage Validation",
  "Fraud Risk Scoring",
  "Precedent-Aware",
  "Human-in-the-Loop",
  "Audit Ready",
];

export default function SolutionsPage() {
  return (
    <div
      className="relative min-h-screen overflow-clip font-body"
      style={{
        background:
          "linear-gradient(160deg, #eafff5 0%, #e3fbf3 22%, #e9fbfa 42%, #fef3e7 66%, #fdeaf4 84%, #f2fbe8 100%)",
      }}
    >
      <AuroraBackground />
      <SiteHeader minimal />

      <div className="relative z-[1] pt-24">
        {/* Hero */}
        <section className="mx-auto flex max-w-[980px] flex-col items-center gap-4 px-6 pt-10 pb-8 text-center animate-cs-fade-up">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-500/28 bg-white/55 px-4 py-2 text-[13.5px] font-semibold tracking-wide text-[#0e8a6d] shadow-[0_4px_16px_rgba(16,185,129,.12)] backdrop-blur-sm">
            <Sparkles className="h-[15px] w-[15px]" />
            Solutions
          </span>
          <h1 className="font-heading text-[clamp(32px,5vw,52px)] leading-[1.08] font-extrabold tracking-tight text-balance text-[#0c2b24]">
            Purpose-Built for{" "}
            <span className="bg-[linear-gradient(100deg,#0ea77a_0%,#06b6d4_50%,#fb923c_100%)] bg-clip-text text-transparent">
              Every Stage of a Claim
            </span>
          </h1>
          <p className="max-w-[660px] text-pretty text-[16.5px] leading-relaxed text-[#33584e]">
            From the moment paperwork lands to the moment a claims officer signs off, ClaimSense AI
            replaces slow, manual review with fast, explainable, auditable decisions — without ever
            taking the human out of the loop.
          </p>

          <div className="mt-2 flex flex-wrap justify-center gap-2.5">
            {BADGES.map((label, i) => (
              <span
                key={label}
                className="rounded-full border border-emerald-500/25 bg-white/60 px-3.5 py-1.5 text-[12px] font-semibold text-[#0e8a6d] shadow-[0_4px_14px_rgba(12,60,48,.06)] backdrop-blur-sm animate-cs-float-sm"
                style={{ animationDelay: `${i * 0.25}s` }}
              >
                {label}
              </span>
            ))}
          </div>
        </section>

        {/* Solution cards */}
        <section className="mx-auto max-w-[1280px] px-6 pb-16">
          <div className="mx-auto mb-8 max-w-[640px] text-center">
            <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3.5 py-1.5 text-[12px] font-semibold text-cyan-700">
              What ClaimSense AI Solves
            </span>
            <h2 className="mt-3 font-heading text-[clamp(24px,3vw,34px)] font-bold text-[#0c2b24]">
              Six outcomes. One durable pipeline.
            </h2>
            <p className="mt-1.5 text-[14.5px] text-[#4c7d6e]">
              Each solution is backed by real agents from the pipeline — see the full workflow on
              the AI Agents page.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {solutions.map((s, i) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.title}
                  className="flex flex-col gap-4 rounded-[24px] border border-white/75 bg-gradient-to-b from-white/85 to-white/60 p-7 shadow-[0_20px_60px_rgba(12,60,48,.1),inset_0_1px_0_rgba(255,255,255,.9)] backdrop-blur-2xl animate-cs-fade-up"
                  style={{ animationDelay: `${i * 0.08}s` }}
                >
                  <span
                    className="flex h-12 w-12 items-center justify-center rounded-2xl"
                    style={{ backgroundColor: s.tint }}
                  >
                    <Icon className="h-6 w-6" style={{ color: s.color }} />
                  </span>

                  <h3 className="font-heading text-[19px] font-bold text-[#0c2b24]">{s.title}</h3>

                  <p className="text-[14.5px] leading-relaxed font-medium text-[#1c4a3f]">
                    {s.outcome}
                  </p>

                  <p className="border-t border-emerald-500/15 pt-3.5 text-[13.5px] leading-relaxed text-[#33584e]">
                    {s.detail}
                  </p>

                  <span
                    className="mt-auto w-fit rounded-full px-3 py-1 text-[11px] font-bold"
                    style={{ backgroundColor: s.tint, color: s.color }}
                  >
                    Powered by: {s.poweredBy}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Persona row */}
        <section className="mx-auto max-w-[1180px] px-6 pb-14">
          <div className="h-px w-full bg-emerald-500/15" />
          <div className="mx-auto mt-8 mb-6 max-w-[560px] text-center">
            <h2 className="font-heading text-[clamp(20px,2.4vw,26px)] font-bold text-[#0c2b24]">
              Built for every stakeholder
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {personas.map((p) => (
              <div
                key={p.title}
                className="rounded-2xl border border-emerald-500/15 bg-white/50 p-5 text-center backdrop-blur-sm"
              >
                <h4 className="font-heading text-[15px] font-bold text-[#0c2b24]">{p.title}</h4>
                <p className="mt-1.5 text-[13px] leading-relaxed text-[#4c7d6e]">{p.blurb}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="mx-auto h-px max-w-[1280px] bg-emerald-500/15" />
        <footer className="mx-auto flex max-w-[1280px] flex-col items-center gap-3 px-6 py-10 text-center">
          <span className="inline-flex items-center gap-2 text-[12px] text-[#5b8578]">
            <Workflow className="h-3.5 w-3.5" />
            Convex + LangGraph Powered
          </span>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-white/60 px-5 py-2.5 text-[14px] font-semibold text-[#0e8a6d] backdrop-blur-sm transition-all hover:border-[#0e8a6d] hover:bg-emerald-500/10"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </footer>
      </div>
    </div>
  );
}
