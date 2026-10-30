import { getPortalHomeBriefing } from "@/lib/actions/project-portal-briefing";
import { isDemoProjectId } from "@/lib/data/demo-project";
import ProjectDashboard from "./dashboard-page-client";

export default async function ProjectDashboardPage({ params }) {
  const { projectId } = await params;
  const id = String(projectId);
  // The demo's freelancer/client view lives in sessionStorage, so its briefing loads client-side.
  const initialBriefing = isDemoProjectId(id) ? null : await getPortalHomeBriefing(id);
  return <ProjectDashboard initialBriefing={initialBriefing} />;
}
