import { ArrowRight, Play, Sparkles } from "lucide-react";
import { PipelineShowcase } from "@/components/landing/pipeline-showcase";
import { AnimatedCounter } from "@/components/landing/animated-counter";

export function HeroSection() {
  return (
    <section className="relative z-[1] mx-auto grid max-w-[1280px] grid-cols-1 items-center gap-14 px-7 pt-[130px] pb-10 lg:grid-cols-[1.02fr_1fr] lg:gap-12 lg:pt-[170px]">
      {/* Left: copy */}
      <div className="flex flex-col gap-6 animate-cs-fade-up">
        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-500/28 bg-white/55 px-4 py-2 text-[13.5px] font-semibold tracking-wide text-[#0e8a6d] shadow-[0_4px_16px_rgba(16,185,129,.12)] backdrop-blur-sm">
          <Sparkles className="h-[15px] w-[15px]" />
          Multi-agent claims intelligence · Now in early access
        </div>

        <h1 className="font-heading text-[clamp(38px,9vw,68px)] leading-[1.04] font-extrabold tracking-tight text-balance text-[#0c2b24] lg:text-[clamp(44px,4.6vw,68px)]">
          AI agents that decide insurance claims in{" "}
          <span className="bg-[linear-gradient(100deg,#0ea77a_0%,#06b6d4_34%,#84cc16_62%,#fb923c_86%,#f472b6_100%)] bg-clip-text text-transparent">
            minutes, not days.
          </span>
        </h1>

        <p className="max-w-[560px] text-pretty text-[18.5px] leading-relaxed text-[#33584e]">
          Nine specialized AI agents read every document, validate policy coverage, reason
          over medical evidence, audit billing, flag fraud, and search thousands of
          historical claims — then hand your adjusters a settlement recommendation with a
          confidence score. Orchestrated end to end, from FNOL to decision.
        </p>

        <div className="flex flex-wrap items-center gap-4">
          <a
            href="#"
            className="inline-flex items-center gap-2.5 rounded-full bg-[linear-gradient(110deg,#0ea77a,#0ab6c4_45%,#0ea77a_90%)] bg-[length:250%_auto] px-7.5 py-4 text-[16.5px] font-bold text-white shadow-[0_12px_34px_rgba(14,167,122,.42),inset_0_1px_0_rgba(255,255,255,.4)] transition-all animate-cs-shimmer hover:-translate-y-0.5 hover:shadow-[0_18px_44px_rgba(14,167,122,.55)]"
          >
            Start Free Trial
            <ArrowRight className="h-[18px] w-[18px]" />
          </a>
          <a
            href="#"
            className="inline-flex items-center gap-2.5 rounded-full border-[1.5px] border-[#0e8a6d]/40 bg-white/50 px-7 py-3.75 text-[16.5px] font-semibold text-[#0e8a6d] backdrop-blur-sm transition-all hover:border-[#0e8a6d] hover:bg-emerald-500/10 hover:text-[#0a6b55] hover:shadow-[0_8px_26px_rgba(16,185,129,.22)]"
          >
            <span className="relative inline-flex h-5 w-5 items-center justify-center">
              <span className="absolute inset-0 rounded-full bg-emerald-500/35 animate-cs-pulse-ring" />
              <Play className="relative h-[15px] w-[15px]" />
            </span>
            Watch Live Demo
          </a>
        </div>

        <div className="mt-2 flex flex-wrap gap-8 border-t border-emerald-500/16 pt-5.5">
          <div className="flex flex-col gap-0.5">
            <span className="font-heading text-[30px] font-bold tracking-tight text-[#0c2b24]">
              <AnimatedCounter target={95} suffix="%" />
            </span>
            <span className="text-[13.5px] text-[#4c7d6e]">faster claims processing</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="font-heading text-[30px] font-bold tracking-tight text-[#0c2b24]">
              <AnimatedCounter target={9} />
            </span>
            <span className="text-[13.5px] text-[#4c7d6e]">specialized AI agents</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="font-heading text-[30px] font-bold tracking-tight text-[#0c2b24]">
              <AnimatedCounter target={3} suffix=" min" />
            </span>
            <span className="text-[13.5px] text-[#4c7d6e]">average time to decision</span>
          </div>
        </div>
      </div>

      {/* Right: animated pipeline mockup */}
      <PipelineShowcase />
    </section>
  );
}
