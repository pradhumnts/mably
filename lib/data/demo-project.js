import { getAuthProviderAvatarUrl } from "@/lib/auth/user-avatar-url";
import {
  buildDemoVoiceWaveform,
  DEMO_VOICE_NOTE_STORAGE_PATH,
} from "@/lib/library/demo-voice-note";

/**
 * Demo project fixtures shown to first-time freelancers with zero real projects.
 *
 * The project is **virtual** — no DB rows exist. All loaders short-circuit when
 * they see `DEMO_PROJECT_ID`, returning the synthetic data below. All mutations
 * are blocked with a friendly message via `getDemoBlockedResponse()`.
 */

export const DEMO_PROJECT_ID = "demo-mably";

/**
 * @param {unknown} id
 * @returns {boolean}
 */
export function isDemoProjectId(id) {
  return typeof id === "string" && id.trim() === DEMO_PROJECT_ID;
}

const DEMO_CLIENT = Object.freeze({
  name: "Maya Thompson",
  email: "maya@pixellab.studio",
  avatar: "/images/demo-client-profile.webp",
  role: "Founder, Pixel Lab",
});

const DEMO_PROJECT_NAME = "Pixel Lab — Brand refresh";
const DEMO_PROJECT_DESCRIPTION =
  "A modern brand refresh for Pixel Lab — logo system, type, color, motion principles, and a lightweight rollout kit for marketing and product surfaces.";
const DEMO_PROJECT_LOGO = "/images/dummy-project-logo.webp";

const MS_PER_DAY = 86400000;

/**
 * Stable ISO timestamps relative to "today" so the demo always looks fresh.
 * @param {number} daysAgo
 * @param {number} [hour]
 * @param {number} [minute]
 */
function daysAgoIso(daysAgo, hour = 11, minute = 0) {
  const d = new Date();
  d.setUTCHours(hour, minute, 0, 0);
  d.setTime(d.getTime() - daysAgo * MS_PER_DAY);
  return d.toISOString();
}

/**
 * @param {number} daysFromNow
 */
function dateOnly(daysFromNow) {
  const d = new Date();
  d.setUTCHours(12, 0, 0, 0);
  d.setTime(d.getTime() + daysFromNow * MS_PER_DAY);
  return d.toISOString().slice(0, 10);
}

/**
 * Normalize the freelancer descriptor to the bits we render in fixtures.
 * @param {{ name?: string | null; avatar?: string | null; email?: string | null; userId?: string | null }} [freelancer]
 */
function normalizeFreelancer(freelancer) {
  const name =
    typeof freelancer?.name === "string" && freelancer.name.trim()
      ? freelancer.name.trim()
      : "You";
  const avatar =
    typeof freelancer?.avatar === "string" && freelancer.avatar.trim() ? freelancer.avatar : null;
  const email =
    typeof freelancer?.email === "string" && freelancer.email.trim() ? freelancer.email : null;
  const userId =
    typeof freelancer?.userId === "string" && freelancer.userId.trim() ? freelancer.userId : null;
  return { name, avatar, email, userId };
}

/**
 * Resolve the current freelancer's display name + avatar from the `profiles`
 * table (same source as the real app), falling back to auth metadata, then to
 * a sensible default. Use this everywhere the demo seeds the freelancer side
 * so the avatar/name match what the rest of Mably renders.
 *
 * @param {import("@supabase/supabase-js").SupabaseClient} supabase
 * @param {{ id: string; email?: string | null; user_metadata?: Record<string, unknown> | null } | null | undefined} user
 */
export async function resolveDemoFreelancerFromSupabase(supabase, user) {
  if (!user) {
    return { name: "You", avatar: null, email: null, userId: null };
  }

  const meta = (user.user_metadata && typeof user.user_metadata === "object" ? user.user_metadata : {}) || {};
  const fallbackName =
    (typeof meta.full_name === "string" && meta.full_name.trim()) ||
    (typeof meta.name === "string" && meta.name.trim()) ||
    (user.email || "").split("@")[0] ||
    "You";
  const fallbackAvatar = getAuthProviderAvatarUrl(user);

  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, avatar_url")
      .eq("id", user.id)
      .maybeSingle();

    const name =
      (profile?.full_name && String(profile.full_name).trim()) || fallbackName;
    const avatar =
      (profile?.avatar_url && String(profile.avatar_url).trim()) || fallbackAvatar;

    return {
      name,
      avatar: avatar || null,
      email: user.email || null,
      userId: user.id,
    };
  } catch {
    return {
      name: fallbackName,
      avatar: fallbackAvatar,
      email: user.email || null,
      userId: user.id,
    };
  }
}

