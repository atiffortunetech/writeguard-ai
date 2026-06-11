import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { MeshBackground } from "@/components/ui/mesh-background";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex h-screen overflow-hidden">
      <MeshBackground variant="dashboard" />
      <DashboardSidebar />
      <div className="relative flex flex-1 flex-col overflow-hidden">{children}</div>
    </div>
  );
}
