import { redirect } from "next/navigation";
import { getProjectPortalBundle } from "@/lib/data/project-portal";
import { ProjectWelcome } from "@/components/project-welcome/project-welcome";

export const metadata = {
  title: "Welcome - Mably",
  description: "Welcome to your project portal",
};

export default async function ProjectWelcomePage({ params }) {
  const { projectId } = await params;
  const bundle = await getProjectPortalBundle(projectId);
  if (!bundle) {
    redirect("/");
  }

  const projectData = {
    id: bundle.welcome.id,
    clientName: bundle.welcome.clientName,
    hasQuestions: bundle.welcome.hasQuestions,
    questions: bundle.welcome.questions,
    welcomeMessage: bundle.welcome.welcomeMessage,
  };

  return <ProjectWelcome projectData={projectData} />;
}
