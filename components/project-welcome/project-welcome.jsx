"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { WelcomeScreen } from "./welcome-screen";
// import { QuestionsScreen } from "./questions-screen";
// import { AllSetScreen } from "./all-set-screen";
import { WelcomeMessageScreen } from "./welcome-message-screen";

export function ProjectWelcome({ projectData }) {
  const router = useRouter();
  const [currentScreen, setCurrentScreen] = useState(1);
  // const [answers, setAnswers] = useState({}); // used when QuestionsScreen + AllSet flow returns

  const handleNext = () => {
    // Kickoff questions disabled — always go to personalized welcome (screen 4).
    // if (projectData.hasQuestions) {
    //   setCurrentScreen(2);
    // } else {
    //   setCurrentScreen(4);
    // }
    setCurrentScreen(4);
  };

  // const handleSubmitQuestions = (questionAnswers) => {
  //   setAnswers(questionAnswers);
  //   setCurrentScreen(3);
  // };

  // const handleAllSetComplete = () => {
  //   setCurrentScreen(4);
  // };

  const handleSkipToWelcome = () => {
    setCurrentScreen(4);
  };

  const handleSkipToProject = () => {
    router.push(`/project/${projectData.id}/dashboard`);
  };

  return (
    <div className="relative min-h-screen">
      <img
        src="/images/welcome-bg.webp"
        alt="Welcome background"
        className="absolute top-0 inset-0 w-full h-full object-cover"
        draggable={false}
      />

      <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
        {currentScreen === 1 && (
          <WelcomeScreen onNext={handleNext} />
        )}

        {/* Screen 2–3: kickoff questions + “all set” — restore when `hasQuestions` is wired again */}
        {/* {currentScreen === 2 && projectData.hasQuestions && (
          <QuestionsScreen
            questions={projectData.questions}
            onSubmit={handleSubmitQuestions}
            onDoLater={handleSkipToWelcome}
          />
        )}
        {currentScreen === 3 && (
          <AllSetScreen
            clientName={projectData.clientName}
            onContinue={handleAllSetComplete}
          />
        )} */}

        {currentScreen === 4 && (
          <WelcomeMessageScreen
            clientName={projectData.clientName}
            welcomeMessage={projectData.welcomeMessage}
            onContinue={handleSkipToProject}
          />
        )}
      </div>

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
