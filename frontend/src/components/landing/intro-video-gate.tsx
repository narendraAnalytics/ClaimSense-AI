"use client";

import { ReactNode, useEffect, useState } from "react";
import Image from "next/image";

const INTRO_SEEN_KEY = "claimsense_intro_seen";
const INTRO_VIDEO_URL =
  "https://res.cloudinary.com/dkqbzwicr/video/upload/v1784370888/claimsenseintrovideo_jyfaip.webm";

export function IntroVideoGate({ children }: { children: ReactNode }) {
  const [hasEntered, setHasEntered] = useState<boolean | null>(null);

  useEffect(() => {
    setHasEntered(sessionStorage.getItem(INTRO_SEEN_KEY) === "1");
  }, []);

  const handleEnter = () => {
    sessionStorage.setItem(INTRO_SEEN_KEY, "1");
    setHasEntered(true);
  };

  if (hasEntered === null) {
    return null;
  }

  if (!hasEntered) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
        <video
          className="absolute inset-0 h-full w-full object-cover"
          src={INTRO_VIDEO_URL}
          autoPlay
          muted
          loop
          playsInline
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-[60px] -right-[60px] z-[1] h-[520px] w-[520px] rounded-full blur-[110px]"
          style={{
            background:
              "radial-gradient(circle at 55% 45%, rgba(6,182,212,.6), rgba(6,182,212,0) 70%)",
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-[40px] -right-[20px] z-[1] h-[420px] w-[420px] rounded-full blur-[90px]"
          style={{
            background:
              "radial-gradient(circle at 45% 55%, rgba(16,185,129,.55), rgba(16,185,129,0) 68%)",
          }}
        />
        <div
          className="absolute inset-x-0 bottom-0 z-10 flex flex-col items-center gap-6 pb-16 pt-32"
          style={{
            background:
              "linear-gradient(to top, rgba(6,20,17,.88) 0%, rgba(6,20,17,.55) 45%, transparent 100%)",
          }}
        >
          <div className="flex items-center gap-3">
            <span className="relative inline-flex h-11 w-11 items-center justify-center">
              <Image
                src="https://res.cloudinary.com/dkqbzwicr/image/upload/v1783856501/logoclaimsense_xjcpqe.png"
                alt="ClaimSense AI"
                width={44}
                height={44}
                priority
                className="object-contain drop-shadow-[0_4px_10px_rgba(16,185,129,.4)]"
              />
            </span>
            <span className="flex flex-col leading-[1.05]">
              <span className="font-heading text-xl font-bold tracking-tight text-white">
                ClaimSense
                <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                  {" "}
                  AI
                </span>
              </span>
              <span className="text-[10.5px] tracking-[0.14em] text-emerald-100/70 uppercase">
                Claims Intelligence
              </span>
            </span>
          </div>

          <button
            type="button"
            onClick={handleEnter}
            className="rounded-full bg-[linear-gradient(110deg,#0ea77a,#0ab6c4_55%,#0ea77a)] bg-[length:220%_auto] px-8 py-3 text-[15px] font-semibold text-white shadow-[0_8px_24px_rgba(14,167,122,.35),inset_0_1px_0_rgba(255,255,255,.35)] transition-all hover:bg-right hover:shadow-[0_12px_32px_rgba(14,167,122,.5)]"
          >
            Enter
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
