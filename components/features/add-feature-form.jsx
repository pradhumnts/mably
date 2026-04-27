"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FieldLabel } from "@/components/ui/field";
import { toast } from "sonner";
import { createFeatureRequest } from "@/lib/actions/feature-requests";
import { PenLine, Send, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const tips = ["One clear job-to-be-done", "Who it helps (you vs client)", "How you’d know it worked"];

export function AddFeatureForm({ onSubmitted }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [email, setEmail] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await createFeatureRequest({
        title,
        description,
        contactEmail: email,
      });
      if (!res.ok) {
        toast.error("Could not submit", { description: res.error });
        return;
      }
      toast.success("Idea submitted", {
        description: "We’ll review it and you’ll see it appear in the list.",
      });
      setTitle("");
      setDescription("");
      setEmail("");
      onSubmitted?.();
    });
  };

  return (
    <Card
      className={cn(
        "relative overflow-hidden border-orange-200/50 shadow-md dark:border-orange-900/40",
        "bg-gradient-to-b from-card via-card to-orange-50/30 dark:to-orange-950/15"
      )}
    >
      <div
        className="pointer-events-none absolute -right-20 -top-16 h-40 w-40 rounded-full bg-orange-400/15 blur-2xl dark:bg-orange-500/10"
        aria-hidden
      />
      <CardHeader className="relative space-y-3 pb-2">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-500 text-white shadow-md shadow-orange-500/25">
            <Sparkles className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <CardTitle className="text-lg font-semibold tracking-tight">Pitch an idea</CardTitle>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              The best requests are short, specific, and tied to something you do every week.
            </p>
          </div>
        </div>
        <ul className="flex flex-wrap gap-2 pt-1">
          {tips.map((t) => (
            <li
              key={t}
              className="rounded-full border border-border/60 bg-background/80 px-2.5 py-1 text-[11px] font-medium text-muted-foreground backdrop-blur-sm"
            >
              {t}
            </li>
          ))}
        </ul>
      </CardHeader>
      <CardContent className="relative">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <FieldLabel htmlFor="feature-title" className="flex items-center gap-2">
              <PenLine className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
              Title
            </FieldLabel>
            <Input
              id="feature-title"
              placeholder="e.g. Export activity to CSV"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              maxLength={200}
              disabled={isPending}
              className="border-border/80 bg-background/80"
            />
          </div>

          <div className="space-y-2">
            <FieldLabel htmlFor="feature-desc">Description</FieldLabel>
            <Textarea
              id="feature-desc"
              placeholder="What problem does this solve? Any workflow or client story helps."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              className="resize-none border-border/80 bg-background/80"
              maxLength={8000}
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <FieldLabel htmlFor="feature-email">
              Email{" "}
              <span className="text-xs font-normal text-muted-foreground">(optional)</span>
            </FieldLabel>
            <Input
              id="feature-email"
              type="email"
              placeholder="If you’re open to a quick follow-up"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isPending}
              className="border-border/80 bg-background/80"
            />
          </div>

          <p className="rounded-lg border border-dashed border-border/70 bg-muted/25 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
            Attachments aren’t supported yet — paste links or describe mockups in the description.
          </p>

          <Button
            type="submit"
            className="w-full rounded-full shadow-md shadow-orange-500/15"
            size="lg"
            disabled={isPending || !title.trim()}
          >
            {isPending ? (
              "Sending…"
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" aria-hidden />
                Send to the team
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
