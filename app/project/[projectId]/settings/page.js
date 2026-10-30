import { getPortalProjectSettings } from "@/lib/actions/project-portal-settings";
import ProjectSettings from "./settings-page-client";

export default async function ProjectSettingsPage({ params }) {
  const { projectId } = await params;
  const initialData = await getPortalProjectSettings(String(projectId));
  return <ProjectSettings initialData={initialData} />;
}
