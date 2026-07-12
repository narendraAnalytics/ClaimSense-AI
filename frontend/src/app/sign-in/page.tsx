import Link from "next/link";
import Image from "next/image";
import { AuroraBackground } from "@/components/landing/aurora-background";
import { SignInForm } from "@/components/auth/sign-in-form";

export default function SignInPage() {
  return (
    <div
      className="relative flex min-h-screen items-center justify-center overflow-clip px-6 font-body"
      style={{
        background:
          "linear-gradient(160deg, #eafff5 0%, #e3fbf3 22%, #e9fbfa 42%, #fef3e7 66%, #fdeaf4 84%, #f2fbe8 100%)",
      }}
    >
      <AuroraBackground />

      <div className="relative z-[1] flex flex-col items-center gap-8">
        <Link href="/" className="flex items-center gap-3 text-[#10312a]">
          <Image
            src="https://res.cloudinary.com/dkqbzwicr/image/upload/v1783856501/logoclaimsense_xjcpqe.png"
            alt="ClaimSense AI"
            width={44}
            height={44}
            className="object-contain drop-shadow-[0_4px_10px_rgba(16,185,129,.28)]"
          />
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

        <SignInForm />
      </div>
    </div>
  );
}
