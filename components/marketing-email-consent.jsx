"use client";

import { Mail, Sparkles } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { MARKETING_EMAIL_CONSENT_COPY } from "@/lib/notifications/marketing-email-preference";
import { cn } from "@/lib/utils";

/**
 * @param {{
 *   checked: boolean;
 *   onCheckedChange: (checked: boolean) => void;
 *   disabled?: boolean;
 *   variant?: "onboarding" | "onboarding-compact" | "settings";
 *   className?: string;
 * }}
 */
export function MarketingEmailConsent({
  checked,
  onCheckedChange,
  disabled = false,
  variant = "onboarding",
  className,
}) {
  const controlId =
    variant === "settings" ? "marketing-emails-settings" : "marketing-emails-onboarding";

  if (variant === "onboarding-compact") {
    return (
      <div
        className={cn(
          "flex max-w-md flex-row items-start gap-3 rounded-lg border border-border/70 bg-muted/25 px-3 py-2.5",
          className
        )}
      >
        <Checkbox
          id={controlId}
          checked={checked}
          onCheckedChange={onCheckedChange}
          disabled={disabled}
          className="mt-0.5 shrink-0"
        />
        <Label
          htmlFor={controlId}
          className="flex min-w-0 flex-1 flex-col items-start gap-1 font-normal leading-snug"
        >
          <span className="text-sm font-medium text-foreground">
            {MARKETING_EMAIL_CONSENT_COPY.onboardingCompactLabel}
          </span>
          <span className="text-xs font-normal text-muted-foreground">
            {MARKETING_EMAIL_CONSENT_COPY.onboardingCompact}
          </span>
        </Label>
      </div>
    );
  }

  const copy =
    variant === "settings"
      ? {
          title: MARKETING_EMAIL_CONSENT_COPY.settingsTitle,
          body: MARKETING_EMAIL_CONSENT_COPY.settingsDescription,
        }
      : {
          title: MARKETING_EMAIL_CONSENT_COPY.title,
          body: `${MARKETING_EMAIL_CONSENT_COPY.lead} ${MARKETING_EMAIL_CONSENT_COPY.body}`,
        };

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-orange-200/70 bg-gradient-to-br from-orange-50/90 via-background to-violet-50/40 p-4 shadow-sm dark:border-orange-500/25 dark:from-orange-950/35 dark:via-card dark:to-violet-950/15",
        className
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-orange-400/15 blur-2xl"
      />
      <div className="relative space-y-3">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-500/15 text-orange-600 dark:text-orange-400">
            <Mail className="h-4 w-4" aria-hidden />
          </span>
          <div className="min-w-0 space-y-1">
            <p className="inline-flex flex-wrap items-center gap-2 text-sm font-semibold text-foreground">
              {copy.title}
              {variant === "onboarding" ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-orange-300/50 bg-white/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-orange-700 shadow-sm dark:border-orange-700/40 dark:bg-orange-950/50 dark:text-orange-200">
                  <Sparkles className="h-3 w-3 shrink-0" aria-hidden />
                  Optional
                </span>
              ) : null}
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">{copy.body}</p>
            {variant === "onboarding" ? (
              <p className="text-xs text-muted-foreground/90">
                {MARKETING_EMAIL_CONSENT_COPY.reassurance}
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-background/80 px-3 py-2.5">
          <Label htmlFor={controlId} className="cursor-pointer text-sm font-medium leading-snug">
            {MARKETING_EMAIL_CONSENT_COPY.optInLabel}
          </Label>
          {variant === "settings" ? (
            <Switch
              id={controlId}
              checked={checked}
              onCheckedChange={onCheckedChange}
              disabled={disabled}
            />
          ) : (
            <Checkbox
              id={controlId}
              checked={checked}
              onCheckedChange={onCheckedChange}
              disabled={disabled}
            />
          )}
        </div>
      </div>
    </div>
  );
}