/* ------------------------------------------------------------------ */
/* Projects list card                                                 */
/* ------------------------------------------------------------------ */

/**
 * The shape that `lib/data/projects.js -> mapProjectRow` produces, ready for
 * `<ProjectCard>` to render directly.
 */
export function getDemoProjectListItem() {
  return {
    id: DEMO_PROJECT_ID,
    name: DEMO_PROJECT_NAME,
    description: DEMO_PROJECT_DESCRIPTION,
    budget: 5000,
    status: "Active",
    dueDate: "21 May",
    logo: DEMO_PROJECT_LOGO,
    clientAvatar: DEMO_CLIENT.avatar,
    clientName: DEMO_CLIENT.name,
    isDemo: true,
  };
}

/* ------------------------------------------------------------------ */
/* Portal bundle (sidebar + welcome + dashboard greeting)             */
/* ------------------------------------------------------------------ */

/**
 * Mirrors `getProjectPortalBundle` output for use by the portal layout.
 * @param {{ name?: string; email?: string | null; avatar?: string | null } | null | undefined} freelancer
 */
export function getDemoProjectPortalBundle(freelancer) {
  const fl = normalizeFreelancer(freelancer);
  return {
    projectId: DEMO_PROJECT_ID,
    sidebar: {
      projectName: DEMO_PROJECT_NAME,
      planType: "Active",
      clientName: DEMO_CLIENT.name,
      clientEmail: DEMO_CLIENT.email,
      clientAvatar: DEMO_CLIENT.avatar,
      logo: DEMO_PROJECT_LOGO,
    },
    welcome: {
      id: DEMO_PROJECT_ID,
      clientName: DEMO_CLIENT.name.split(" ")[0],
      hasQuestions: false,
      questions: [],
      welcomeMessage: null,
    },
    dashboard: {
      greetingName: DEMO_CLIENT.name.split(" ")[0],
      freelancerName: fl.name,
      freelancerAvatar: fl.avatar,
      freelancerEmail: fl.email,
      calendarLink: null,
    },
    meta: {
      isFreelancer: true,
      isDemo: true,
    },
  };
}

/* ------------------------------------------------------------------ */
/* Activity                                                           */
/* ------------------------------------------------------------------ */

/**
 * Same shape as `getProjectActivityPageData` returns.
 * @param {{ name?: string; avatar?: string | null } | null | undefined} freelancer
 */
