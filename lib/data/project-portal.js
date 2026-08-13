import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { resolvePortalBrandColor } from "@/lib/branding/portal-brand-tokens";
import { getMarketingEmailPreferenceState } from "@/lib/notifications/marketing-email-preference";

function firstName(fullName) {
  const s = (fullName || "").trim();
  if (!s) return "there";
  return s.split(/\s+/)[0];
}

/**
 * Full portal bundle for `/project/[projectId]/*` (sidebar, welcome, dashboard hints).
 * Deduped per request via React `cache`.
 * Returns null if the user cannot read the project (RLS).
 */
export const getProjectPortalBundle = cache(async (projectId) => {
  if (!projectId || typeof projectId !== "string") {
    return null;
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !user) {
    return null;
  }

  const { data: project, error: pErr } = await supabase
    .from("projects")
    .select(
      "id, name, welcome_message, kickoff_questions, invite_email, freelancer_id, client_id, client_name_snapshot, client_email_snapshot, client_avatar_snapshot, brand_color, logo_url, status, freelancer_display_name, freelancer_avatar_url, freelancer_calendar_link"
    )
    .eq("id", projectId)
    .maybeSingle();

  if (pErr || !project) {
    return null;
  }

  const isFreelancer = project.freelancer_id === user.id;

  let viewerProfileName = null;
  let viewerProfileAvatar = null;
  let viewerProfileEmail = null;
  if (!isFreelancer) {
    const { data: viewerProfile } = await supabase
      .from("profiles")
      .select("full_name, email, avatar_url")
      .eq("id", user.id)
      .maybeSingle();
    viewerProfileName =
      (typeof viewerProfile?.full_name === "string" && viewerProfile.full_name.trim()) || null;
    viewerProfileAvatar =
      (typeof viewerProfile?.avatar_url === "string" && viewerProfile.avatar_url.trim()) || null;
    viewerProfileEmail =
      (typeof viewerProfile?.email === "string" && viewerProfile.email.trim()) || null;
  }

  let marketingPrefs = { marketingEmails: false, consentRecorded: false };
  if (isFreelancer) {
    const { data: profileRow } = await supabase
      .from("profiles")
      .select("notification_preferences")
      .eq("id", user.id)
      .maybeSingle();
    marketingPrefs = getMarketingEmailPreferenceState(profileRow?.notification_preferences);
  }

  const clientName = project.client_name_snapshot?.trim() || "Client";
  const clientEmail = project.client_email_snapshot?.trim() || "";
  const clientAvatar = project.client_avatar_snapshot || null;

  // Kickoff Q&A disabled: direct welcome only. Restore: map `project.kickoff_questions` (string[]) to
  // `{ id, question, type }[]`, set hasQuestions = questions.length > 0.
  const questions = [];
  const hasQuestions = false;
  const viewerDisplayName =
    viewerProfileName || user.email?.split("@")[0] || "Client";
  const fn = firstName(
    isFreelancer ? project.client_name_snapshot || "there" : viewerDisplayName
  );

  const freelancerName =
    project.freelancer_display_name?.trim() || "Freelancer";
  const freelancerAvatar = project.freelancer_avatar_url || null;
  const freelancerEmail = isFreelancer ? user.email || null : null;
  const calendarLink = project.freelancer_calendar_link?.trim() || null;

  const planType =
    project.status === "on_hold"
      ? "On hold"
      : project.status === "draft"
        ? "Draft"
        : "Active";

  return {
    projectId: project.id,
    sidebar: {
      projectName: project.name || "Project",
      planType,
      clientName: clientName || "Client",
      clientEmail: clientEmail || "—",
      clientAvatar,
      logo: project.logo_url || null,
    },
    welcome: {
      id: project.id,
      clientName: fn,
      hasQuestions,
      questions,
      welcomeMessage: project.welcome_message || null,
    },
    dashboard: {
      greetingName: fn,
      freelancerName,
      freelancerAvatar,
      freelancerEmail,
      calendarLink,
    },
    meta: {
      isFreelancer,
      viewer: {
        id: user.id,
        email: viewerProfileEmail || user.email || null,
        name: isFreelancer ? freelancerName : viewerDisplayName,
        avatar: isFreelancer ? freelancerAvatar : viewerProfileAvatar,
        role: isFreelancer ? "freelancer" : "client",
      },
      ...(isFreelancer
        ? {
            marketingEmails: marketingPrefs.marketingEmails,
            marketingEmailConsentRecorded: marketingPrefs.consentRecorded,
          }
        : {}),
    },
    branding: {
      brandColor: resolvePortalBrandColor(project.brand_color),
    },
  };
});
