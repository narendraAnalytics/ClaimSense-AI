"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ChevronLeft, ChevronRight, Workflow, Sparkles } from "lucide-react";
import { AuroraBackground } from "@/components/landing/aurora-background";
import { SiteHeader } from "@/components/landing/site-header";
import { aiAgents } from "@/lib/ai-agents-data";

const BADGES = [
  "Checkpointed",
  "Human-in-the-Loop",
  "Parallel Processing",
  "Deterministic Decisions",
  "Audit Ready",
];

export default function AiAgentsPage() {
  const [active, setActive] = useState(0);
  const total = aiAgents.length;

  const goTo = (i: number) => setActive(((i % total) + total) % total);
  const prev = () => goTo(active - 1);
  const next = () => goTo(active + 1);

  const agent = aiAgents[active];

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
            LangGraph Orchestration
          </span>
          <h1 className="font-heading text-[clamp(32px,5vw,52px)] leading-[1.08] font-extrabold tracking-tight text-balance text-[#0c2b24]">
            Intelligent AI Agents{" "}
            <span className="bg-[linear-gradient(100deg,#0ea77a_0%,#06b6d4_50%,#fb923c_100%)] bg-clip-text text-transparent">
              Working Together
            </span>
          </h1>
          <p className="max-w-[660px] text-pretty text-[16.5px] leading-relaxed text-[#33584e]">
            Ten specialized agents run as one durable, resumable LangGraph workflow per claim —
            checkpointed to Convex so a claim can pause for days awaiting a human decision and
            resume exactly where it left off. Seven stages run in strict sequence, three run in
            genuine parallel, and every recommendation still waits on a human before it becomes a
            decision.
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

        {/* Workflow strip */}
        <section className="mx-auto max-w-[1180px] px-6 pb-10">
          <div className="h-px w-full bg-emerald-500/15" />
          <div className="scrollbar-none flex items-center justify-center gap-1.5 overflow-x-auto px-2 py-5">
            {aiAgents.map((a, i) => {
              const isParallelStart = a.parallel && aiAgents[i - 1]?.parallel !== true;

              // Non-start members of the parallel cluster are rendered once,
              // grouped, by the isParallelStart branch below — skip them here.
              if (a.parallel && !isParallelStart) return null;

              if (isParallelStart) {
                const cluster = aiAgents.filter((x) => x.parallel);
                return (
                  <div key="parallel-cluster" className="flex shrink-0 items-center gap-1.5">
                    <div className="flex flex-col gap-1.5 rounded-2xl border border-dashed border-emerald-500/35 px-3 py-2">
                      <span className="text-center text-[9px] font-bold tracking-[0.08em] text-[#0e8a6d] uppercase">
                        Parallel
                      </span>
                      <div className="flex gap-2.5">
                        {cluster.map((p) => (
                          <button
                            key={p.step}
                            onClick={() => goTo(p.step - 1)}
                            className={`flex flex-col items-center gap-1 transition-opacity ${
                              active === p.step - 1 ? "opacity-100" : "opacity-55 hover:opacity-85"
                            }`}
                          >
                            <span className="flex h-7 w-7 items-center justify-center rounded-full border border-[#0e8a6d] font-heading text-[12px] font-bold text-[#0e8a6d]">
                              {p.step}
                            </span>
                            <span className="w-[62px] text-center text-[9.5px] leading-tight text-[#5b8578]">
                              {p.name.split(" ")[0]}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="h-px w-6 shrink-0 bg-emerald-500/20" />
                  </div>
                );
              }

              return (
                <div key={a.step} className="flex shrink-0 items-center gap-1.5">
                  <button
                    onClick={() => goTo(a.step - 1)}
                    className={`flex flex-col items-center gap-1 transition-opacity ${
                      active === a.step - 1 ? "opacity-100" : "opacity-55 hover:opacity-85"
                    }`}
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[#0e8a6d] bg-white/70 font-heading text-[14px] font-bold text-[#0e8a6d]">
                      {a.step}
                    </span>
                    <span className="w-[76px] text-center text-[10px] leading-tight text-[#5b8578]">
                      {a.name}
                    </span>
                  </button>
                  {a.step !== total && <div className="h-px w-6 shrink-0 bg-emerald-500/20" />}
                </div>
              );
            })}
          </div>
          <div className="h-px w-full bg-emerald-500/15" />
        </section>

        {/* Showcase */}
        <section className="mx-auto max-w-[1280px] px-6 pb-10">
          <div className="mx-auto mb-8 max-w-[640px] text-center">
            <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3.5 py-1.5 text-[12px] font-semibold text-cyan-700">
              Meet Our AI Agent Team
            </span>
            <h2 className="mt-3 font-heading text-[clamp(24px,3vw,34px)] font-bold text-[#0c2b24]">
              Ten agents. One durable pipeline.
            </h2>
            <p className="mt-1.5 text-[14.5px] text-[#4c7d6e]">
              Use the arrows, the dots, or the timeline above to move through the pipeline.
            </p>
          </div>

          <div className="relative">
            <button
              onClick={prev}
              aria-label="Previous agent"
              className="absolute top-1/2 -left-2 z-10 -translate-y-1/2 rounded-full border border-emerald-500/25 bg-white/80 p-3 shadow-[0_8px_24px_rgba(12,60,48,.12)] backdrop-blur-md transition-all hover:border-[#0e8a6d] hover:shadow-[0_10px_30px_rgba(16,185,129,.22)] md:-left-5"
            >
              <ChevronLeft className="h-5 w-5 text-[#0e8a6d]" />
            </button>
            <button
              onClick={next}
              aria-label="Next agent"
              className="absolute top-1/2 -right-2 z-10 -translate-y-1/2 rounded-full border border-emerald-500/25 bg-white/80 p-3 shadow-[0_8px_24px_rgba(12,60,48,.12)] backdrop-blur-md transition-all hover:border-[#0e8a6d] hover:shadow-[0_10px_30px_rgba(16,185,129,.22)] md:-right-5"
            >
              <ChevronRight className="h-5 w-5 text-[#0e8a6d]" />
            </button>

            <div
              key={agent.step}
              className="flex flex-col overflow-hidden rounded-[28px] border border-white/75 bg-gradient-to-b from-white/85 to-white/60 shadow-[0_30px_80px_rgba(12,60,48,.16),inset_0_1px_0_rgba(255,255,255,.9)] backdrop-blur-2xl animate-cs-fade-up md:flex-row md:min-h-[500px]"
            >
              {/* Image — generous space, ~48% on desktop */}
              <div className="relative w-full shrink-0 bg-emerald-950/5 md:w-[48%]">
                <div className="relative h-[280px] w-full md:h-full md:min-h-[500px]">
                  <Image
                    src={agent.image}
                    alt={agent.name}
                    fill
                    sizes="(min-width: 768px) 48vw, 100vw"
                    className="object-cover"
                    priority={active === 0}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0c2b24]/25 via-transparent to-transparent md:bg-gradient-to-r" />
                </div>
              </div>

              {/* Description — generous space, ~52% on desktop */}
              <div className="flex flex-1 flex-col justify-center gap-4 p-8 md:p-11">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="rounded-full bg-emerald-500/12 px-3 py-1 text-[12px] font-bold text-[#0e8a6d]">
                    Step {String(agent.step).padStart(2, "0")}
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 text-[12px] font-bold ${
                      agent.parallel
                        ? "bg-cyan-400/15 text-cyan-700"
                        : "bg-emerald-500/10 text-[#5b8578]"
                    }`}
                  >
                    {agent.parallel ? "Parallel" : "Sequential"}
                  </span>
                </div>

                <h3 className="font-heading text-[30px] leading-tight font-bold text-[#0c2b24] md:text-[34px]">
                  {agent.name}
                </h3>

                <div className="flex flex-col gap-1 text-[13.5px] text-[#5b8578]">
                  <span>
                    <strong className="text-[#0c2b24]">Model:</strong> {agent.model}
                  </span>
                  <span>
                    <strong className="text-[#0c2b24]">Runs:</strong> {agent.runsText}
                  </span>
                </div>

                <p className="text-[16px] leading-relaxed font-medium text-[#1c4a3f]">
                  {agent.summary}
                </p>

                <p className="border-t border-emerald-500/15 pt-4 text-[14.5px] leading-relaxed text-[#33584e]">
                  {agent.detail}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-center gap-2">
            {aiAgents.map((a, i) => (
              <button
                key={a.step}
                onClick={() => goTo(i)}
                aria-label={`Go to agent ${a.step}`}
                className={`h-2 rounded-full border border-[#0e8a6d] transition-all ${
                  i === active ? "w-6 bg-[#0e8a6d]" : "w-2 bg-transparent"
                }`}
              />
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
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-white/60 px-5 py-2.5 text-[14px] font-semibold text-[#0e8a6d] backdrop-blur-sm transition-all hover:border-[#0e8a6d] hover:bg-emerald-500/10"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </footer>
      </div>
    </div>
  );
}