export function getDemoProjectActivityPageData(freelancer) {
  const fl = normalizeFreelancer(freelancer);
  const project = {
    title: DEMO_PROJECT_NAME,
    description: DEMO_PROJECT_DESCRIPTION,
    status: "In progress",
    dueDate: "21 May",
    pricingType: "milestone",
    sidebar: {
      status: "In progress",
      dueDate: "21 May",
      milestones: [
        { id: "m-0", title: "Discovery & strategy", amount: "$1,500", delivery: "Due 28 Apr", completed: true },
        { id: "m-1", title: "Brand identity", amount: "$1,500", delivery: "Due 8 May", completed: true },
        { id: "m-2", title: "Style guide & rollout", amount: "$2,000", delivery: "Due 21 May", completed: false },
      ],
      timeline: "21 Apr — 21 May",
      totalFee: "$5,000",
    },
  };

  const clientUser = { name: DEMO_CLIENT.name, avatar: DEMO_CLIENT.avatar || "" };
  const freelancerUser = { name: fl.name, avatar: fl.avatar || "" };

  /**
   * Activity item shape mirrors `mapActivityEventRowToTimelineItem` output.
   * Keys match what the timeline component reads.
   */
  const activities = [
    {
      id: "demo-act-1",
      eventType: "invoice.created",
      category: "payments",
      user: freelancerUser,
      action: "Sent an invoice",
      timestamp: "Today",
      badge: { type: "Payment", icon: "💰", text: "Invoice sent" },
      paymentDetails: { amount: "$2,000.00", invoiceNumber: "#DEMO0003" },
      destinationHref: `/project/${DEMO_PROJECT_ID}/payments`,
      destinationLabel: "Open payments",
      externalHref: null,
      externalLabel: null,
    },
    {
      id: "demo-act-2",
      eventType: "library.file.comment",
      category: "comments",
      user: clientUser,
      action: "Left a voice note on",
      timestamp: "Yesterday",
      fileLink: "Typography.pdf",
      voiceNote: {
        projectId: DEMO_PROJECT_ID,
        fileId: "demo-file-5",
        commentId: "demo-comment-4",
        durationMs: 42_000,
        waveform: buildDemoVoiceWaveform(2),
        caption:
          "Could we tighten the spacing tokens and add a section on motion before we share with the team?",
      },
      destinationHref: `/project/${DEMO_PROJECT_ID}/library/files?discussion=demo-file-5`,
      destinationLabel: "Open thread in library",
      externalHref: null,
      externalLabel: null,
    },
    {
      id: "demo-act-3",
      eventType: "library.file.uploaded",
      category: "files",
      user: freelancerUser,
      action: "Uploaded",
      timestamp: "2 days ago",
      fileLink: "Typography.pdf",
      fileMetadata: { needsApproval: true },
      destinationHref: `/project/${DEMO_PROJECT_ID}/library/files?discussion=demo-file-5`,
      destinationLabel: "Open in library",
      externalHref: null,
      externalLabel: null,
    },
    {
      id: "demo-act-4",
      eventType: "library.link.created",
      category: "files",
      user: freelancerUser,
      action: "Added a library link:",
      timestamp: "3 days ago",
      fileLink: "Calendly — Book a 30min review",
      destinationHref: `/project/${DEMO_PROJECT_ID}/library/links`,
      destinationLabel: "View in links",
      externalHref: "https://calendly.com/",
      externalLabel: "Open shared link",
    },
    {
      id: "demo-act-5",
      eventType: "library.file.uploaded",
      category: "files",
      user: freelancerUser,
      action: "Uploaded",
      timestamp: "4 days ago",
      fileLink: "Logo sources.zip",
      fileMetadata: { needsApproval: false },
      destinationHref: `/project/${DEMO_PROJECT_ID}/library/files`,
      destinationLabel: "Open in library",
      externalHref: null,
      externalLabel: null,
    },
    {
      id: "demo-act-6",
      eventType: "invoice.created",
      category: "payments",
      user: freelancerUser,
      action: "Sent an invoice",
      timestamp: "5 days ago",
      badge: { type: "Payment", icon: "💰", text: "Invoice sent" },
      paymentDetails: { amount: "$1,500.00", invoiceNumber: "#DEMO0002" },
      destinationHref: `/project/${DEMO_PROJECT_ID}/payments`,
      destinationLabel: "Open payments",
      externalHref: null,
      externalLabel: null,
    },
    {
      id: "demo-act-7",
      eventType: "library.file.uploaded",
      category: "files",
      user: freelancerUser,
      action: "Uploaded",
      timestamp: "5 days ago",
      fileLink: "Hero animation.mp4",
      fileMetadata: { needsApproval: true },
      destinationHref: `/project/${DEMO_PROJECT_ID}/library/files`,
      destinationLabel: "Open in library",
      externalHref: null,
      externalLabel: null,
    },
    {
      id: "demo-act-8",
      eventType: "library.link.created",
      category: "files",
      user: freelancerUser,
      action: "Added a library link:",
      timestamp: "7 days ago",
      fileLink: "Miro — Mood board",
      destinationHref: `/project/${DEMO_PROJECT_ID}/library/links`,
      destinationLabel: "View in links",
      externalHref: "https://miro.com/",
      externalLabel: "Open shared link",
    },
    {
      id: "demo-act-9",
      eventType: "library.file.approval_changed",
      category: "approvals",
      user: clientUser,
      action: "Approved",
      timestamp: "1 week ago",
      fileLink: "Logo concepts v1.png",
      badge: { type: "Approved", icon: "✓", text: "Approved" },
      destinationHref: `/project/${DEMO_PROJECT_ID}/library/files`,
      destinationLabel: "Open in library",
      externalHref: null,
      externalLabel: null,
    },
    {
      id: "demo-act-10",
      eventType: "library.file.comment",
      category: "comments",
      user: clientUser,
      action: "Left a voice note on",
      timestamp: "1 week ago",
      fileLink: "Logo concepts v1.png",
      voiceNote: {
        projectId: DEMO_PROJECT_ID,
        fileId: "demo-file-2",
        commentId: "demo-comment-1",
        durationMs: 28_000,
        waveform: buildDemoVoiceWaveform(1),
        caption: "Love direction 2 — could we explore a wordmark version too?",
      },
      destinationHref: `/project/${DEMO_PROJECT_ID}/library/files?discussion=demo-file-2`,
      destinationLabel: "Open thread in library",
      externalHref: null,
      externalLabel: null,
    },
    {
      id: "demo-act-11",
      eventType: "library.file.uploaded",
      category: "files",
      user: freelancerUser,
      action: "Uploaded",
      timestamp: "1 week ago",
      fileLink: "Logo concepts v1.png",
      fileMetadata: { needsApproval: true },
      destinationHref: `/project/${DEMO_PROJECT_ID}/library/files`,
      destinationLabel: "Open in library",
      externalHref: null,
      externalLabel: null,
    },
    {
      id: "demo-act-12",
      eventType: "library.file.uploaded",
      category: "files",
      user: clientUser,
      action: "Uploaded",
      timestamp: "1 week ago",
      fileLink: "Typography.pdf",
      fileMetadata: { needsApproval: false },
      destinationHref: `/project/${DEMO_PROJECT_ID}/library/files`,
      destinationLabel: "Open in library",
      externalHref: null,
      externalLabel: null,
    },
    {
      id: "demo-act-13",
      eventType: "library.link.created",
      category: "files",
      user: clientUser,
      action: "Added a library link:",
      timestamp: "2 weeks ago",
      fileLink: "Figma — Brand refresh working file",
      destinationHref: `/project/${DEMO_PROJECT_ID}/library/links`,
      destinationLabel: "View in links",
      externalHref: "https://figma.com/",
      externalLabel: "Open shared link",
    },
    {
      id: "demo-act-14",
      eventType: "invoice.created",
      category: "payments",
      user: freelancerUser,
      action: "Sent an invoice",
      timestamp: "2 weeks ago",
      badge: { type: "Payment", icon: "💰", text: "Invoice sent" },
      paymentDetails: { amount: "$1,500.00", invoiceNumber: "#DEMO0001" },
      destinationHref: `/project/${DEMO_PROJECT_ID}/payments`,
      destinationLabel: "Open payments",
      externalHref: null,
      externalLabel: null,
    },
  ];

  return { ok: true, error: null, project, activities };
}

