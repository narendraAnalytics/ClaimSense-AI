import Link from "next/link";
import { ArrowLeft, Link2, Globe, Workflow, Sparkles } from "lucide-react";
import { AuroraBackground } from "@/components/landing/aurora-background";
import { SiteHeader } from "@/components/landing/site-header";
import { projects } from "@/lib/contact-data";

const LINKEDIN_URL = "https://www.linkedin.com/in/nk-analytics";
const WEBSITE_URL = "https://buildflows.shop/";

export default function ContactPage() {
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
            Contact
          </span>
          <h1 className="font-heading text-[clamp(32px,5vw,52px)] leading-[1.08] font-extrabold tracking-tight text-balance text-[#0c2b24]">
            Let&apos;s Build Something{" "}
            <span className="bg-[linear-gradient(100deg,#0ea77a_0%,#06b6d4_50%,#fb923c_100%)] bg-clip-text text-transparent">
              Intelligent Together
            </span>
          </h1>
          <p className="max-w-[660px] text-pretty text-[16.5px] leading-relaxed text-[#33584e]">
            ClaimSense AI is built by a Full-Stack AI Developer focused on AI SaaS platforms,
            agentic systems, and automation. Reach out on LinkedIn, or explore more shipped
            products on the portfolio site below.
          </p>
        </section>

        {/* Contact cards */}
        <section className="mx-auto max-w-[900px] px-6 pb-10">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <a
              href={LINKEDIN_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col gap-4 rounded-[24px] border border-white/75 bg-gradient-to-b from-white/85 to-white/60 p-7 shadow-[0_20px_60px_rgba(12,60,48,.1),inset_0_1px_0_rgba(255,255,255,.9)] backdrop-blur-2xl transition-all hover:border-[#0891b2] hover:shadow-[0_24px_70px_rgba(8,145,178,.2)] animate-cs-fade-up"
            >
              <span
                className="flex h-12 w-12 items-center justify-center rounded-2xl"
                style={{ backgroundColor: "rgba(34,211,238,.14)" }}
              >
                <Link2 className="h-6 w-6" style={{ color: "#0891b2" }} />
              </span>
              <h3 className="font-heading text-[19px] font-bold text-[#0c2b24]">
                Connect on LinkedIn
              </h3>
              <p className="text-[13.5px] leading-relaxed text-[#33584e]">
                linkedin.com/in/nk-analytics
              </p>
              <span className="mt-auto inline-flex w-fit items-center gap-1.5 text-[12.5px] font-semibold text-[#0891b2] transition-transform group-hover:translate-x-0.5">
                Visit profile →
              </span>
            </a>

            <a
              href={WEBSITE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col gap-4 rounded-[24px] border border-white/75 bg-gradient-to-b from-white/85 to-white/60 p-7 shadow-[0_20px_60px_rgba(12,60,48,.1),inset_0_1px_0_rgba(255,255,255,.9)] backdrop-blur-2xl transition-all hover:border-[#0e8a6d] hover:shadow-[0_24px_70px_rgba(16,185,129,.2)] animate-cs-fade-up"
              style={{ animationDelay: "0.08s" }}
            >
              <span
                className="flex h-12 w-12 items-center justify-center rounded-2xl"
                style={{ backgroundColor: "rgba(16,185,129,.14)" }}
              >
                <Globe className="h-6 w-6" style={{ color: "#0e8a6d" }} />
              </span>
              <h3 className="font-heading text-[19px] font-bold text-[#0c2b24]">
                View Portfolio
              </h3>
              <p className="text-[13.5px] leading-relaxed text-[#33584e]">buildflows.shop</p>
              <span className="mt-auto inline-flex w-fit items-center gap-1.5 text-[12.5px] font-semibold text-[#0e8a6d] transition-transform group-hover:translate-x-0.5">
                Visit website →
              </span>
            </a>
          </div>
        </section>

        {/* Projects showcase */}
        <section className="mx-auto max-w-[1280px] px-6 pb-16">
          <div className="mx-auto mb-8 max-w-[640px] text-center">
            <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3.5 py-1.5 text-[12px] font-semibold text-cyan-700">
              Shipped Products
            </span>
            <h2 className="mt-3 font-heading text-[clamp(24px,3vw,34px)] font-bold text-[#0c2b24]">
              12 AI SaaS products, live and deployed
            </h2>
            <p className="mt-1.5 text-[14.5px] text-[#4c7d6e]">
              For the full picture — demos, repos, and more — visit the portfolio site above.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((p, i) => {
              const Icon = p.icon;
              return (
                <div
                  key={p.name}
                  className="flex flex-col gap-3 rounded-[20px] border border-white/75 bg-gradient-to-b from-white/85 to-white/60 p-6 shadow-[0_16px_48px_rgba(12,60,48,.08),inset_0_1px_0_rgba(255,255,255,.9)] backdrop-blur-2xl animate-cs-fade-up"
                  style={{ animationDelay: `${i * 0.05}s` }}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                      style={{ backgroundColor: p.tint }}
                    >
                      <Icon className="h-5 w-5" style={{ color: p.color }} />
                    </span>
                    <div>
                      <h3 className="font-heading text-[15.5px] font-bold text-[#0c2b24]">
                        {p.name}
                      </h3>
                      <span className="text-[11px] font-semibold text-[#5b8578]">
                        {p.category}
                      </span>
                    </div>
                  </div>

                  <p className="text-[13px] leading-relaxed text-[#33584e]">{p.description}</p>

                  <p className="border-t border-emerald-500/15 pt-2.5 text-[11.5px] text-[#5b8578]">
                    {p.stack}
                  </p>
                </div>
              );
            })}
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
