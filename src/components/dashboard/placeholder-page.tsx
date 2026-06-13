import { DashboardHeader } from "@/components/dashboard/header";
import { Card, CardContent } from "@/components/ui/card";
import { Panel3D } from "@/components/ui/panel-3d";

export default function PlaceholderPage({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <>
      <DashboardHeader title={title} description={description} />
      <div className="dashboard-content">
        <Panel3D>
          <Card className="glass-card border-0">
            <CardContent className="py-12 text-center">
              <p className="text-sm text-slate-500">
                This module is scaffolded and will be built in the next phase.
              </p>
            </CardContent>
          </Card>
        </Panel3D>
      </div>
    </>
  );
}