/* ------------------------------------------------------------------ */
/* Library files                                                      */
/* ------------------------------------------------------------------ */

/**
 * Mirrors the row shape that `listLibraryFiles` returns.
 * @param {{ name?: string; avatar?: string | null } | null | undefined} freelancer
 */
export function getDemoLibraryFiles(freelancer) {
  const fl = normalizeFreelancer(freelancer);
  return [
    {
      id: "demo-file-5",
      display_name: "Typography.pdf",
      original_filename: "Typography.pdf",
      mime_type: "application/pdf",
      size_bytes: 277_610,
      description: "Typography reference — type scale, spacing tokens, and font pairing notes.",
      needs_approval: true,
      approval_status: "revision_requested",
      created_by_display_name: fl.name,
      created_by_avatar_url: fl.avatar,
      created_at: daysAgoIso(2, 16, 12),
      unread_comment_count: 0,
    },
    {
      id: "demo-file-4",
      display_name: "Logo sources.zip",
      original_filename: "logo-sources.zip",
      mime_type: "application/zip",
      size_bytes: 24_200_000,
      description: "Editable logo files — AI, SVG, PNG @1x/2x/3x.",
      needs_approval: false,
      approval_status: null,
      created_by_display_name: fl.name,
      created_by_avatar_url: fl.avatar,
      created_at: daysAgoIso(4, 14, 30),
      unread_comment_count: 0,
    },
    {
      id: "demo-file-3",
      display_name: "Hero animation.mp4",
      original_filename: "hero-animation.mp4",
      mime_type: "video/mp4",
      size_bytes: 12_700_000,
      description: "30s hero animation for the homepage — let me know which timing version you prefer.",
      needs_approval: true,
      approval_status: "pending",
      created_by_display_name: fl.name,
      created_by_avatar_url: fl.avatar,
      created_at: daysAgoIso(5, 10, 5),
      unread_comment_count: 0,
    },
    {
      id: "demo-file-2",
      display_name: "Logo concepts v1.png",
      original_filename: "logo-concepts-v1.png",
      mime_type: "image/png",
      size_bytes: 1_420_000,
      description: "Four directions — wordmark, monogram, abstract mark, and a combination mark.",
      needs_approval: true,
      approval_status: "approved",
      created_by_display_name: fl.name,
      created_by_avatar_url: fl.avatar,
      created_at: daysAgoIso(8, 9, 0),
      unread_comment_count: 0,
    },
    {
      id: "demo-file-1",
      display_name: "Typography.pdf",
      original_filename: "Typography.pdf",
      mime_type: "application/pdf",
      size_bytes: 277_610,
      description: "Typography reference — hierarchy, weights, and usage guidelines for the brand.",
      needs_approval: false,
      approval_status: null,
      created_by_display_name: DEMO_CLIENT.name,
      created_by_avatar_url: DEMO_CLIENT.avatar,
      created_at: daysAgoIso(10, 13, 22),
      unread_comment_count: 0,
    },
  ];
}

