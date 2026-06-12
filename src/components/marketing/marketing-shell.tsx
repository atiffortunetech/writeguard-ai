import { MeshBackground } from "@/components/ui/mesh-background";
import { MarketingHeader, MarketingFooter } from "@/components/marketing/header-footer";

export function MarketingShell({
  children,
  showFooter = true,
}: {
  children: React.ReactNode;
  showFooter?: boolean;
}) {
  return (
    <div className="marketing-dark relative min-h-screen overflow-x-hidden bg-black text-white">
      <MeshBackground variant="marketing" />
      <div className="marketing-noise" aria-hidden />
      <div className="marketing-grid-overlay" aria-hidden />
      <MarketingHeader />
      <main className="relative z-10">{children}</main>
      {showFooter && <MarketingFooter />}
    </div>
  );
}
