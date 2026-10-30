import { getProjectActivityPageData } from "@/lib/actions/project-activity";
import ProjectActivity from "./activity-page-client";

export default async function ProjectActivityPage({ params }) {
  const { projectId } = await params;
  const initialData = await getProjectActivityPageData(String(projectId));
  return <ProjectActivity initialData={initialData} />;
}