/** Public sample URLs for in-browser preview in the demo portal (no storage bucket). */
const DEMO_LIBRARY_FILE_PREVIEW_URLS = {
  "demo-file-1": "/Typography.pdf",
  "demo-file-2": "/images/dummy-project-logo.webp",
  "demo-file-3": "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
  "demo-file-5": "/Typography.pdf",
};

/**
 * @param {string} fileId
 * @returns {string | null}
 */
export function getDemoLibraryFilePreviewUrl(fileId) {
  const id = typeof fileId === "string" ? fileId.trim() : "";
  return DEMO_LIBRARY_FILE_PREVIEW_URLS[id] ?? null;
}

/* ------------------------------------------------------------------ */
/* File discussion comments                                           */
/* ------------------------------------------------------------------ */

/**
 * Same shape as `listLibraryFileComments` returns. Most demo files have no
 * comments — only the two referenced from the activity timeline carry threads.
 *
 * @param {string} fileId
 * @param {{ name?: string; avatar?: string | null } | null | undefined} freelancer
 */
export function getDemoLibraryFileComments(fileId, freelancer) {
  const fl = normalizeFreelancer(freelancer);

  const withVoiceDefaults = (rows) =>
    rows.map((c) => ({
      voice_note_storage_path: null,
      voice_note_duration_ms: null,
      voice_note_mime_type: null,
      voice_note_size_bytes: null,
      voice_note_waveform: null,
      voice_note_transcript: null,
      voice_note_listened: false,
      ...c,
    }));

  if (fileId === "demo-file-2") {
    return withVoiceDefaults([
      {
        id: "demo-comment-1",
        body: "Love direction 2 — could we explore a wordmark version too?",
        author_id: "demo-client",
        author_display_name: DEMO_CLIENT.name,
        author_avatar_url: DEMO_CLIENT.avatar,
        created_at: daysAgoIso(8, 16, 12),
        voice_note_storage_path: DEMO_VOICE_NOTE_STORAGE_PATH,
        voice_note_duration_ms: 28_000,
        voice_note_mime_type: "audio/webm",
        voice_note_size_bytes: 186_000,
        voice_note_waveform: buildDemoVoiceWaveform(1),
      },
      {
        id: "demo-comment-2",
        body: "Wordmark explorations coming in the next round — should have it by Friday 👍",
        author_id: "demo-freelancer",
        author_display_name: fl.name,
        author_avatar_url: fl.avatar,
        created_at: daysAgoIso(7, 9, 30),
      },
      {
        id: "demo-comment-3",
        body: "Perfect, thank you! Approving the current direction so you can keep moving.",
        author_id: "demo-client",
        author_display_name: DEMO_CLIENT.name,
        author_avatar_url: DEMO_CLIENT.avatar,
        created_at: daysAgoIso(7, 11, 5),
      },
    ]);
  }

  if (fileId === "demo-file-5") {
    return withVoiceDefaults([
      {
        id: "demo-comment-4",
        body: "Could we tighten the spacing tokens and add a section on motion before we share with the team?",
        author_id: "demo-client",
        author_display_name: DEMO_CLIENT.name,
        author_avatar_url: DEMO_CLIENT.avatar,
        created_at: daysAgoIso(1, 14, 22),
        voice_note_storage_path: DEMO_VOICE_NOTE_STORAGE_PATH,
        voice_note_duration_ms: 42_000,
        voice_note_mime_type: "audio/webm",
        voice_note_size_bytes: 264_000,
        voice_note_waveform: buildDemoVoiceWaveform(2),
      },
    ]);
  }

  return [];
}

