export function AuroraBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0"
      style={{
        maskImage:
          "linear-gradient(to bottom, rgba(0,0,0,.55) 0, rgba(0,0,0,.9) 140px, black 260px)",
        WebkitMaskImage:
          "linear-gradient(to bottom, rgba(0,0,0,.55) 0, rgba(0,0,0,.9) 140px, black 260px)",
      }}
    >
      <div
        className="absolute -top-[300px] -left-[200px] h-[820px] w-[820px] rounded-full blur-[120px] animate-cs-drift-1"
        style={{
          background:
            "radial-gradient(circle at 40% 40%, rgba(16,185,129,.5), rgba(16,185,129,0) 65%)",
        }}
      />
      <div
        className="absolute -top-[220px] -right-[240px] h-[860px] w-[860px] rounded-full blur-[130px] animate-cs-drift-2"
        style={{
          background:
            "radial-gradient(circle at 55% 45%, rgba(6,182,212,.46), rgba(6,182,212,0) 65%)",
        }}
      />
      <div
        className="absolute top-[320px] left-[30%] h-[640px] w-[640px] rounded-full blur-[72px] animate-cs-drift-3"
        style={{
          background:
            "radial-gradient(circle, rgba(251,146,60,.5), rgba(251,146,60,0) 62%)",
        }}
      />
      <div
        className="absolute top-[460px] right-[2%] h-[540px] w-[540px] rounded-full blur-[64px]"
        style={{
          background:
            "radial-gradient(circle, rgba(236,72,153,.44), rgba(236,72,153,0) 60%)",
          animation: "csDrift1 36s ease-in-out infinite reverse",
        }}
      />
      <div
        className="absolute top-[540px] -left-[140px] h-[560px] w-[560px] rounded-full blur-[70px]"
        style={{
          background:
            "radial-gradient(circle, rgba(163,230,53,.46), rgba(163,230,53,0) 60%)",
          animation: "csDrift2 30s ease-in-out infinite reverse",
        }}
      />
      <div
        className="absolute top-[60px] left-[55%] h-[420px] w-[420px] rounded-full blur-[60px]"
        style={{
          background:
            "radial-gradient(circle, rgba(245,158,11,.4), rgba(245,158,11,0) 60%)",
          animation: "csDrift3 24s 2s ease-in-out infinite reverse",
        }}
      />
      <div
        className="absolute -bottom-[160px] left-[20%] h-[620px] w-[620px] rounded-full blur-[70px]"
        style={{
          background:
            "radial-gradient(circle, rgba(244,114,182,.4), rgba(244,114,182,0) 62%)",
          animation: "csDrift1 34s 1s ease-in-out infinite",
        }}
      />
      <div
        className="absolute inset-0 opacity-40 mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)' opacity='0.16'/%3E%3C/svg%3E\")",
        }}
      />
    </div>
  );
}
