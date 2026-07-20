/** Content + assets for /for/agencies — swap image paths later as needed. */

export const FOR_AGENCIES = {
  slug: "agencies",
  audience: "Agencies",
  keyword: "client portal for agencies",
  meta: {
    title: "Client Portal for Agencies | Mably",
    description:
      "A simple client portal for agencies — branded workspaces for every engagement, with files, feedback, and approvals in one link clients remember. From $9/month.",
  },
  hero: {
    eyebrow: "For agencies",
    h1: "Client portal for agencies",
    subhead:
      "One branded experience per client engagement — so files, feedback, and approvals stop living across Slack, email, and Drive.",
    micro: "From $9/month · Cancel anytime · Built for multi-client delivery",
    gallery: [
      { src: "/images/landing/studio-owners.webp", alt: "Agency studio" },
      { src: "/images/landing/marketing.webp", alt: "Marketing agency" },
      { src: "/images/landing/creative-director.webp", alt: "Creative director" },
      { src: "/images/landing/web-developer.webp", alt: "Web team" },
      { src: "/images/landing/management-consultant.webp", alt: "Account lead" },
      { src: "/images/landing/ux-designer.webp", alt: "Designer" },
      { src: "/images/landing/copywriter.webp", alt: "Copywriter" },
      { src: "/images/landing/video-editor.webp", alt: "Video editor" },
      { src: "/images/landing/photographer.webp", alt: "Photographer" },
      { src: "/images/landing/architect.webp", alt: "Studio lead" },
    ],
  },
  problem: {
    eyebrow: "The agency delivery mess",
    headline: "Clients shouldn’t chase five channels for one project.",
    items: [
      {
        title: "Scattered client threads",
        caption:
          "Feedback lands in Slack, email, and WhatsApp at once. Account managers spend half the week hunting the decision that already happened.",
        image: "/images/for/For%20Agencies%20-%20scattered-client-threads.webp",
      },
      {
        title: "Folder sprawl per retainer",
        caption:
          "Every engagement gets another Drive folder. Clients open the wrong share and review last month’s assets as if they were live.",
        image: "/images/for/For%20Agencies%20-%20folder-sprawl-per-retainer.webp",
      },
      {
        title: "Approvals with no proof",
        caption:
          "Scope drifts after a vague “looks good.” Nobody can show who signed off on what — or when — when billing gets questioned.",
        image: "/images/for/For%20Agencies%20-%20approvals-with-no-proof.webp",
      },
    ],
  },
  solution: {
    headline: "A calmer client experience per engagement.",
    subhead:
      "Mably is a client experience tool that gives agencies a simple client portal — keep your PM tools, but give every client a calm, branded place for files, feedback, and approvals.",
    chips: [
      "Client workspaces",
      "Approvals",
      "File library",
      "Feedback",
      "Shared links",
      "Activity",
      "Branding",
      "Handoffs",
      "Sign-off",
    ],
  },
  stepsIntro:
    "Set up a branded client experience for each engagement, send one link, and keep delivery clear for clients and your team.",
  steps: [
    {
      title: "Create a client project.",
      copy: "Brand the workspace so every engagement feels like your agency — not a generic SaaS login.",
    },
    {
      title: "Send one link.",
      copy: "Clients open files, links, and updates without a walkthrough or another shared Drive invite.",
    },
    {
      title: "Share, review, approve.",
      copy: "Stack revisions, collect feedback, and lock sign-off with a clear record before the next phase.",
    },
  ],
  workflows: {
    eyebrow: "Built for agency delivery",
    headline: "Client workflows, without the chase.",
    items: [
      {
        title: "A space for every retainer",
        caption: "Each client gets one calm place — not another Slack channel.",
        image: "/images/for/workflow-files-poster-square.webp",
      },
      {
        title: "Approvals you can point to",
        caption: "Who signed off, on which file, and when — ready when scope drifts.",
        image: "/images/for/workflow-discussion-threads-approvals-poster-square.webp",
      },
      {
        title: "Links the team stops resending",
        caption: "Figma, Loom, staging, and decks live where clients already look.",
        image: "/images/for/workflow-links-poster-square-v2.webp",
      },
    ],
  },
  features: {
    eyebrow: "The client experience",
    headline: "What agency clients need to stay clear.",
    items: [
      {
        variant: "portrait",
        tag: "Branding",
        title: "White-label feel",
        caption: "Your agency look on every client workspace.",
        image: "/images/landing/Carousel-Your%20Studio%20Your%20Saas.webp",
      },
      {
        variant: "landscape",
        theme: "dark",
        tag: "File library",
        title: "Versioned deliverables.",
        caption: "Assets and exports with clear revision history.",
        image: "/images/for/Library.webp",
      },
      {
        variant: "portrait",
        tag: "Feedback",
        title: "Feedback on the work",
        caption: "Comments stay tied to the deliverable — not a buried thread.",
        image: "/images/landing/Carousel%20-%20Every%20Revision%20in%20one%20thread.webp",
      },
      {
        variant: "landscape",
        tag: "Activity",
        title: "Activity clients can follow.",
        caption: "Uploads, comments, and milestones in one timeline.",
        image: "/images/landing/Activity.webp",
      },
    ],
  },
  testimonial: {
    quote:
      "Having conversations, files, and links all in one place has made collaborating with my client much easier.",
    name: "Megan Chapman",
    role: "Savvy VA",
    website: "https://savvy-va.com/",
    avatar: "/images/landing/testimonial-megan.webp",
  },
  fit: {
    headline: "Is Mably right for you?",
    forTitle: "Right for agencies who",
    forItems: [
      "Run multiple client engagements at once",
      "Need clearer file delivery and approval loops",
      "Want a polished client experience without building software",
    ],
    notTitle: "Not a replacement for",
    notItems: [
      "Full project management or sprint boards",
      "Heavy agency CRM or proposal suites",
      "Internal-only collaboration tools",
    ],
  },
  faqHeadline: "Client portals for agencies — answered",
  faqs: [
    {
      q: "Is Mably a client portal for agencies?",
      a: "Yes. Mably is a client experience tool — and a simple client portal for agencies — branded workspaces for each engagement with files, feedback, approvals, and shared links. It’s the client-facing layer, not your full agency OS.",
    },
    {
      q: "Can we use Mably for multiple clients?",
      a: "Yes. Create a project per engagement. Growth unlocks unlimited projects so every retainer and campaign gets its own branded space.",
    },
    {
      q: "Does Mably replace ClickUp or Asana?",
      a: "No. Keep internal PM where your team works. Put the client-facing files, feedback, and sign-off in Mably so clients aren’t dropped into your board.",
    },
    {
      q: "Can clients approve deliverables?",
      a: "Yes. Request approval on a file and the status stays visible. You get a clear record of who approved what and when.",
    },
    {
      q: "Is this better than shared Drive folders?",
      a: "Drive stores files. Mably adds branding, feedback, approvals, and activity — so delivery feels intentional across every client.",
    },
    {
      q: "How does pricing work for agencies?",
      a: "Starter covers one active project. Growth is built for agencies juggling many clients — unlimited projects from $19/month (with early offer pricing when available).",
    },
  ],
  finalCta: {
    headline: "Give every client an experience worthy of your agency.",
    accent: "Start with one engagement.",
    image: "/images/landing/studio-owners.webp",
  },
  footerBlurb: "A calmer client experience for agencies.",
};
