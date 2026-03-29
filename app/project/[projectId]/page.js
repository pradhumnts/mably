import { ProjectWelcome } from "@/components/project-welcome/project-welcome";

export const metadata = {
  title: "Welcome - Mably",
  description: "Welcome to your project portal",
};

export default function ProjectWelcomePage({ params }) {
  // In the future, fetch project data based on params.projectId
  // For now, using dummy data
  const projectData = {
    id: params.projectId,
    clientName: "Sophie",
    hasQuestions: true, // This will determine if we show screen 2
    questions: [
      {
        id: 1,
        question: "Is there anything we should know before getting started?",
        type: "textarea",
      },
      {
        id: 2,
        question: "Do you have any examples or references you like?",
        type: "textarea",
      },
      {
        id: 3,
        question: "Is there a deadline we should keep in mind?",
        type: "textarea",
      },
    ],
  };

  return <ProjectWelcome projectData={projectData} />;
}


