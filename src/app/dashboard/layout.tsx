import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { MeshBackground } from "@/components/ui/mesh-background";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="dashboard-shell relative flex h-screen overflow-hidden bg-slate-950">
      <MeshBackground variant="dashboard" />
      <div className="dashboard-grid-overlay" aria-hidden />
      <div className="dashboard-orb dashboard-orb-a" aria-hidden />
      <div className="dashboard-orb dashboard-orb-b" aria-hidden />
      <DashboardSidebar />
      <div className="relative z-10 flex flex-1 flex-col overflow-hidden">{children}</div>
    </div>
  );
}
