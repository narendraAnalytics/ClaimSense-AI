"use client";

import { useEffect, useRef } from "react";
import {
  Workflow,
  ScanText,
  FileText,
  BadgeCheck,
  ShieldAlert,
  Stethoscope,
  Search,
} from "lucide-react";
import { agentCards, floatIcons } from "@/lib/landing-data";
import { AnimatedCounter } from "@/components/landing/animated-counter";

export function PipelineShowcase() {
  const parallaxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const el = parallaxRef.current;
      if (!el) return;
      const dx = e.clientX / window.innerWidth - 0.5;
      const dy = e.clientY / window.innerHeight - 0.5;
      el.style.transform = `translate(${dx * -10}px, ${dy * -8}px)`;
      el.querySelectorAll<HTMLElement>("[data-depth]").forEach((chip) => {
        const depth = parseFloat(chip.dataset.depth ?? "1");
        chip.style.marginLeft = `${dx * -8 * depth}px`;
        chip.style.marginTop = `${dy * -6 * depth}px`;
      });
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  return (
    <div className="relative animate-cs-fade-up [animation-delay:.15s]">
      <div ref={parallaxRef} className="relative will-change-transform">
        <div className="relative [transform:perspective(1400px)_rotateY(-7deg)_rotateX(3deg)] transition-transform duration-500 [transition-timing-function:cubic-bezier(.2,.7,.2,1)] hover:[transform:perspective(1400px)_rotateY(-2deg)_rotateX(1deg)] lg:block">
          <div className="relative overflow-hidden rounded-3xl border border-white/75 bg-gradient-to-b from-white/78 to-white/50 p-5 shadow-[0_30px_80px_rgba(12,60,48,.18),0_2px_8px_rgba(12,60,48,.06),inset_0_1px_0_rgba(255,255,255,.9)] backdrop-blur-2xl">
            {/* header */}
            <div className="flex items-center gap-2.5 border-b border-emerald-500/15 pb-3.5">
              <span className="h-[9px] w-[9px] rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,.8)] animate-cs-blink" />
              <span className="text-[13.5px] font-semibold text-[#0c2b24]">
                Claim CLM-2841 · Live pipeline
              </span>
              <span className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-cyan-400/30 bg-cyan-400/15 px-2.5 py-1 text-[11.5px] font-semibold text-cyan-700">
                <Workflow className="h-3 w-3" />
                LangGraph run
              </span>
            </div>

            {/* flow lines */}
            <svg
              viewBox="0 0 520 60"
              className="my-2.5 block h-[34px] w-full"
              aria-hidden="true"
            >
              <defs>
                <linearGradient id="csFlow" x1="0" x2="1">
                  <stop offset="0" stopColor="#10b981" />
                  <stop offset=".5" stopColor="#06b6d4" />
                  <stop offset="1" stopColor="#fb923c" />
                </linearGradient>
              </defs>
              <path
                d="M 20 30 C 110 30 120 10 210 10 M 20 30 C 110 30 120 50 210 50 M 210 10 C 300 10 310 30 400 30 M 210 50 C 300 50 310 30 400 30 M 400 30 L 500 30"
                fill="none"
                stroke="url(#csFlow)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray="7 9"
                className="animate-cs-dash"
              />
              <circle cx="20" cy="30" r="5" fill="#10b981" />
              <circle cx="210" cy="10" r="4" fill="#06b6d4" />
              <circle cx="210" cy="50" r="4" fill="#06b6d4" />
              <circle cx="400" cy="30" r="4" fill="#fb923c" />
              <circle cx="500" cy="30" r="5" fill="#f472b6" />
            </svg>

            {/* agent cards */}
            <div className="mt-2.5 grid grid-cols-2 gap-3">
              {agentCards.map((card) => {
                const Icon = card.icon;
                const StateIcon = card.stateIcon;
                return (
                  <div
                    key={card.name}
                    className="flex flex-col gap-2 rounded-2xl border border-white/80 bg-white/62 p-3.5 shadow-[0_6px_18px_rgba(12,60,48,.07)] transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(12,60,48,.13)]"
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className="inline-flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[10px]"
                        style={{ background: card.tint, color: card.color }}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="flex min-w-0 flex-col leading-tight">
                        <span className="truncate text-[12.5px] font-bold text-[#0c2b24]">
                          {card.name}
                        </span>
                        <span className="text-[10.5px] text-[#5b8578]">{card.model}</span>
                      </div>
                      <StateIcon
                        className="ml-auto h-[15px] w-[15px] shrink-0"
                        style={{ color: card.color }}
                      />
                    </div>
                    <div className="h-[5px] overflow-hidden rounded-full bg-emerald-500/12">
                      <div
                        className="h-full rounded-full animate-cs-bar-grow"
                        style={{
                          width: card.progress,
                          background: `linear-gradient(90deg, ${card.color}, ${card.color2})`,
                        }}
                      />
                    </div>
                    <span className="text-[11px] text-[#4c7d6e]">{card.status}</span>
                  </div>
                );
              })}
            </div>

            {/* OCR scan strip */}
            <div className="mt-3 grid grid-cols-[96px_1fr] items-center gap-3.5 rounded-2xl border border-white/80 bg-white/62 p-3.5 shadow-[0_6px_18px_rgba(12,60,48,.07)]">
              <div
                className="relative h-[78px] overflow-hidden rounded-[10px] border border-cyan-400/35 bg-cyan-50/80"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(180deg, rgba(6,182,212,.10) 0 3px, transparent 3px 11px)",
                }}
              >
                <span className="absolute top-[8%] left-[6%] right-[6%] h-0.5 rounded-full bg-gradient-to-r from-transparent via-cyan-500 to-transparent shadow-[0_0_12px_rgba(6,182,212,.9)] animate-cs-scan" />
                <FileText className="absolute right-1.5 bottom-1.5 h-3.5 w-3.5 text-cyan-700" />
              </div>
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <ScanText className="h-[15px] w-[15px] text-cyan-700" />
                  <span className="text-[12.5px] font-bold text-[#0c2b24]">
                    Sarvam Vision · OCR extraction
                  </span>
                </div>
                <span className="text-[11.5px] leading-relaxed text-[#4c7d6e]">
                  discharge_summary.pdf → structured JSON · diagnosis, procedures, billed items detected
                </span>
                <div className="flex gap-1.5">
                  <span className="rounded-full bg-emerald-500/13 px-2.5 py-0.5 text-[10.5px] font-semibold text-[#0e8a6d]">
                    7 tables
                  </span>
                  <span className="rounded-full bg-amber-500/14 px-2.5 py-0.5 text-[10.5px] font-semibold text-amber-700">
                    2 anomalies
                  </span>
                  <span className="rounded-full bg-cyan-400/14 px-2.5 py-0.5 text-[10.5px] font-semibold text-cyan-700">
                    Qdrant · 23 similar
                  </span>
                </div>
              </div>
            </div>

            {/* settlement card */}
            <div className="mt-3 flex items-center gap-3.5 rounded-2xl border border-emerald-500/35 bg-gradient-to-r from-emerald-100/75 to-cyan-100/65 p-3.5 shadow-[0_10px_30px_rgba(16,185,129,.18)]">
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] bg-gradient-to-br from-emerald-500 to-cyan-500 text-white shadow-[0_6px_16px_rgba(16,185,129,.4)]">
                <BadgeCheck className="h-[21px] w-[21px]" />
              </span>
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="text-[13px] font-bold text-[#0c2b24]">
                  Settlement recommended · ₹1,84,500
                </span>
                <span className="text-[11.5px] text-[#33584e]">
                  Within policy limits · deductible &amp; copay applied · low fraud risk (12/100)
                </span>
              </div>
              <div className="ml-auto flex shrink-0 flex-col items-end gap-1">
                <span className="font-heading text-xl font-bold text-[#0e8a6d]">
                  <AnimatedCounter target={94} suffix="%" />
                </span>
                <span className="text-[10px] tracking-[0.1em] text-[#5b8578] uppercase">
                  confidence
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* floating chips */}
        <div
          data-depth="1.6"
          className="absolute -top-[26px] -right-[18px] z-[3] hidden items-center gap-2 rounded-2xl border border-white/85 bg-white/80 px-3.5 py-2.5 shadow-[0_14px_34px_rgba(251,113,133,.25)] backdrop-blur-md animate-cs-float lg:flex"
        >
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-[9px] bg-rose-500/16 text-rose-600">
            <ShieldAlert className="h-[15px] w-[15px]" />
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-xs font-bold text-[#0c2b24]">Fraud check passed</span>
            <span className="text-[10.5px] text-[#5b8578]">risk score 12 / 100</span>
          </span>
        </div>

        <div
          data-depth="2.2"
          className="absolute -bottom-5.5 -left-7.5 z-[3] hidden items-center gap-2 rounded-2xl border border-white/85 bg-white/80 px-3.5 py-2.5 shadow-[0_14px_34px_rgba(6,182,212,.22)] backdrop-blur-md animate-cs-float [animation-delay:.8s] lg:flex"
        >
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-[9px] bg-cyan-400/15 text-cyan-700">
            <Stethoscope className="h-[15px] w-[15px]" />
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-xs font-bold text-[#0c2b24]">Medical validation</span>
            <span className="text-[10.5px] text-[#5b8578]">treatment consistent with diagnosis</span>
          </span>
        </div>

        <div
          data-depth="1.2"
          className="absolute top-[38%] -left-11.5 z-[3] hidden items-center gap-2 rounded-full border border-white/85 bg-white/85 px-3.5 py-2 shadow-[0_12px_28px_rgba(132,204,22,.25)] backdrop-blur-md animate-cs-float-sm [animation-delay:.4s] lg:flex"
        >
          <Search className="h-3.5 w-3.5 text-lime-600" />
          <span className="text-[11.5px] font-semibold text-lime-800">23 similar claims found</span>
        </div>

        {/* ambient floating icons */}
        {floatIcons.map((fi, index) => {
          const Icon = fi.icon;
          return (
            <span
              key={index}
              data-depth={fi.depth}
              className="absolute z-[2] hidden h-[34px] w-[34px] items-center justify-center rounded-[11px] border border-white/80 bg-white/70 shadow-[0_8px_20px_rgba(12,60,48,.10)] backdrop-blur-sm lg:inline-flex"
              style={{
                top: fi.top,
                left: fi.left,
                color: fi.color,
                animation: `csFloatSm ${fi.duration} ease-in-out infinite`,
              }}
            >
              <Icon className="h-4 w-4" />
            </span>
          );
        })}
      </div>
    </div>
  );
}
