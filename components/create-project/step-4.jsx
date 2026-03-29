"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldGroup, FieldLabel, FieldDescription } from "@/components/ui/field";
import { Separator } from "@/components/ui/separator";
import { ChevronRight, ChevronLeft, Plus, X, Info } from "lucide-react";
import { cn } from "@/lib/utils";

export function CreateProjectStep4({ formData, updateFormData, nextStep, prevStep, className, ...props }) {
  const [welcomeMessage, setWelcomeMessage] = useState(formData.welcomeMessage || "");
  const [questions, setQuestions] = useState(formData.questions || [""]);

  const handleAddQuestion = () => {
    setQuestions([...questions, ""]);
  };

  const handleRemoveQuestion = (index) => {
    const newQuestions = questions.filter((_, i) => i !== index);
    setQuestions(newQuestions.length > 0 ? newQuestions : [""]);
  };

  const handleQuestionChange = (index, value) => {
    const newQuestions = [...questions];
    newQuestions[index] = value;
    setQuestions(newQuestions);
  };

  const handleNext = (e) => {
    e.preventDefault();
    updateFormData({
      welcomeMessage,
      questions: questions.filter(q => q.trim() !== ""),
    });
    nextStep();
  };

  const handleSkip = () => {
    updateFormData({
      welcomeMessage: "",
      questions: [],
    });
    nextStep();
  };

  return (
    <div
      className={cn(
        "animate-in fade-in slide-in-from-bottom-4 duration-500",
        className
      )}
      {...props}
    >
      <form onSubmit={handleNext}>
        <FieldGroup className="space-y-8">
          {/* Header */}
          <div className="space-y-2">
            <p className="text-xs sm:text-sm text-primary font-semibold uppercase">
              Step 4 of 5
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold">Client Kickoff</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Set the tone and collect any details from client you need before starting.
            </p>
          </div>

          {/* Form Fields */}
          <div className="space-y-8">
            {/* Welcome Message */}
            <Field>
              <FieldLabel htmlFor="welcomeMessage">
                Welcome message
              </FieldLabel>
              <Textarea
                id="welcomeMessage"
                placeholder="Hey Sophie, Welcome to your project portal. We'll use this space to share updates, files, and feedback throughout the project."
                value={welcomeMessage}
                onChange={(e) => setWelcomeMessage(e.target.value)}
                rows={4}
                className="resize-none"
              />
              <FieldDescription>
                This message is shown when your client opens the project portal.
              </FieldDescription>
            </Field>

            {/* Separator */}
            <Separator />

            {/* Client Questions */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <FieldLabel className="mb-0">Client questions</FieldLabel>
                <Info className="h-4 w-4 text-muted-foreground" />
              </div>
              <FieldDescription className="mt-0">
                Ask anything you need answered before starting. You can skip if you want.
              </FieldDescription>

              <div className="space-y-3">
                {questions.map((question, index) => (
                  <div key={index} className="flex gap-2 items-start">
                    <Field className="flex-1">
                      {index === 0 && (
                        <FieldLabel htmlFor={`question-${index}`}>
                          Question
                        </FieldLabel>
                      )}
                      <Input
                        id={`question-${index}`}
                        placeholder="Enter your question"
                        value={question}
                        onChange={(e) => handleQuestionChange(index, e.target.value)}
                      />
                    </Field>
                    {questions.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveQuestion(index)}
                        className={cn("flex-shrink-0", index === 0 && "mt-8")}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={handleAddQuestion}
                className="gap-2"
              >
                Add Question
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between">
            <Button type="button" variant="outline" onClick={handleSkip}>
              Skip
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={prevStep} className="gap-2">
                <ChevronLeft className="h-4 w-4" />
                Prev
              </Button>
              <Button type="submit" className="gap-2">
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </FieldGroup>
      </form>
    </div>
  );
}

