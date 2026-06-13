import { DashboardHeader } from "@/components/dashboard/header";
import { Card, CardContent } from "@/components/ui/card";

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
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-sm text-slate-500">
              This module is scaffolded and will be built in the next phase.
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
