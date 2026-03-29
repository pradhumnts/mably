"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldGroup, FieldLabel, FieldDescription } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ChevronRight, ChevronLeft, CalendarIcon, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

export function CreateProjectStep2({ formData, updateFormData, nextStep, prevStep, className, ...props }) {
  const [projectType, setProjectType] = useState(formData.projectType || "one-time");
  const [totalFee, setTotalFee] = useState(formData.totalFee || "");
  const [milestones, setMilestones] = useState(formData.milestones || [
    { name: "", amount: "", dueDate: undefined }
  ]);
  const [milestoneDateOpen, setMilestoneDateOpen] = useState({});

  const handleNext = (e) => {
    e.preventDefault();
    updateFormData({
      projectType,
      totalFee,
      milestones: projectType === "milestone" ? milestones : undefined,
    });
    nextStep();
  };

  const handleProjectTypeChange = (value) => {
    setProjectType(value);
    // Initialize milestones if switching to milestone type
    if (value === "milestone" && milestones.length === 0) {
      setMilestones([{ name: "", amount: "", dueDate: undefined }]);
    }
  };

  const addMilestone = () => {
    setMilestones([...milestones, { name: "", amount: "", dueDate: undefined }]);
  };

  const removeMilestone = (index) => {
    if (milestones.length > 1) {
      setMilestones(milestones.filter((_, i) => i !== index));
    }
  };

  const updateMilestone = (index, field, value) => {
    const updated = [...milestones];
    updated[index][field] = value;
    setMilestones(updated);
  };

  const toggleMilestoneDatePicker = (index) => {
    setMilestoneDateOpen(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
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
              Step 2 of 5
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold">Project Type & Pricing</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Define how your project will be structured and set up the pricing.
            </p>
          </div>

          {/* Form Fields */}
          <div className="space-y-6">
            {/* Project Type */}
            <Field>
              <FieldLabel htmlFor="projectType">
                Project Type
              </FieldLabel>
              <Select value={projectType} onValueChange={handleProjectTypeChange}>
                <SelectTrigger id="projectType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="one-time">One-time Project</SelectItem>
                  <SelectItem value="milestone">Milestone Project</SelectItem>
                </SelectContent>
              </Select>
              <FieldDescription>
                Choose whether this is a one-time delivery or broken into milestones.
              </FieldDescription>
            </Field>

            {/* Total Fee or Milestones */}
            {projectType === "one-time" ? (
              <Field>
                <FieldLabel htmlFor="totalFee">
                  Total Project Fee
                </FieldLabel>
                <Input
                  id="totalFee"
                  type="number"
                  placeholder="e.g. 5000"
                  value={totalFee}
                  onChange={(e) => setTotalFee(e.target.value)}
                  required
                />
                <FieldDescription>
                  Enter the total amount for this project.
                </FieldDescription>
              </Field>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Milestones</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addMilestone}
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add Milestone
                  </Button>
                </div>
                {milestones.map((milestone, index) => (
                  <div key={index} className="p-4 border rounded-lg space-y-3 relative">
                    {milestones.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeMilestone(index)}
                        className="absolute top-2 right-2 h-6 w-6"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                    <div className="grid grid-cols-1 gap-3">
                      <div>
                        <Label className="text-xs">Milestone Name</Label>
                        <Input
                          placeholder={`e.g. Milestone ${index + 1}`}
                          value={milestone.name}
                          onChange={(e) => updateMilestone(index, "name", e.target.value)}
                          required
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs">Amount</Label>
                          <Input
                            type="number"
                            placeholder="e.g. 2500"
                            value={milestone.amount}
                            onChange={(e) => updateMilestone(index, "amount", e.target.value)}
                            required
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Due Date</Label>
                          <Popover 
                            open={milestoneDateOpen[index]} 
                            onOpenChange={() => toggleMilestoneDatePicker(index)}
                          >
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full justify-between font-normal",
                                  !milestone.dueDate && "text-muted-foreground"
                                )}
                              >
                                {milestone.dueDate ? (
                                  milestone.dueDate.toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                  })
                                ) : (
                                  "Select"
                                )}
                                <CalendarIcon className="h-4 w-4 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={milestone.dueDate}
                                onSelect={(date) => {
                                  updateMilestone(index, "dueDate", date);
                                  toggleMilestoneDatePicker(index);
                                }}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                <p className="text-xs text-muted-foreground">
                  Break your project into milestones with specific deliverables and payments.
                </p>
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between">
            <Button type="button" variant="outline" onClick={prevStep} className="gap-2">
              <ChevronLeft className="h-4 w-4" />
              Prev
            </Button>
            <Button type="submit" className="gap-2">
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </FieldGroup>
      </form>
    </div>
  );
}
