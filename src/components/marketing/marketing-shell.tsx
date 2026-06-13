import { MeshBackground } from "@/components/ui/mesh-background";
import { Scene3DLayer } from "@/components/ui/scene-3d-layer";
import { MouseParallaxRoot } from "@/components/ui/mouse-parallax-root";
import { MarketingHeader, MarketingFooter } from "@/components/marketing/header-footer";

export function MarketingShell({
  children,
  showFooter = true,
}: {
  children: React.ReactNode;
  showFooter?: boolean;
}) {
  return (
    <MouseParallaxRoot>
      <div className="marketing-dark relative min-h-screen overflow-x-hidden bg-black text-white">
        <MeshBackground variant="marketing" />
        <Scene3DLayer variant="marketing" className="hidden sm:block" />
        <div className="marketing-noise" aria-hidden />
        <div className="marketing-grid-overlay" aria-hidden />
        <MarketingHeader />
        <main className="relative z-10 overflow-x-hidden">{children}</main>
        {showFooter && <MarketingFooter />}
      </div>
    </MouseParallaxRoot>
  );
}
