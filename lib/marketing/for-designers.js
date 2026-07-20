/** Content + assets for /for/designers — swap image/video paths later as needed. */

export const FOR_DESIGNERS = {
  slug: "designers",
  audience: "Designers",
  keyword: "client portal for designers",
  meta: {
    title: "Client Portal for Designers | Mably",
    description:
      "A simple client portal for designers — share mockups, collect feedback, stack revisions, and get visual approvals in one branded link. From $9/month.",
  },
  hero: {
    eyebrow: "For designers",
    h1: "Client portal for designers",
    subhead:
      "Mockups, revisions, and sign-off in one branded place — so “which file is final?” stops being a Slack thread.",
    micro: "From $9/month · Cancel anytime · Built for visual delivery",
    gallery: [
      { src: "/images/landing/ux-designer.webp", alt: "UX designer" },
      { src: "/images/landing/creative-director.webp", alt: "Creative director" },
      { src: "/images/landing/architect.webp", alt: "Architect" },
      { src: "/images/landing/photographer.webp", alt: "Photographer" },
      { src: "/images/landing/studio-owners.webp", alt: "Studio owners" },
      { src: "/images/landing/video-editor.webp", alt: "Video editor" },
      { src: "/images/landing/marketing.webp", alt: "Marketing designer" },
      { src: "/images/landing/web-developer.webp", alt: "Web designer" },
      { src: "/images/landing/copywriter.webp", alt: "Copywriter" },
      { src: "/images/landing/management-consultant.webp", alt: "Consultant" },
    ],
  },
  problem: {
    eyebrow: "The design handoff mess",
    headline: "Feedback shouldn’t live in five apps.",
    items: [
      {
        title: "Scattered Figma links",
        caption:
          "You share a frame, the client bookmarks an old one, and feedback lands on last week's version. Nobody is ever sure which link is the latest.",
        image: "/images/for/For%20Designers%20-%20scattered-figma-links-transparent.webp",
      },
      {
        title: "Revision chaos",
        caption:
          "final_v7_REAL.pdf forever. Rounds of changes pile up across email, Drive, and chat until the approved version is anyone's guess.",
        image: "/images/for/For%20Designers%20-%20revision-chaos-transparent.webp",
      },
      {
        title: "Vague WhatsApp notes",
        caption:
          "\u201cMake it pop\u201d arrives with no file, no frame, and no context — so you spend the afternoon guessing what the client actually meant.",
        image: "/images/for/For%20Designers%20-%20vague-whatsapp-notes-transparent.webp",
      },
    ],
  },
  solution: {
    headline: "A calmer client experience for visual work.",
    subhead:
      "Mably is a client experience tool that gives designers a simple client portal — keep Figma and Drive, but give clients one calm place for files, feedback, and approvals.",
    chips: [
      "Mockups",
      "Revisions",
      "Feedback",
      "Approvals",
      "Figma links",
      "File previews",
      "Client CRM",
      "Activity",
      "Handoff",
    ],
  },
  stepsIntro:
    "Set up a branded client experience, send one link, and keep mockups, revisions, and visual approvals in one place clients understand.",
  steps: [
    {
      title: "Create a design project.",
      copy: "Add your logo, colours, and welcome note — client reviews feel like your studio, not a file dump.",
    },
    {
      title: "Send one link.",
      copy: "Clients open mockups, Figma links, and staging URLs without a walkthrough or a buried email thread.",
    },
    {
      title: "Share, revise, approve.",
      copy: "Stack every revision on the same deliverable and lock visual sign-off before you hand anything off.",
    },
  ],
  workflows: {
    eyebrow: "Built for design delivery",
    headline: "Design workflows, without the chase.",
    items: [
      {
        title: "Revisions on the deliverable",
        caption: "Every round stays stacked on the same file — not a new email.",
        image: "/images/for/workflow-revisions-poster-square-clean-v2.webp",
      },
      {
        title: "Approvals before build",
        caption: "Homepage mock signed off — proof when scope drifts.",
        image: "/images/for/workflow-discussion-threads-approvals-poster-square.webp",
      },
      {
        title: "Figma, Loom, staging — one hub",
        caption: "Share the links clients always ask you to resend.",
        image: "/images/for/workflow-links-poster-square-v2.webp",
      },
    ],
  },
  features: {
    eyebrow: "The client experience",
    headline: "What clients need to review your work.",
    items: [
      {
        variant: "portrait",
        tag: "Branding",
        title: "Branded review space",
        caption: "Your studio look — not a generic SaaS login.",
        image: "/images/landing/Carousel-Your%20Studio%20Your%20Saas.webp",
      },
      {
        variant: "landscape",
        theme: "dark",
        tag: "File library",
        title: "Versioned file library.",
        caption: "Mockups and exports with clear revision history.",
        image: "/images/for/Library.webp",
      },
      {
        variant: "portrait",
        tag: "Feedback",
        title: "Feedback on the file",
        caption: "Comments and change requests stay with the work.",
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
    forTitle: "Right for designers who",
    forItems: [
      "Ship brand, UI, or web design to clients",
      "Need clearer revision and approval loops",
      "Want a polished client experience without building software",
    ],
    notTitle: "Not a replacement for",
    notItems: [
      "Figma, Framer, or your design tools",
      "Internal design-ops or sprint boards",
      "Full agency CRM or proposal suites",
    ],
  },
  faqHeadline: "Client portals for designers — answered",
  faqs: [
    {
      q: "Is Mably a client portal for designers?",
      a: "Yes. Mably is a client experience tool — and a simple client portal for designers — one branded link for sharing mockups and exports, collecting feedback, stacking revisions, and getting approvals. Keep designing in Figma; Mably is the client-facing layer.",
    },
    {
      q: "How do designers use Mably with clients?",
      a: "Create a project for the engagement, add your branding, drop in files or Figma/Loom links, and invite the client. They review, comment, and approve without hunting through email.",
    },
    {
      q: "Can clients approve a specific mockup or revision?",
      a: "Yes. Request approval on a deliverable and the status stays visible. Mably records who approved what and when — useful before development or print.",
    },
    {
      q: "Does Mably replace Figma?",
      a: "No. Design in Figma (or wherever you work). Put the share link and exports in Mably so clients have one place for the latest work and decisions.",
    },
    {
      q: "What about brand designers vs UI designers?",
      a: "Both fit. Brand designers use it for identity rounds and lockups; UI/web designers use it for mockups, prototypes links, and pre-build sign-off.",
    },
    {
      q: "Is this better than sending Drive folders?",
      a: "Drive stores files. Mably adds a branded client experience with feedback, approvals, and activity — so delivery feels intentional, not like another shared folder.",
    },
  ],
  finalCta: {
    headline: "Give every client an experience worthy of your design.",
    accent: "Start with one project.",
    image: "/images/landing/ux-designer.webp",
  },
  footerBlurb: "A calmer client experience for designers.",
};
