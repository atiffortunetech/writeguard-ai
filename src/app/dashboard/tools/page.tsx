import { DashboardHeader } from "@/components/dashboard/header";
import { ToolsHubGrid } from "@/components/tools/tools-hub-grid";

export default function ToolsHubPage() {
  return (
    <>
      <DashboardHeader
        title="AI Writing Tools"
        description="Grammarly-style tools — availability depends on your plan"
      />
      <div className="flex-1 overflow-y-auto p-8">
        <ToolsHubGrid />
      </div>
    </>
  );
}
