import { listProjectActions } from "@/lib/actions/project-actions";
import ProjectActionsPage from "./actions-page-client";

export default async function ProjectActionsRoute({ params }) {
  const { projectId } = await params;
  const initialData = await listProjectActions(String(projectId));
  return <ProjectActionsPage initialData={initialData} />;
}
