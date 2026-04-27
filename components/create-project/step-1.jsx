"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronRight, ChevronDown, CalendarIcon, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { AddClientDialog } from "@/components/add-client-dialog";

export function CreateProjectStep1({
  formData,
  updateFormData,
  nextStep,
  clients = [],
  className,
  ...props
}) {
  const router = useRouter();
  const [projectName, setProjectName] = useState(formData.projectName || "");
  const [startDate, setStartDate] = useState(formData.startDate || undefined);
  const [dueDate, setDueDate] = useState(formData.dueDate || undefined);
  const [projectScope, setProjectScope] = useState(formData.projectScope || "");
  const [clientId, setClientId] = useState(formData.clientId || "");
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [dueDateOpen, setDueDateOpen] = useState(false);
  const [addClientDialogOpen, setAddClientDialogOpen] = useState(false);

  const selectedClient = clients.find((c) => c.id === clientId);

  const handleNext = (e) => {
    e.preventDefault();
    updateFormData({
      projectName,
      startDate,
      dueDate,
      projectScope,
      clientId,
    });
    nextStep();
  };

  const handleClientSelect = (value) => {
    if (value === "new") {
      setAddClientDialogOpen(true);
    } else {
      setClientId(value);
    }
  };

  const handleClientSaved = (payload) => {
    if (payload?.id) {
      setClientId(String(payload.id));
    }
    router.refresh();
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
              Step 1 of 5
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold">Project & Client Details</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Set up the core details of your project and assign it to a client.
              You can update everything later.
            </p>
          </div>

          {/* Form Fields */}
          <div className="space-y-6">
            {/* Project Name */}
            <Field>
              <FieldLabel htmlFor="projectName">
                Project Name
              </FieldLabel>
              <Input
                id="projectName"
                placeholder="e.g. Website redesign for Open Design"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                required
              />
            </Field>

            {/* Dates Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="startDate">
                  Start date (optional)
                </FieldLabel>
                <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      id="startDate"
                      className={cn(
                        "w-full justify-between font-normal",
                        !startDate && "text-muted-foreground"
                      )}
                    >
                      {startDate ? (
                        startDate.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      ) : (
                        "Select a date"
                      )}
                      <CalendarIcon className="h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={(date) => {
                        setStartDate(date);
                        setStartDateOpen(false);
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </Field>
              <Field>
                <FieldLabel htmlFor="dueDate">
                  Due date (optional)
                </FieldLabel>
                <Popover open={dueDateOpen} onOpenChange={setDueDateOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      id="dueDate"
                      className={cn(
                        "w-full justify-between font-normal",
                        !dueDate && "text-muted-foreground"
                      )}
                    >
                      {dueDate ? (
                        dueDate.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      ) : (
                        "Select a date"
                      )}
                      <CalendarIcon className="h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dueDate}
                      onSelect={(date) => {
                        setDueDate(date);
                        setDueDateOpen(false);
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </Field>
            </div>

            {/* Project Scope */}
            <Field>
              <FieldLabel htmlFor="projectScope">
                Project scope
              </FieldLabel>
              <Textarea
                id="projectScope"
                placeholder="Briefly describe what this project is about and it's deliverables (optional)"
                value={projectScope}
                onChange={(e) => setProjectScope(e.target.value)}
                rows={4}
                className="resize-none"
              />
              <FieldDescription>
                This helps you and your client stay aligned on the scope.
              </FieldDescription>
            </Field>

            {/* Client Selection */}
            <Field>
              <FieldLabel htmlFor="client">
                Who you're working with?
              </FieldLabel>
              <Select value={clientId} onValueChange={handleClientSelect}>
                <SelectTrigger id="client" className="h-auto py-[28px]">
                  <SelectValue placeholder="Select an existing client or create a new one">
                    {selectedClient && (
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage
                            src={selectedClient.avatar || undefined}
                            alt={selectedClient.name}
                          />
                          <AvatarFallback>
                            {(selectedClient.name || "?").charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col items-start text-left">
                          <span className="font-medium text-sm">{selectedClient.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {selectedClient.email}
                          </span>
                        </div>
                      </div>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={client.avatar || undefined}
                            alt={client.name}
                          />
                          <AvatarFallback>
                            {(client.name || "?").charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col items-start">
                          <span className="font-medium text-sm">{client.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {client.email}
                          </span>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                  <SelectItem value="new">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Plus className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-primary font-medium">Create new client</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button type="submit" className="gap-2">
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </FieldGroup>
      </form>

      {/* Add Client Dialog */}
      <AddClientDialog
        open={addClientDialogOpen}
        onOpenChange={setAddClientDialogOpen}
        onSaved={handleClientSaved}
      />
    </div>
  );
}

