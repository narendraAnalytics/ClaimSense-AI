"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth, useQuery } from "convex/react";
import { navLinks } from "@/lib/landing-data";
import { api } from "../../../convex/_generated/api";
import { resolvePlan } from "../../../convex/planLimits";
import { PlanTag } from "./plan-tag";

type SiteHeaderProps = {
  minimal?: boolean;
};

export function SiteHeader({ minimal = false }: SiteHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { isAuthenticated } = useConvexAuth();
  const { signOut } = useAuthActions();
  const user = useQuery(api.users.current, isAuthenticated ? {} : "skip");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const logo = (
    <Link href="/" className="flex items-center gap-3 text-[#10312a]">
      <span className="relative inline-flex h-11 w-11 items-center justify-center">
        <Image
          src="https://res.cloudinary.com/dkqbzwicr/image/upload/v1783856501/logoclaimsense_xjcpqe.png"
          alt="ClaimSense AI"
          width={44}
          height={44}
          className="object-contain drop-shadow-[0_4px_10px_rgba(16,185,129,.28)]"
        />
        <span className="absolute top-1/2 left-1/2 h-[7px] w-[7px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-cyan-400 to-emerald-400 shadow-[0_0_8px_rgba(34,211,238,.9)] animate-cs-orbit" />
      </span>
      <span className="flex flex-col leading-[1.05]">
        <span className="font-heading text-xl font-bold tracking-tight">
          ClaimSense
          <span className="bg-gradient-to-r from-emerald-500 to-cyan-500 bg-clip-text text-transparent">
            {" "}
            AI
          </span>
        </span>
        <span className="text-[10.5px] tracking-[0.14em] text-[#4c7d6e] uppercase">
          Claims Intelligence
        </span>
      </span>
    </Link>
  );

  if (minimal) {
    return (
      <nav
        className="fixed inset-x-0 top-0 z-50 pb-10 backdrop-blur-xl transition-[background] duration-300"
        style={{
          background: scrolled
            ? "linear-gradient(to bottom, rgba(245,250,247,.42) 0%, rgba(245,250,247,.18) 55%, rgba(245,250,247,0) 100%)"
            : "linear-gradient(to bottom, rgba(245,250,247,.16) 0%, rgba(245,250,247,.07) 55%, rgba(245,250,247,0) 100%)",
          maskImage:
            "linear-gradient(to bottom, black 0%, black 55%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(to bottom, black 0%, black 55%, transparent 100%)",
        }}
      >
        <div className="mx-auto flex max-w-[1280px] items-center px-7 py-3.5">{logo}</div>
      </nav>
    );
  }

  return (
    <nav
      className="fixed inset-x-0 top-0 z-50 pb-10 backdrop-blur-xl transition-[background] duration-300"
      style={{
        background: scrolled
          ? "linear-gradient(to bottom, rgba(245,250,247,.42) 0%, rgba(245,250,247,.18) 55%, rgba(245,250,247,0) 100%)"
          : "linear-gradient(to bottom, rgba(245,250,247,.16) 0%, rgba(245,250,247,.07) 55%, rgba(245,250,247,0) 100%)",
        maskImage:
          "linear-gradient(to bottom, black 0%, black 55%, transparent 100%)",
        WebkitMaskImage:
          "linear-gradient(to bottom, black 0%, black 55%, transparent 100%)",
      }}
    >
      <div className="mx-auto flex max-w-[1280px] items-center gap-7 px-7 py-3.5">
        {logo}

        <div className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link}
              href={
                link === "Pricing"
                  ? (isAuthenticated ? "/pricing" : "/sign-in")
                  : link === "AI Agents"
                    ? (isAuthenticated ? "/ai-agents" : "/sign-in")
                    : link === "Solutions"
                      ? (isAuthenticated ? "/solutions" : "/sign-in")
                      : link === "Contact"
                        ? (isAuthenticated ? "/contact" : "/sign-in")
                        : (isAuthenticated ? "#" : "/sign-in")
              }
              className="group relative py-1.5 text-[15px] font-medium text-[#2c5c50] transition-colors hover:text-[#0a6b55]"
            >
              {link}
              <span className="absolute inset-x-0 bottom-0 h-0.5 origin-left scale-x-0 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-400 transition-transform duration-300 group-hover:scale-x-100" />
            </Link>
          ))}
        </div>

        {isAuthenticated ? (
          <div className="ml-auto hidden shrink-0 items-center gap-3 md:flex">
            {user?.name && (
              <span className="text-[14.5px] font-medium text-[#1c4a3f]">
                Welcome, {user.name}
              </span>
            )}
            <PlanTag plan={resolvePlan(user?.plan)} />
            <button
              type="button"
              onClick={() => void signOut()}
              title="Sign out"
              className="relative inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border-2 border-emerald-500/30 bg-gradient-to-br from-emerald-400 to-cyan-400 text-[15px] font-bold text-white shadow-[0_4px_14px_rgba(16,185,129,.3)] transition-transform hover:scale-105"
            >
              {user?.image ? (
                <Image
                  src={user.image}
                  alt={user.name ?? "Account"}
                  fill
                  sizes="40px"
                  className="object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span>{user?.name?.[0]?.toUpperCase() ?? "?"}</span>
              )}
            </button>
          </div>
        ) : (
          <Link
            href="/sign-in"
            className="ml-auto hidden shrink-0 rounded-full bg-[linear-gradient(110deg,#0ea77a,#0ab6c4_55%,#0ea77a)] bg-[length:220%_auto] px-5.5 py-2.5 text-[15px] font-semibold text-white shadow-[0_8px_24px_rgba(14,167,122,.35),inset_0_1px_0_rgba(255,255,255,.35)] transition-all hover:bg-right hover:shadow-[0_12px_32px_rgba(14,167,122,.5)] md:inline-block"
          >
            Request Demo
          </Link>
        )}

        <button
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Menu"
          className="ml-auto inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-500/25 bg-white/60 text-[#0e8a6d] hover:bg-emerald-500/10 md:hidden"
        >
          {menuOpen ? <X className="h-[22px] w-[22px]" /> : <Menu className="h-[22px] w-[22px]" />}
        </button>
      </div>

      {menuOpen && (
        <div className="flex flex-col gap-1 px-6 pt-2.5 pb-6 backdrop-blur-2xl animate-cs-fade-up">
          {navLinks.map((link) => (
            <Link
              key={link}
              href={
                link === "Pricing"
                  ? (isAuthenticated ? "/pricing" : "/sign-in")
                  : link === "AI Agents"
                    ? (isAuthenticated ? "/ai-agents" : "/sign-in")
                    : link === "Solutions"
                      ? (isAuthenticated ? "/solutions" : "/sign-in")
                      : link === "Contact"
                        ? (isAuthenticated ? "/contact" : "/sign-in")
                        : (isAuthenticated ? "#" : "/sign-in")
              }
              onClick={() => setMenuOpen(false)}
              className="rounded-xl px-2.5 py-3 text-[17px] font-semibold text-[#1c4a3f] hover:bg-emerald-500/10 hover:text-[#0a6b55]"
            >
              {link}
            </Link>
          ))}
          {isAuthenticated ? (
            <div className="mt-3 flex flex-col items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  void signOut();
                }}
                title="Sign out"
                className="relative inline-flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border-2 border-emerald-500/30 bg-gradient-to-br from-emerald-400 to-cyan-400 text-[20px] font-bold text-white shadow-[0_4px_14px_rgba(16,185,129,.3)]"
              >
                {user?.image ? (
                  <Image
                    src={user.image}
                    alt={user.name ?? "Account"}
                    fill
                    sizes="56px"
                    className="object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span>{user?.name?.[0]?.toUpperCase() ?? "?"}</span>
                )}
              </button>
              {user?.name && (
                <span className="text-center text-[14.5px] font-medium text-[#1c4a3f]">
                  Welcome, {user.name}
                </span>
              )}
              <PlanTag plan={resolvePlan(user?.plan)} />
              <span className="text-center text-[12.5px] text-[#4c7d6e]">Tap avatar to sign out</span>
            </div>
          ) : (
            <Link
              href="/sign-in"
              onClick={() => setMenuOpen(false)}
              className="mt-3 rounded-full bg-[linear-gradient(110deg,#0ea77a,#0ab6c4)] p-3.5 text-center font-semibold text-white shadow-[0_8px_24px_rgba(14,167,122,.35)]"
            >
              Request Demo
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
