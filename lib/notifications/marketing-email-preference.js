import { mergeAllNotificationPreferences } from "@/lib/notifications/notification-preference-defaults";

/** Shared copy for freelancer onboarding + Settings → Notifications (never shown to clients). */
export const MARKETING_EMAIL_CONSENT_COPY = {
  title: "Updates & offer emails",
  lead: "No annoying emails — promise.",
  body: "Just offers and tips to level up your client experience. Never sent to your clients.",
  reassurance: "Turn off anytime in Settings.",
  optInLabel: "Send me offers & updates",
  /** Onboarding step 2 — keep short. */
  onboardingCompact:
    "Just offers and tips to improve your client experience.",
  onboardingCompactLabel: "Email me offers & updates.",
  settingsTitle: "Marketing emails",
  settingsDescription:
    "No annoying emails — only offers and tips to improve your client experience. Not sent to clients.",
};

/**
 * @param {unknown} raw
 */
export function getMarketingEmailPreferenceState(raw) {
  const merged = mergeAllNotificationPreferences(raw);
  return {
    marketingEmails: merged.marketingEmails === true,
    consentRecorded:
      typeof merged.marketingEmailConsentAt === "string" &&
      merged.marketingEmailConsentAt.length > 0,
  };
}
