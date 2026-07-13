import { AuroraBackground } from "@/components/landing/aurora-background";
import { SiteHeader } from "@/components/landing/site-header";
import { ClaimWorkspace } from "@/components/claims/claim-workspace";
import type { Id } from "../../../../convex/_generated/dataModel";

export default async function ClaimPage({
  params,
}: {
  params: Promise<{ claimId: string }>;
}) {
  const { claimId } = await params;

  return (
    <div
      className="relative min-h-screen overflow-clip font-body"
      style={{
        background:
          "linear-gradient(160deg, #eafff5 0%, #e3fbf3 22%, #e9fbfa 42%, #fef3e7 66%, #fdeaf4 84%, #f2fbe8 100%)",
      }}
    >
      <AuroraBackground />
      <SiteHeader />
      <div className="relative z-[1] pt-24">
        <ClaimWorkspace claimId={claimId as Id<"claims">} />
      </div>
    </div>
  );
}