/* ------------------------------------------------------------------ */
/* Library links                                                      */
/* ------------------------------------------------------------------ */

/**
 * Mirrors the row shape that `listLibraryLinks` returns.
 * @param {{ name?: string; avatar?: string | null } | null | undefined} freelancer
 */
export function getDemoLibraryLinks(freelancer) {
  const fl = normalizeFreelancer(freelancer);
  return [
    {
      id: "demo-link-4",
      title: "Calendly — Book a 30min review",
      url: "https://calendly.com/",
      description: "Grab a slot for the weekly review call — I keep Wednesdays open.",
      needs_approval: false,
      created_by_display_name: fl.name,
      created_by_avatar_url: fl.avatar,
      created_at: daysAgoIso(3, 18, 0),
    },
    {
      id: "demo-link-3",
      title: "Miro — Mood board",
      url: "https://miro.com/",
      description: "Visual references and mood directions explored during discovery.",
      needs_approval: false,
      created_by_display_name: fl.name,
      created_by_avatar_url: fl.avatar,
      created_at: daysAgoIso(7, 11, 45),
    },
    {
      id: "demo-link-2",
      title: "Notion — Project brief & timeline",
      url: "https://notion.so/",
      description: "Single source of truth for scope, milestones, and decisions.",
      needs_approval: false,
      created_by_display_name: DEMO_CLIENT.name,
      created_by_avatar_url: DEMO_CLIENT.avatar,
      created_at: daysAgoIso(10, 9, 30),
    },
    {
      id: "demo-link-1",
      title: "Figma — Brand refresh working file",
      url: "https://figma.com/",
      description: "Live working file — all in-progress concepts and explorations.",
      needs_approval: false,
      created_by_display_name: DEMO_CLIENT.name,
      created_by_avatar_url: DEMO_CLIENT.avatar,
      created_at: daysAgoIso(12, 14, 0),
    },
  ];
}

/* ------------------------------------------------------------------ */
/* Invoices                                                           */
/* ------------------------------------------------------------------ */

/**
 * Mirrors the mapped row shape that `listProjectInvoices` returns.
 */
export function getDemoProjectInvoices() {
  return [
    {
      id: "demo-invoice-3",
      amount: 2000,
      invoiceDate: dateOnly(-2),
      dueDate: dateOnly(12),
      invoiceLink: "https://stripe.com/",
      notes: "Final milestone — style guide, motion principles, and rollout kit.",
      status: "unpaid",
      createdAt: daysAgoIso(2, 17, 0),
    },
    {
      id: "demo-invoice-2",
      amount: 1500,
      invoiceDate: dateOnly(-5),
      dueDate: dateOnly(-1),
      invoiceLink: "https://stripe.com/",
      notes: "Milestone 2 — logo system, color, and type.",
      status: "paid",
      createdAt: daysAgoIso(5, 12, 0),
    },
    {
      id: "demo-invoice-1",
      amount: 1500,
      invoiceDate: dateOnly(-14),
      dueDate: dateOnly(-10),
      invoiceLink: "https://stripe.com/",
      notes: "Deposit & discovery — strategy workshop and audit.",
      status: "paid",
      createdAt: daysAgoIso(14, 10, 0),
    },
  ];
}

