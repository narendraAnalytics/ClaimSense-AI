import { trustBadges } from "@/lib/landing-data";

export function TrustBar() {
  return (
    <section className="relative z-[1] mx-auto max-w-[1280px] px-7 pt-8.5 pb-16">
      <div className="flex flex-wrap justify-center gap-3.5 border-t border-emerald-500/16 pt-6.5">
        {trustBadges.map((badge) => {
          const Icon = badge.icon;
          return (
            <span
              key={badge.label}
              className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-white/60 px-4.25 py-2.25 text-[13.5px] font-semibold text-[#2c5c50] backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-emerald-500/50 hover:text-[#0a6b55] hover:shadow-[0_8px_22px_rgba(16,185,129,.16)]"
            >
              <Icon className="h-[15px] w-[15px] text-[#0e8a6d]" />
              {badge.label}
            </span>
          );
        })}
      </div>
    </section>
  );
}
