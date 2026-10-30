import { listProjectsForCurrentUser } from "@/lib/data/projects";
import { ProjectsPageClient } from "./projects-page-client";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const initialProjects = await listProjectsForCurrentUser();

  return <ProjectsPageClient initialProjects={initialProjects} />;
}