/* ------------------------------------------------------------------ */
/* Chat                                                               */
/* ------------------------------------------------------------------ */

/**
 * Same shape as `getProjectChatBootstrap` returns. Mocks a short, friendly
 * conversation between the freelancer and the demo client.
 *
 * IMPORTANT: freelancer messages are tagged with the real auth `userId` so
 * the chat widget evaluates `message.authorId === currentUserId` and renders
 * them on the right (own) side with the correct avatar.
 *
 * @param {{ name?: string; email?: string | null; avatar?: string | null; userId?: string | null } | null | undefined} freelancer
 */
export function getDemoProjectChatBootstrap(freelancer) {
  const fl = normalizeFreelancer(freelancer);
  const conversationId = "demo-conversation";
  const flAuthorId = fl.userId || "demo-freelancer-user";
  const clientAuthorId = "demo-client-user";
  const firstName = fl.name.split(" ")[0];

  const messages = [
    {
      id: "demo-msg-1",
      content: `Hey ${firstName}! Excited to kick this off. I just dropped the brief in the library — let me know if anything's missing.`,
      authorId: clientAuthorId,
      createdAt: daysAgoIso(10, 13, 24),
      user: { name: DEMO_CLIENT.name },
      authorAvatarUrl: DEMO_CLIENT.avatar,
    },
    {
      id: "demo-msg-2",
      content: "Perfect — going through it now. I'll send first logo directions early next week.",
      authorId: flAuthorId,
      createdAt: daysAgoIso(10, 13, 38),
      user: { name: fl.name },
      authorAvatarUrl: fl.avatar,
    },
    {
      id: "demo-msg-3",
      content: "Amazing, thank you! Looking forward to seeing them ✨",
      authorId: clientAuthorId,
      createdAt: daysAgoIso(10, 13, 42),
      user: { name: DEMO_CLIENT.name },
      authorAvatarUrl: DEMO_CLIENT.avatar,
    },
    {
      id: "demo-msg-4",
      content:
        "Hey Maya — just uploaded the first round of logo concepts to the library. Four directions to start: wordmark, monogram, abstract mark, and a combo. Take your time, no rush!",
      authorId: flAuthorId,
      createdAt: daysAgoIso(8, 9, 5),
      user: { name: fl.name },
      authorAvatarUrl: fl.avatar,
    },
    {
      id: "demo-msg-5",
      content: "Loved the direction on concept 2 — thank you for the wordmark explorations too!",
      authorId: clientAuthorId,
      createdAt: daysAgoIso(7, 11, 12),
      user: { name: DEMO_CLIENT.name },
      authorAvatarUrl: DEMO_CLIENT.avatar,
    },
    {
      id: "demo-msg-6",
      content:
        "Awesome — locking that in. I'll move to the color system + type next, and have the style guide draft over to you in a few days.",
      authorId: flAuthorId,
      createdAt: daysAgoIso(7, 11, 30),
      user: { name: fl.name },
      authorAvatarUrl: fl.avatar,
    },
    {
      id: "demo-msg-7",
      content:
        "Typography.pdf is up in the library now. Let me know what you think — happy to iterate on anything before we share with the team.",
      authorId: flAuthorId,
      createdAt: daysAgoIso(2, 16, 14),
      user: { name: fl.name },
      authorAvatarUrl: fl.avatar,
    },
    {
      id: "demo-msg-8",
      content:
        "Quick note on Typography.pdf — left a comment on the file. Mostly spacing tokens + a small motion section.",
      authorId: clientAuthorId,
      createdAt: daysAgoIso(1, 14, 25),
      user: { name: DEMO_CLIENT.name },
      authorAvatarUrl: DEMO_CLIENT.avatar,
    },
    {
      id: "demo-msg-9",
      content: "Got it — on it. I'll have v2 ready by end of week. Also dropped the final invoice in payments whenever you're ready.",
      authorId: flAuthorId,
      createdAt: daysAgoIso(1, 15, 2),
      user: { name: fl.name },
      authorAvatarUrl: fl.avatar,
    },
  ];

  return {
    ok: true,
    conversationId,
    currentUserId: flAuthorId,
    unreadCount: 0,
    messages,
    header: {
      projectName: DEMO_PROJECT_NAME,
      projectLogo: DEMO_PROJECT_LOGO,
      clientName: DEMO_CLIENT.name,
      clientAvatar: DEMO_CLIENT.avatar,
      freelancerName: fl.name,
      freelancerAvatar: fl.avatar,
    },
  };
}

