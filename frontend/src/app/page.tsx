import { AuroraBackground } from "@/components/landing/aurora-background";
import { SiteHeader } from "@/components/landing/site-header";
import { HeroSection } from "@/components/landing/hero-section";
import { TrustBar } from "@/components/landing/trust-bar";
import { IntroVideoGate } from "@/components/landing/intro-video-gate";

export default function Home() {
  return (
    <IntroVideoGate>
      <div
        className="relative min-h-screen overflow-clip font-body"
        style={{
          background:
            "linear-gradient(160deg, #eafff5 0%, #e3fbf3 22%, #e9fbfa 42%, #fef3e7 66%, #fdeaf4 84%, #f2fbe8 100%)",
        }}
      >
        <AuroraBackground />
        <SiteHeader />
        <HeroSection />
        <TrustBar />
      </div>
    </IntroVideoGate>
  );
}
