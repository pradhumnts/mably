"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel, FieldDescription, FieldGroup, FieldSeparator } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ArrowRight, Smile } from "lucide-react";

export function QuestionsScreen({ questions, onSubmit, onDoLater }) {
  const [answers, setAnswers] = useState({});

  const handleAnswerChange = (questionId, value) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleSubmit = () => {
    onSubmit(answers);
  };

  return (
    <div className={cn("w-full max-w-md mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-[40px]")}>
      {/* Icon */}
      <div className="flex flex-col align-left justify-left items-left gap-[16px]">
        <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center p-3">
          <img
            src="/images/Logo-icon.svg"
            alt="Mably"
            className="w-full h-full"
            draggable={false}
          />
        </div>
        {/* Title Section */}
        <div className="space-y-2">
          <p className="text-orange-500 font-semibold">Let&apos;s Get Started</p>
          <h1 className="text-2xl font-bold text-gray-900">
            A quick thing before we start <Smile className="inline align-middle ml-1 text-black" size={22} strokeWidth={1.5} />
          </h1>
          <p className="text-gray-600 text-sm">
            Let&apos;s answer some quick questions to get things moving smoothly. It won&apos;t take long.
          </p>
        </div>
      </div>

      {/* Questions Form */}
      <form className="space-y-[24px]" onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
        {questions.map((q) => (
          <Field key={q.id} className="space-y-[0px]">
            <FieldLabel htmlFor={`question-${q.id}`} className="block text-sm font-medium text-gray-900">
              {q.question}
            </FieldLabel>
            <Input
              id={`question-${q.id}`}
              type="text"
              placeholder=""
              value={answers[q.id] || ""}
              onChange={(e) => handleAnswerChange(q.id, e.target.value)}
              className="bg-white"
              autoComplete="off"
            />
          </Field>
        ))}

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onDoLater}
            className="text-gray-600 hover:text-gray-900 font-medium bg-white"
          >
            Do this later
          </Button>
          
          <Button
            type="submit"
            className="ml-auto bg-orange-500 hover:bg-orange-600 text-white font-medium"
          >
            Submit
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}


