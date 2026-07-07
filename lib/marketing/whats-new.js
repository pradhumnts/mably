/**
 * Product updates for /whats-new — user-facing announcements only.
 * @typedef {{ emoji: string; label: string; className: string }} WhatsNewCategory
 * @typedef {{ category: WhatsNewCategory; title: string; description: string; bullets: string[] }} WhatsNewItem
 * @typedef {{ date: string; dateLabel: string; items: WhatsNewItem[] }} WhatsNewGroup
 */

/** @type {WhatsNewGroup[]} */
export const WHATS_NEW_GROUPS = [
  {
    date: "2026-06-28",
    dateLabel: "June 28, 2026",
    items: [
      {
        category: { emoji: "✨", label: "Website", className: "text-orange-700 bg-orange-50" },
        title: "A refreshed mably.io",
        description:
          "We gave the Mably website a full refresh — clearer story, updated pricing, and answers to common questions. Easier to see what Mably does before you sign up.",
        bullets: [
          "New landing page built around the client workspace experience",
          "Pricing and FAQ in one place",
          "Legal pages (Terms, Privacy, and more) easy to find",
        ],
      },
      {
        category: { emoji: "📁", label: "Library", className: "text-sky-700 bg-sky-50" },
        title: "File versions, kept in one thread",
        description:
          "Upload a new version without losing the conversation. Clients see the latest file; every revision stays in the same discussion.",
        bullets: [
          "Upload a new version from the library or file preview",
          "Switch between versions while you read comments",
          "Activity shows when a new version is shared",
        ],
      },
      {
        category: { emoji: "💬", label: "Discussions", className: "text-violet-700 bg-violet-50" },
        title: "Attach files in a comment",
        description:
          "Drop references, alternates, or extra context into a file discussion — without starting a new email thread.",
        bullets: [
          "Attach multiple files to one comment",
          "Rename files before you post",
          "Everything stays in the same conversation",
        ],
      },
    ],
  },
  {
    date: "2026-06-08",
    dateLabel: "June 8, 2026",
    items: [
      {
        category: { emoji: "📱", label: "Mobile", className: "text-emerald-700 bg-emerald-50" },
        title: "PDF previews on your phone",
        description:
          "Open library PDFs on mobile without downloading first — handy when a client checks a deliverable on the go.",
        bullets: [
          "Read PDFs inside the file preview",
          "Comfortable fit on smaller screens",
          "Same library, easier to use away from your desk",
        ],
      },
    ],
  },
  {
    date: "2026-05-24",
    dateLabel: "May 24, 2026",
    items: [
      {
        category: { emoji: "🔔", label: "Notifications", className: "text-amber-700 bg-amber-50" },
        title: "Notifications inbox",
        description:
          "When a client comments, approves a file, or something happens on a project, you see it in one place.",
        bullets: [
          "In-app inbox for project updates",
          "Optional browser notifications when you turn them on",
          "Tap through to the file or project",
        ],
      },
    ],
  },
  {
    date: "2026-05-20",
    dateLabel: "May 20, 2026",
    items: [
      {
        category: { emoji: "🎨", label: "Branding", className: "text-pink-700 bg-pink-50" },
        title: "Client portals that look like your studio",
        description:
          "Add your logo and brand color — every client portal feels like an extension of your work, not a generic tool.",
        bullets: [
          "Your logo on the client portal",
          "Accent color across buttons and highlights",
          "Polished look from the first project you create",
        ],
      },
    ],
  },
  {
    date: "2026-05-16",
    dateLabel: "May 16, 2026",
    items: [
      {
        category: { emoji: "🎙️", label: "Voice", className: "text-indigo-700 bg-indigo-50" },
        title: "Voice notes on files",
        description:
          "Sometimes typing feedback is slow. Record a quick voice note on a deliverable — clients hear it right in the thread.",
        bullets: [
          "Record and play back in file discussions",
          "See how long each note is",
          "Works alongside text comments",
        ],
      },
      {
        category: { emoji: "👁️", label: "Preview", className: "text-zinc-700 bg-zinc-100" },
        title: "Preview files without downloading",
        description:
          "Open images and PDFs in a full preview — review work faster and keep the conversation beside the file.",
        bullets: [
          "Preview common file types in the app",
          "Discussion stays open next to the preview",
          "Less back-and-forth over email attachments",
        ],
      },
      {
        category: { emoji: "💰", label: "Pricing", className: "text-orange-700 bg-orange-50" },
        title: "Early subscriber pricing",
        description:
          "Our first subscribers can lock in a heavily discounted Growth plan — a thank-you for joining early.",
        bullets: [
          "75% off Growth for founding subscribers",
          "Simple Starter and Growth plans to choose from",
          "Clear limits on projects and library storage per plan",
        ],
      },
    ],
  },
  {
    date: "2026-05-11",
    dateLabel: "May 11, 2026",
    items: [
      {
        category: { emoji: "🚀", label: "Getting started", className: "text-orange-700 bg-orange-50" },
        title: "Try Mably with a demo project",
        description:
          "New accounts include a sample project so you can explore approvals, the library, and activity before inviting a real client.",
        bullets: [
          "Demo workspace ready on signup",
          "See the client experience firsthand",
          "Sample files and discussions to click through",
        ],
      },
      {
        category: { emoji: "📁", label: "Library", className: "text-sky-700 bg-sky-50" },
        title: "Smarter library cards",
        description:
          "Small improvements that help when you juggle lots of files across projects.",
        bullets: [
          "See when a file has unread comments",
          "File size shown on each card",
          "Sort by date or size",
        ],
      },
    ],
  },
  {
    date: "2026-05-08",
    dateLabel: "May 8, 2026",
    items: [
      {
        category: { emoji: "🔗", label: "Client portal", className: "text-teal-700 bg-teal-50" },
        title: "A proper home for your clients",
        description:
          "Clients invited to a project land in their own portal — files, updates, and feedback in one link, without seeing your freelancer dashboard.",
        bullets: [
          "Clients with multiple projects can pick the right one",
          "Each portal shows only what they need",
          "You stay in control on the freelancer side",
        ],
      },
      {
        category: { emoji: "💳", label: "Plans", className: "text-emerald-700 bg-emerald-50" },
        title: "Starter and Growth plans",
        description:
          "Subscribe to unlock more projects and library storage. Upgrade, manage billing, and see your plan from Settings.",
        bullets: [
          "Monthly plans with a clear feature split",
          "Upload large files with progress shown",
          "Manage your subscription anytime",
        ],
      },
    ],
  },
  {
    date: "2026-04-28",
    dateLabel: "April 28, 2026",
    items: [
      {
        category: { emoji: "🔑", label: "Sign-in", className: "text-green-700 bg-green-50" },
        title: "Sign in with Google",
        description:
          "One tap with Google to get in — or create an account the same way. Email code sign-in still works if you prefer it.",
        bullets: [
          "Continue with Google on login and signup",
          "Profile photo from Google when available",
          "No password to remember",
        ],
      },
    ],
  },
  {
    date: "2026-04-25",
    dateLabel: "April 25, 2026",
    items: [
      {
        category: { emoji: "✅", label: "Approvals", className: "text-lime-700 bg-lime-50" },
        title: "Approve deliverables in the portal",
        description:
          "Request approval on a file. Clients approve or ask for changes — everyone sees the status in one place.",
        bullets: [
          "Clear status: pending, approved, or revision requested",
          "Discussion on every file in the library",
          "No more \"did they sign off?\" email threads",
        ],
      },
      {
        category: { emoji: "📊", label: "Activity", className: "text-blue-700 bg-blue-50" },
        title: "Project activity feed",
        description:
          "A running timeline of what happened on the project — uploads, comments, approvals, and payments.",
        bullets: [
          "Filter by files, comments, approvals, or payments",
          "See who did what and when",
          "Clients and freelancers share the same history",
        ],
      },
    ],
  },
  {
    date: "2026-03-30",
    dateLabel: "March 30, 2026",
    items: [
      {
        category: { emoji: "🎉", label: "Launch", className: "text-orange-700 bg-orange-50" },
        title: "Mably is live",
        description:
          "Early access opens for freelancers who want one branded link for files, feedback, and updates — instead of scattered messages.",
        bullets: [
          "Branded client project portals",
          "File library with discussions on each deliverable",
          "Invite clients by email — they get their own link",
        ],
      },
    ],
  },
];