/* ------------------------------------------------------------------ */
/* Settings page                                                      */
/* ------------------------------------------------------------------ */

/**
 * Same shape as `getPortalProjectSettings` returns. Freelancer-only because
 * the demo is only ever viewed by a freelancer with zero real projects.
 *
 * @param {{ name?: string; email?: string | null; avatar?: string | null; userId?: string | null } | null | undefined} freelancer
 * @param {{ phone?: string | null } | null | undefined} [profile]
 */
export function getDemoPortalProjectSettings(freelancer, profile) {
  const fl = normalizeFreelancer(freelancer);

  // Pre-compute today-relative date range for the demo project: ~21 days back
  // to ~21 days forward, so the start/due dates always feel current.
  const start = new Date();
  start.setUTCHours(12, 0, 0, 0);
  start.setTime(start.getTime() - 21 * MS_PER_DAY);
  const end = new Date();
  end.setUTCHours(12, 0, 0, 0);
  end.setTime(end.getTime() + 21 * MS_PER_DAY);

  return {
    ok: true,
    role: "freelancer",
    project: {
      id: DEMO_PROJECT_ID,
      name: DEMO_PROJECT_NAME,
      description: DEMO_PROJECT_DESCRIPTION,
      startDate: start.toISOString().slice(0, 10),
      endDate: end.toISOString().slice(0, 10),
      status: "active",
      logoUrl: DEMO_PROJECT_LOGO,
      clientNameSnapshot: "Pixel Lab",
    },
    profile: {
      fullName: fl.name,
      email: fl.email || "",
      phone: (profile && typeof profile.phone === "string" ? profile.phone : "") || "",
      avatarUrl: fl.avatar,
    },
    notifications: {
      fileUploads: true,
      newMessages: true,
      paymentReminders: true,
      milestoneDeadlines: true,
      activityNotifications: {
        fileApprovals: true,
        comments: true,
        milestoneStarted: true,
        milestoneCompleted: true,
        invoiceSent: false,
      },
    },
  };
}

/* ------------------------------------------------------------------ */
/* Library storage usage                                              */
/* ------------------------------------------------------------------ */

/**
 * Same shape as `getLibraryStorageUsageForProject` returns for the project owner.
 */
export function getDemoStorageUsageResponse() {
  const used = 44_510_000;
  return {
    ok: true,
    hidden: false,
    usedBytes: used,
    totalBytes: 1_073_741_824,
    maxFileBytes: 10 * 1024 * 1024,
    maxFileLabel: "10 MB",
    planKey: null,
    paid: false,
    percentUsed: Math.round((used / 1_073_741_824) * 1000) / 10,
  };
}

/* ------------------------------------------------------------------ */
/* Mutation blockers                                                  */
/* ------------------------------------------------------------------ */

const DEMO_BLOCK_MESSAGE =
  "This is a demo project — your changes here aren't saved. Create your first real project to start collaborating with a client.";

/**
 * Standard response shape for blocked writes on the demo project.
 * @param {Record<string, unknown>} [extra] additional fields some callers expect (e.g. `id: null`).
 */
export function getDemoBlockedResponse(extra) {
  return { ok: false, error: DEMO_BLOCK_MESSAGE, ...(extra || {}) };
}
