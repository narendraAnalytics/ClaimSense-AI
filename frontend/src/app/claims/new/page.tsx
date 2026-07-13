import { AuroraBackground } from "@/components/landing/aurora-background";
import { SiteHeader } from "@/components/landing/site-header";
import { CreateClaimForm } from "@/components/claims/create-claim-form";

export default function NewClaimPage() {
  return (
    <div
      className="relative flex min-h-screen items-center justify-center overflow-clip px-6 pt-20 pb-16 font-body"
      style={{
        background:
          "linear-gradient(160deg, #eafff5 0%, #e3fbf3 22%, #e9fbfa 42%, #fef3e7 66%, #fdeaf4 84%, #f2fbe8 100%)",
      }}
    >
      <AuroraBackground />
      <SiteHeader minimal />
      <div className="relative z-[1]">
        <CreateClaimForm />
      </div>
    </div>
  );
}
