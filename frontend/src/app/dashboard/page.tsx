import { AuroraBackground } from "@/components/landing/aurora-background";
import { SiteHeader } from "@/components/landing/site-header";
import { ClaimsDashboard } from "@/components/claims/claims-dashboard";

export default function DashboardPage() {
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
        <ClaimsDashboard />
      </div>
    </div>
  );
}
