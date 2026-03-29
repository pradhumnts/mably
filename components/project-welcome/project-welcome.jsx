"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { WelcomeScreen } from "./welcome-screen";
import { QuestionsScreen } from "./questions-screen";
import { AllSetScreen } from "./all-set-screen";
import { WelcomeMessageScreen } from "./welcome-message-screen";

export function ProjectWelcome({ projectData }) {
  const router = useRouter();
  const [currentScreen, setCurrentScreen] = useState(1);
  const [answers, setAnswers] = useState({});

  const handleNext = () => {
    setCurrentScreen(currentScreen + 1);
  };

  const handleSubmitQuestions = (questionAnswers) => {
    setAnswers(questionAnswers);
    // Go to "All Set" screen
    setCurrentScreen(3);
  };

  const handleAllSetComplete = () => {
    // After "All Set", show the personalized welcome message
    setCurrentScreen(4);
  };

  const handleSkipToWelcome = () => {
    // Skip questions and go directly to personalized welcome
    setCurrentScreen(4);
  };

  const handleSkipToProject = () => {
    // Redirect to the project dashboard
    router.push(`/project/${projectData.id}/dashboard`);
  };

  return (
    <div className="relative min-h-screen">
      {/* Background Image */}
      <img
        src="/images/welcome-bg.webp"
        alt="Welcome background"
        className="absolute top-0 inset-0 w-full h-full object-cover"
        draggable={false}
      />

      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
        {/* Screen 1: Initial Welcome */}
        {currentScreen === 1 && (
          <WelcomeScreen
            projectData={projectData}
            onNext={handleNext}
            onSkip={handleSkipToWelcome}
          />
        )}

        {/* Screen 2: Questions Form (only if there are questions) */}
        {currentScreen === 2 && projectData.hasQuestions && (
          <QuestionsScreen
            questions={projectData.questions}
            onSubmit={handleSubmitQuestions}
            onDoLater={handleSkipToWelcome}
          />
        )}

        {/* Screen 3: All Set Confirmation */}
        {currentScreen === 3 && (
          <AllSetScreen
            clientName={projectData.clientName}
            onContinue={handleAllSetComplete}
          />
        )}

        {/* Screen 4: Personalized Welcome Message */}
        {currentScreen === 4 && (
          <WelcomeMessageScreen
            clientName={projectData.clientName}
            onContinue={handleSkipToProject}
          />
        )}
      </div>

      {/* Mably.io Footer */}
      <div className="absolute bottom-6 right-6 z-20 flex items-center gap-2 text-sm text-gray-600">
        <span>Created with</span>
        <img
          src="/images/Logo-SVG.svg"
          alt="Mably.io"
          className="h-5"
          draggable={false}
        />
      </div>
    </div>
  );
}

