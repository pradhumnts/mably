"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import { SplitText } from "gsap/SplitText";
import { Button } from "@/components/ui/button";
import { LEGAL_LINKS } from "@/lib/constants/legal-links";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Eye,
  FolderOpen,
  Layers,
  Link2,
  MessageSquare,
  Minus,
  Palette,
  FileCheck,
  Play,
  Plus,
  Shield,
  Sparkles,
  Users,
  X,
  Zap,
  Star,
  MapPin,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LANDING_FAQ } from "@/lib/marketing/landing-faq";
import { appPath } from "@/lib/site-urls";
import {
  EARLY_OFFER_COPY,
  EARLY_OFFER_DISCOUNT_PERCENT,
  EARLY_OFFER_FOUNDING_CUSTOMER_LIMIT,
  EARLY_OFFER_PLANS,
  earlyOfferPrice,
} from "@/lib/billing/early-offer";

const APP_SIGN_IN = appPath("/");
const APP_SIGN_UP = appPath("/?intent=signup");
const APP_DEMO = appPath("/?next=%2Fproject%2Fdemo-mably");

/* ----------------------------------------------------------------------------
 * ASSETS — swap paths for your own files in /public
 * -------------------------------------------------------------------------- */
const LANDING = {
  heroBg: "/images/landing/hero-bg.webp",
  heroVideoThumbnail: "/images/landing/hero-video-thumbnail.webp",
  heroVideo: "/images/landing/women-working.webm",
  bgVideo: "/images/landing/bg-video.mp4",
  testimonials: "/images/landing/testimonials.webp",
  testimonialMegan: "/images/landing/testimonial-megan.webp",
  finalCta: "/images/landing/testimonials.webp",
  everyRevision: "/images/landing/Carousel%20-%20Every%20Revision%20in%20one%20thread.webp",
  signOff: "/images/landing/Carousel-Sign%20Off%20Without%20chase.webp",
  yourStudio: "/images/landing/Carousel-Your%20Studio%20Your%20Saas.webp",
  popupBranding: "/images/landing/popup-branding.webp",
  popupInvoices: "/images/landing/popup-invoices.webp",
  popupLibrary: "/images/landing/popup-library.webp",
  popupActivity: "/images/landing/popup-activity.webp",
  popupApprovals: "/images/landing/popup-approvals.webp",
  popupLinks: "/images/landing/popup-links.webp",
  showcase: {
    branding: "/images/landing/branding.webp",
    library: "/images/landing/Library.webp",
    activity: "/images/landing/Activity.webp",
    invoices: "/images/landing/Invoices.webp",
    links: "/images/landing/Links.webp",
  },
  roles: {
    webDeveloper: "/images/landing/web-developer.webp",
    studioOwners: "/images/landing/studio-owners.webp",
    architect: "/images/landing/architect.webp",
    creativeDirector: "/images/landing/creative-director.webp",
    copywriter: "/images/landing/copywriter.webp",
    managementConsultant: "/images/landing/management-consultant.webp",
    photographer: "/images/landing/photographer.webp",
    videoEditor: "/images/landing/video-editor.webp",
    uxDesigner: "/images/landing/ux-designer.webp",
    marketing: "/images/landing/marketing.webp",
  },
};

const NAV_MAX_WIDTH_REM = 72;
const NAV_SCROLL_RANGE_PX = 120;
const NAV_WIDTH_SHRINK = 0.2;
const OFFER_BANNER_HOW_OFFSET_PX = 100;

const ASSETS = {
  heroVideo: "/videos/hero.mp4",
  heroPoster: LANDING.heroVideoThumbnail,
  storyVideo: "/videos/freelancer-story.mp4",
  storyPoster: LANDING.heroBg,
  screenshots: {
    library: "/images/library-screen.png",
    activity: "/images/activity-screen.png",
    payments: "/images/payments-screen.png",
    chat: "/images/chat-screen.png",
  },
  avatars: [
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80",
    "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&q=80",
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80",
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80",
    "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80",
  ],
};

const FREELANCER_CAROUSEL_SLIDES = [
  {
    role: "Designers",
    image: LANDING.roles.uxDesigner,
    widget: {
      type: "client",
      label: "Designer",
      name: "Maya Chen",
      avatar: ASSETS.avatars[0],
      rating: "5.0",
      subtitle: "Brand designer",
    },
  },
  {
    role: "Developers",
    image: LANDING.roles.webDeveloper,
    widget: {
      type: "features",
      items: [
        {
          title: "File library",
          description: "Stop resending the same links and versions",
          icon: FolderOpen,
        },
        {
          title: "Project chat",
          description: "Keep feedback off email and WhatsApp",
          icon: MessageSquare,
        },
      ],
    },
  },
  {
    role: "Consultants",
    image: LANDING.roles.managementConsultant,
    widget: {
      type: "project",
      rows: [
        {
          icon: MapPin,
          title: "Northwind Co.",
          subtitle: "Strategy engagement",
        },
        {
          icon: Calendar,
          title: "Thursday, 12 Apr",
          subtitle: "Deck review milestone",
        },
      ],
    },
  },
  {
    role: "Studio owners",
    image: LANDING.roles.studioOwners,
    widget: {
      type: "testimonial",
      quote:
        "Clients stopped asking where things were. Approvals are logged, feedback stays on the file, and I spend less unpaid time chasing updates.",
      name: "James Whitfield",
      avatar: ASSETS.avatars[3],
      rating: "5.0",
      subtitle: "Studio owner",
    },
  },
];

const FREELANCER_ROLE_ROWS = [
  [
    { label: "Brand designers", image: LANDING.roles.marketing },
    { label: "Web developers", image: LANDING.roles.webDeveloper },
    { label: "Photographers", image: LANDING.roles.photographer },
    { label: "UX designers", image: LANDING.roles.uxDesigner },
    { label: "Copywriters", image: LANDING.roles.copywriter },
    { label: "Illustrators", image: LANDING.roles.uxDesigner },
    { label: "Video editors", image: LANDING.roles.videoEditor },
    { label: "Marketing consultants", image: LANDING.roles.marketing },
  ],
  [
    { label: "Management consultants", image: LANDING.roles.managementConsultant },
    { label: "Studio owners", image: LANDING.roles.studioOwners },
    { label: "Motion designers", image: LANDING.roles.videoEditor },
    { label: "Social strategists", image: LANDING.roles.marketing },
    { label: "Architects", image: LANDING.roles.architect },
    { label: "Producers", image: LANDING.roles.creativeDirector },
    { label: "Freelance PMs", image: LANDING.roles.managementConsultant },
    { label: "Creative directors", image: LANDING.roles.creativeDirector },
  ],
];

const GALLERY = [
  {
    badge: "Branding",
    title: "Look more organized",
    emphasis: "from day one",
    image: LANDING.yourStudio,
    popupImage: LANDING.popupBranding,
    headline: "A premium client experience — without building a custom system.",
    intro: [
      "When clients hire you, they get a private project workspace with custom logo, colours, and welcome message.",
    ],
    details: [
      {
        icon: Palette,
        title: "Per-project branding",
        description: "Each client relationship feels intentional — not like another SaaS login.",
      },
      {
        icon: Sparkles,
        title: "Custom welcome message",
        description: "Set expectations from the first click — clear, calm, professional.",
      },
      {
        icon: Shield,
        title: "Custom domain",
        description: "On Growth, serve the workspace from your own domain.",
      },
      {
        icon: Users,
        title: "Part of how you sell",
        description: "Clients see a polished process before the work even starts.",
      },
    ],
  },
  {
    badge: "Library",
    title: "Files in one place",
    emphasis: "not five apps",
    image: LANDING.everyRevision,
    popupImage: LANDING.popupLibrary,
    headline: "Stop hunting through email, Drive, and WhatsApp for the latest file.",
    intro: [
      "Upload deliverables where your client already expects them — with revisions stacked on the same item.",
      "Feedback stays on the file, not buried in a thread from last Tuesday.",
    ],
    details: [
      {
        icon: Layers,
        title: "Stacked revisions",
        description: "New versions stay on the same file — no more \"which one is final?\"",
      },
      {
        icon: MessageSquare,
        title: "Feedback on the deliverable",
        description: "Comments and voice notes stay tied to the work they refer to.",
      },
      {
        icon: Eye,
        title: "One link to remember",
        description: "Clients know exactly where to find what you sent — every time.",
      },
      {
        icon: Shield,
        title: "Project-scoped access",
        description: "Only people invited to the project can view or comment.",
      },
    ],
  },
  {
    badge: "Approvals",
    title: "Proof of sign-off",
    emphasis: "when it counts",
    image: LANDING.signOff,
    popupImage: LANDING.popupApprovals,
    headline: "Keep approvals clear before they become expensive confusion.",
    intro: [
      "Request a formal OK on a deliverable. Status stays visible — and Mably records who approved what and when.",
    ],
    details: [
      {
        icon: Check,
        title: "One-click approval",
        description: "Clients approve or request changes without leaving the workspace.",
      },
      {
        icon: Zap,
        title: "Always-visible status",
        description: "Pending, approved, and revision-requested — no guessing.",
      },
      {
        icon: MessageSquare,
        title: "Revision notes in context",
        description: "Change requests land on the file, not in a separate email chain.",
      },
      {
        icon: Shield,
        title: "Recorded decisions",
        description: "\"Client approved homepage design on June 26\" — proof when you need it.",
      },
    ],
  },
  {
    badge: "Activity",
    title: "Clients always know",
    emphasis: "what changed",
    image:
      "https://images.unsplash.com/photo-1543269664-56d93c1b41a6?w=900&q=80",
    popupImage: LANDING.popupActivity,
    headline: "A clear project activity — so nobody says \"I didn't see the update.\"",
    intro: [
      "Uploads, comments, approvals, and milestones show up in one feed per project.",
    ],
    details: [
      {
        icon: Zap,
        title: "One timeline per project",
        description: "Everything important in order — no digging through inboxes.",
      },
      {
        icon: Eye,
        title: "Shared source of truth",
        description: "You and your client see the same project story.",
      },
      {
        icon: Users,
        title: "Faster catch-up",
        description: "Open Monday morning and know where every project stands.",
      },
      {
        icon: Sparkles,
        title: "Less manual chasing",
        description: "Fewer \"just checking in\" messages from either side.",
      },
    ],
  },
  {
    badge: "Payments",
    title: "Invoices beside",
    emphasis: "the work",
    image:
      "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=900&q=80",
    popupImage: LANDING.popupInvoices,
    headline: "Connect billing to the project — not a separate chase.",
    intro: [
      "Send invoices in the same workspace your client uses for deliverables and approvals.",
    ],
    details: [
      {
        icon: CreditCard,
        title: "Invoices in context",
        description: "Payment status lives next to the project — not lost in email.",
      },
      {
        icon: Eye,
        title: "Clear what's due",
        description: "Clients always know what's sent, due, or paid.",
      },
      {
        icon: Zap,
        title: "Fewer payment chases",
        description: "Less awkward end-of-month back-and-forth.",
      },
      {
        icon: Shield,
        title: "Professional handoff",
        description: "Delivery and billing feel like one considered experience.",
      },
    ],
  },
  {
    badge: "Links",
    title: "Figma, Drive, Loom",
    emphasis: "in one list",
    image: LANDING.roles.webDeveloper,
    popupImage: LANDING.popupLinks,
    headline: "Stop resending the same URLs in every email.",
    intro: [
      "Drop Figma files, Google Docs, staging sites, and reference links in one hub — so clients always know where to click.",
    ],
    details: [
      {
        icon: Link2,
        title: "One link hub",
        description: "Every external resource for the project, organized in one place.",
      },
      {
        icon: Eye,
        title: "No more \"send that again\"",
        description: "Clients bookmark one workspace instead of hunting through threads.",
      },
      {
        icon: FolderOpen,
        title: "Works with your stack",
        description: "Keep using Figma, Drive, and Loom — Mably is the front layer clients see.",
      },
      {
        icon: Zap,
        title: "Faster handoffs",
        description: "Share new links once; everyone on the project can find them.",
      },
    ],
  },
];

const OVERLAY_STATS = [
  { value: "1", label: "link clients remember", icon: FolderOpen },
  { value: "✓", label: "approvals on record", icon: FileCheck },
  { value: "0", label: "scattered threads", icon: MessageSquare },
  { value: "$9", label: "to get started", icon: CreditCard },
];

/** Swap `image` paths to replace showcase screenshots. */
const HORIZONTAL_SHOWCASE = {
  eyebrow: "Client workspace",
  headline: "Give every client a workspace that matches the quality of your work.",
  subheadline:
    "One simple link where clients see what changed, what needs review, and where everything lives — without email, WhatsApp, or folder hunts.",
  slides: [
    {
      image: LANDING.showcase.branding,
      imageAlt: "Branded client workspace",
      title: "Branding",
      description:
        "Custom logo and welcome message on every project — clients see a premium process, not a generic tool.",
    },
    {
      image: LANDING.showcase.library,
      imageAlt: "Project file library with revisions",
      title: "Library",
      description:
        "Deliverables and revisions in one place — feedback stays on the file, not lost in email.",
    },
    {
      image: LANDING.showcase.activity,
      imageAlt: "Project activity timeline",
      title: "Activity",
      description:
        "A clear timeline of uploads, comments, and milestones — so clients always know what changed.",
    },
    {
      image: LANDING.showcase.invoices,
      imageAlt: "Invoices beside project work",
      title: "Payments",
      description:
        "Invoice status beside the deliverables they cover — fewer payment chases.",
    },
    {
      image: LANDING.showcase.links,
      imageAlt: "Shared project links hub",
      title: "Links",
      description:
        "Figma, Drive, Loom, staging — one hub so clients stop asking for the same URLs.",
    },
  ],
};

const HOW_IT_WORKS = [
  {
    step: "1",
    title: "Create a project.",
    copy: "Add your branding and welcome message — a client-ready workspace in minutes.",
    icon: Palette,
    iconClass: "bg-rose-400",
    preview: "branding",
  },
  {
    step: "2",
    title: "Send one link.",
    copy: "No walkthrough, no \"check your email,\" no explaining which folder is which.",
    icon: Link2,
    iconClass: "bg-blue-500",
    preview: "invite",
  },
  {
    step: "3",
    title: "Share, review, approve.",
    copy: "Deliver files, collect feedback, and get sign-off with a clear record of what was approved.",
    icon: FileCheck,
    iconClass: "bg-orange-500",
    preview: "library",
  },
];

/** @param {{ type: string }} props */
function HowItWorksPreview({ type }) {
  if (type === "branding") {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 text-xs font-bold text-orange-600">
            AC
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-zinc-800">Acme Brand Workspace</p>
            <p className="text-[10px] text-zinc-400">Project name</p>
          </div>
        </div>
        <div className="flex gap-2">
          {["#f97316", "#18181b", "#3b82f6"].map((color) => (
            <span
              key={color}
              className="h-6 w-6 rounded-full ring-2 ring-white"
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
        <div className="rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2 text-xs text-zinc-400">
          Welcome to your project workspace…
        </div>
      </div>
    );
  }

  if (type === "invite") {
    return (
      <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-3">
        <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-400">
          Client invite link
        </p>
        <p className="mt-1 truncate text-xs font-medium text-zinc-700">
          mably.app/project/acme-brand
        </p>
        <div className="mt-3 flex justify-end">
          <span className="rounded-lg bg-zinc-900 px-3 py-1.5 text-[10px] font-medium text-white">
            Copy link
          </span>
        </div>
      </div>
    );
  }

  if (type === "library") {
    return (
      <div className="space-y-2">
        {[
          { name: "Brand guidelines.pdf", status: "Approved", statusClass: "bg-emerald-100 text-emerald-700" },
          { name: "Homepage mockup.png", status: "Pending", statusClass: "bg-amber-100 text-amber-700" },
        ].map((file) => (
          <div
            key={file.name}
            className="flex items-center justify-between gap-2 rounded-lg bg-zinc-50 px-3 py-2"
          >
            <span className="truncate text-xs font-medium text-zinc-700">{file.name}</span>
            <span
              className={cn(
                "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium",
                file.statusClass
              )}
            >
              {file.status}
            </span>
          </div>
        ))}
        <div className="flex items-center gap-2 rounded-lg border border-dashed border-zinc-200 px-3 py-2 text-[10px] text-zinc-400">
          <MessageSquare className="h-3.5 w-3.5" />
          3 comments on latest revision
        </div>
      </div>
    );
  }

  return null;
}

const TESTIMONIAL = {
  quote:
    "Having conversations, files, and links all in one place has made collaborating with my client much easier.",
  name: "Megan Chapman",
  role: "Savvy VA",
  avatar: LANDING.testimonialMegan,
  image: LANDING.testimonials,
};

const PRICING = [
  {
    name: "Starter",
    description:
      "One active client project with a branded workspace — the one link your client actually remembers.",
    price: "$9",
    period: "/ month",
    note: "Cancel anytime",
    features: [
      "1 active project",
      "Branded client workspace",
      "Files, links & approvals",
      "Activity timeline & project chat",
      "Per-file feedback & revisions",
      "1 GB storage (10 MB per file)",
      "Client CRM",
    ],
    highlight: false,
    cta: "Get started",
  },
  {
    name: "Growth",
    description:
      "For freelancers juggling multiple clients — one clear home for every project, review, and approval.",
    price: "$19",
    period: "/ month",
    note: "Cancel anytime",
    badge: "Most popular",
    savingsBadge: "Best value",
    features: [
      "Everything in Starter",
      "Unlimited projects",
      "25 GB storage (no per-file cap)",
      "Custom domain",
      "Hide \"Powered by\" badge",
      "Priority support",
    ],
    highlight: true,
    cta: "Get started",
  },
];

function FaqAccordionItem({ item, open, onToggle }) {
  return (
    <div className="rounded-2xl bg-white px-5 sm:px-6">
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          "flex w-full items-center justify-between gap-4 text-left",
          open ? "pt-5 sm:pt-6" : "py-5 sm:py-6"
        )}
        aria-expanded={open}
      >
        <span className="text-base font-semibold leading-snug text-zinc-900 sm:text-[1.05rem]">
          {item.q}
        </span>
        <span
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-white transition-transform duration-200",
            open && "rotate-0"
          )}
          aria-hidden
        >
          {open ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
        </span>
      </button>
      <div
        className={cn(
          "grid transition-[grid-template-rows,opacity] duration-300 ease-out",
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        )}
      >
        <div className="min-h-0 overflow-hidden">
          <p className="pb-5 pt-4 text-sm leading-relaxed text-zinc-500 sm:pb-6 sm:text-[15px]">
            {item.a}
          </p>
        </div>
      </div>
    </div>
  );
}

function LandingFaqSection() {
  const [openKeys, setOpenKeys] = useState(() => new Set());

  const toggle = (key) => {
    setOpenKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const leftColumn = LANDING_FAQ.slice(0, 3);
  const rightColumn = LANDING_FAQ.slice(3);

  return (
    <section id="faq" className="scroll-mt-24 bg-zinc-100 px-4 py-24 sm:px-5 sm:py-32">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-2xl text-center">
          <p data-reveal className="text-sm font-medium text-zinc-500">
            FAQs
          </p>
          <h2
            data-split
            className="mt-3 text-balance text-3xl font-semibold tracking-[-0.03em] text-zinc-900 sm:text-4xl lg:text-[2.75rem]"
          >
            Your Questions, Answered
          </h2>
          <p data-reveal className="mt-4 text-base text-zinc-500 sm:text-lg">
            Common questions about client workspaces, approvals, pricing, and how Mably
            keeps freelance projects clear.
          </p>
        </div>

        <div
          data-reveal-group
          className="mt-14 grid gap-4 sm:mt-16 lg:grid-cols-2 lg:gap-5"
        >
          <div className="space-y-4 lg:space-y-5">
            {leftColumn.map((item) => (
              <div key={item.q} data-reveal-item>
                <FaqAccordionItem
                  item={item}
                  open={openKeys.has(item.q)}
                  onToggle={() => toggle(item.q)}
                />
              </div>
            ))}
          </div>
          <div className="space-y-4 lg:space-y-5">
            {rightColumn.map((item) => (
              <div key={item.q} data-reveal-item>
                <FaqAccordionItem
                  item={item}
                  open={openKeys.has(item.q)}
                  onToggle={() => toggle(item.q)}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function buildGallerySnapPositions(el, cards) {
  const gap = 16;
  const maxScroll = Math.max(0, el.scrollWidth - el.clientWidth);
  let offset = 0;
  const positions = cards.map((card, index) => {
    if (index === cards.length - 1) return maxScroll;
    const pos = offset;
    offset += card.offsetWidth + gap;
    return pos;
  });
  return { positions, maxScroll };
}

/** Meaningful stops — skips card indices that would only nudge the scroll a little. */
function buildGalleryStepIndices(positions, maxScroll, minStep) {
  const lastCardIndex = positions.length - 1;
  if (lastCardIndex <= 0) return [0];

  const mergeThreshold = minStep * 0.85;
  const indices = [0];

  for (let i = 1; i < positions.length; i++) {
    const isLast = i === lastCardIndex;
    const prevCardIndex = indices[indices.length - 1];

    if (isLast) {
      if (maxScroll - positions[prevCardIndex] < mergeThreshold) {
        indices[indices.length - 1] = i;
      } else {
        indices.push(i);
      }
      continue;
    }

    if (positions[i] - positions[prevCardIndex] >= mergeThreshold) {
      indices.push(i);
    }
  }

  if (indices[indices.length - 1] !== lastCardIndex) {
    const prevCardIndex = indices[indices.length - 1];
    if (maxScroll - positions[prevCardIndex] < mergeThreshold) {
      indices[indices.length - 1] = lastCardIndex;
    } else {
      indices.push(lastCardIndex);
    }
  }

  return indices;
}

function findClosestStepIndex(scrollLeft, positions, stepIndices, maxScroll) {
  if (scrollLeft <= 8) return 0;
  if (scrollLeft >= maxScroll - 8) return stepIndices.length - 1;

  let best = 0;
  let bestDistance = Infinity;
  for (let step = 0; step < stepIndices.length; step++) {
    const cardIndex = stepIndices[step];
    const distance = Math.abs(positions[cardIndex] - scrollLeft);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = step;
    }
  }
  return best;
}

function ShowcaseDeviceFrame({ src, alt, className }) {
  return (
    <div className={cn("relative w-full", className)}>
      <div
        className="pointer-events-none absolute -inset-3 rounded-[1.65rem] bg-gradient-to-b from-white/70 via-white/20 to-black/[0.04] opacity-90 blur-xl"
        aria-hidden
      />
      <div className="relative flex h-full flex-col rounded-[1.35rem] border border-white/50 bg-white/25 p-1 backdrop-blur-xl ring-1 ring-black/[0.06] sm:rounded-[1.5rem] sm:p-1.5">
        <div className="min-h-0 flex-1 overflow-hidden rounded-[1.1rem] border border-black/[0.08] bg-zinc-100 sm:rounded-[1.25rem]">
          <img
            src={src}
            alt={alt}
            className="h-full w-full object-cover object-top"
            draggable={false}
          />
        </div>
        <div
          className="pointer-events-none absolute inset-0 rounded-[1.35rem] ring-1 ring-inset ring-white/35 sm:rounded-[1.5rem]"
          aria-hidden
        />
      </div>
    </div>
  );
}

function HorizontalScrollShowcase() {
  return (
    <>
      <section
        data-hscroll-section
        className="relative hidden motion-safe:md:block"
        aria-label="Product showcase"
      >
        {/* Scrolls away before horizontal pin begins */}
        <div
          data-hscroll-intro
          className="mx-auto w-full max-w-7xl px-4 pt-28 pb-2 sm:px-5 sm:pt-32 sm:pb-4"
        >
          <p className="text-sm font-medium text-zinc-500">{HORIZONTAL_SHOWCASE.eyebrow}</p>
          <h2 className="mt-3 max-w-3xl text-pretty text-3xl font-semibold tracking-[-0.03em] text-zinc-900 sm:text-4xl lg:text-[2.65rem] lg:leading-[1.12]">
            {HORIZONTAL_SHOWCASE.headline}
          </h2>
          <p className="mt-4 max-w-2xl text-pretty text-base leading-relaxed text-zinc-500 sm:mt-5 sm:text-lg">
            {HORIZONTAL_SHOWCASE.subheadline}
          </p>
        </div>

        <div data-hscroll-pin>
          <div
            data-hscroll-panel
            className="flex h-svh min-h-[36rem] flex-col overflow-hidden"
          >
            <div className="relative flex min-h-0 flex-1 items-center overflow-hidden pb-6 pt-6 sm:pt-8">
              <div
                data-hscroll-track
                className="flex w-max items-start gap-6 sm:gap-8"
                style={{
                  paddingLeft: "max(1rem, calc((100vw - 80rem) / 2 + 1rem))",
                  paddingRight: "max(1rem, calc((100vw - 80rem) / 2 + 1rem))",
                }}
              >
                {HORIZONTAL_SHOWCASE.slides.map((slide, index) => (
                  <article
                    key={slide.title}
                    data-hscroll-slide
                    data-active={index === 0 ? "true" : "false"}
                    className="flex w-[min(88vw,60rem)] shrink-0 flex-col gap-4 opacity-30 transition-opacity duration-500 ease-out data-[active=true]:opacity-100 sm:gap-5"
                  >
                    <ShowcaseDeviceFrame
                      src={slide.image}
                      alt={slide.imageAlt}
                      className="h-[min(90svh,26rem)] shrink-0 sm:h-[min(90svh,32rem)]"
                    />
                    <div className="grid gap-3 sm:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] sm:gap-6 sm:pr-1">
                      <h3 className="text-lg font-semibold tracking-tight text-zinc-900 sm:text-xl">
                        {slide.title}
                      </h3>
                      <p className="text-sm leading-relaxed text-zinc-500 sm:text-[0.9375rem]">
                        {slide.description}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
            <div className="flex shrink-0 justify-center pb-8 pt-3 sm:pb-10 sm:pt-4">
              <div
                className="relative h-0.5 w-36 overflow-hidden bg-zinc-200 sm:w-44"
                role="progressbar"
                aria-hidden
              >
                <div
                  data-hscroll-progress
                  className="absolute inset-y-0 left-0 w-0 bg-zinc-900"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        className="block bg-[#f5f2ed] px-4 py-20 motion-safe:md:hidden sm:px-5 sm:py-28"
        aria-label="Product showcase"
      >
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-medium text-zinc-500">{HORIZONTAL_SHOWCASE.eyebrow}</p>
          <h2 className="mt-3 max-w-3xl text-balance text-3xl font-semibold tracking-[-0.03em] text-zinc-900 sm:text-4xl">
            {HORIZONTAL_SHOWCASE.headline}
          </h2>
          <p className="mt-4 max-w-2xl text-pretty text-base leading-relaxed text-zinc-500 sm:text-lg">
            {HORIZONTAL_SHOWCASE.subheadline}
          </p>

          <div className="mt-12 flex flex-col gap-14 sm:gap-16">
            {HORIZONTAL_SHOWCASE.slides.map((slide) => (
              <article key={slide.title} className="flex flex-col gap-5 sm:gap-6">
                <ShowcaseDeviceFrame
                  src={slide.image}
                  alt={slide.imageAlt}
                  className="aspect-[16/10]"
                />
                <div className="grid gap-3 sm:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] sm:gap-8">
                  <h3 className="text-xl font-semibold tracking-tight text-zinc-900 sm:text-2xl">
                    {slide.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-zinc-500 sm:text-base">
                    {slide.description}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

function DemoLink({ className, children = "Explore the demo workspace" }) {
  return (
    <Link
      href={APP_DEMO}
      className={cn(
        "inline-flex items-center gap-1 text-sm font-medium text-zinc-500 transition hover:text-zinc-900",
        className
      )}
    >
      {children}
      <ArrowRight className="h-3.5 w-3.5" />
    </Link>
  );
}

/** @param {{ item: (typeof GALLERY)[number] | null; open: boolean; onOpenChange: (open: boolean) => void }} props */
function GalleryFeatureDialog({ item, open, onOpenChange }) {
  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="max-h-[min(92vh,820px)] max-w-[calc(100%-2rem)] gap-0 overflow-y-auto overflow-x-hidden rounded-2xl p-0 sm:max-w-[42rem]"
      >
        <div className="relative shrink-0 bg-zinc-100">
          <img
            src={item.popupImage}
            alt=""
            className="aspect-[9/4] w-full object-cover object-top"
            draggable={false}
          />
          <DialogClose asChild>
            <button
              type="button"
              className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm transition hover:bg-black/60"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </DialogClose>
        </div>

        <div className="space-y-5 p-10 sm:p-20">
          <DialogTitle className="text-xl font-semibold leading-snug tracking-[-0.02em] text-zinc-900 sm:text-2xl">
            {item.headline}
          </DialogTitle>

          <div className="space-y-3 text-[15px] leading-relaxed text-zinc-600">
            {item.intro.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>

          <ul className="space-y-5 pt-1">
            {item.details.map((detail) => {
              const Icon = detail.icon;
              return (
                <li key={detail.title} className="flex gap-3.5 items-center">
                  <Icon className="h-4 w-4" strokeWidth={1.75} />
                    <p className="text-sm font-semibold text-zinc-900">{detail.title}</p>
                </li>
              );
            })}
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function FreelancerCarouselWidget({ widget }) {
  const cardClass =
    "rounded-2xl bg-white shadow-[0_20px_50px_-15px_rgba(0,0,0,0.22)] ring-1 ring-black/[0.04]";

  if (widget.type === "client") {
    return (
      <div className={cn(cardClass, "w-[240px] max-w-[78vw] p-4")}>
        <p className="text-xs font-medium text-zinc-400">{widget.label}</p>
        <div className="mt-2.5 flex items-center gap-3">
          <img
            src={widget.avatar}
            alt=""
            className="h-11 w-11 shrink-0 rounded-xl object-cover"
            draggable={false}
          />
          <div className="min-w-0">
            <p className="truncate font-semibold text-zinc-900">{widget.name}</p>
            <p className="mt-0.5 text-xs text-zinc-500">
              {widget.rating} ★ · {widget.subtitle}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (widget.type === "features") {
    return (
      <div className="flex w-[260px] max-w-[78vw] flex-col gap-2">
        {widget.items.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.title} className={cn(cardClass, "flex items-center gap-3 p-3.5")}>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-zinc-900">{item.title}</p>
                <p className="mt-0.5 text-xs leading-snug text-zinc-500">{item.description}</p>
              </div>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-600">
                <Icon className="h-4 w-4" strokeWidth={1.75} />
              </span>
            </div>
          );
        })}
      </div>
    );
  }

  if (widget.type === "project") {
    return (
      <div className={cn(cardClass, "w-[260px] max-w-[78vw] overflow-hidden")}>
        {widget.rows.map((row, index) => {
          const Icon = row.icon;
          return (
            <div
              key={row.title}
              className={cn(
                "flex items-center gap-3 px-4 py-3.5",
                index > 0 && "border-t border-zinc-100"
              )}
            >
              <Icon className="h-4 w-4 shrink-0 text-zinc-400" strokeWidth={1.75} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-zinc-900">{row.title}</p>
                <p className="mt-0.5 text-xs text-zinc-500">{row.subtitle}</p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-zinc-300" />
            </div>
          );
        })}
      </div>
    );
  }

  if (widget.type === "testimonial") {
    return (
      <div className={cn(cardClass, "w-[280px] max-w-[78vw] p-4")}>
        <div className="flex gap-0.5">
          {Array.from({ length: 5 }).map((_, index) => (
            <Star
              key={index}
              className={cn(
                "h-3.5 w-3.5",
                index < 4 ? "fill-zinc-900 text-zinc-900" : "text-zinc-300"
              )}
              strokeWidth={1.5}
            />
          ))}
        </div>
        <p className="mt-2.5 text-sm leading-snug text-zinc-700">&ldquo;{widget.quote}&rdquo;</p>
        <div className="mt-3 flex items-center gap-2.5 border-t border-zinc-100 pt-3">
          <img
            src={widget.avatar}
            alt=""
            className="h-8 w-8 rounded-full object-cover"
            draggable={false}
          />
          <div>
            <p className="text-sm font-semibold text-zinc-900">{widget.name}</p>
            <p className="text-xs text-zinc-500">
              {widget.rating} ★ · {widget.subtitle}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

function FreelancerCarouselSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const slideCount = FREELANCER_CAROUSEL_SLIDES.length;
  const activeSlide = FREELANCER_CAROUSEL_SLIDES[activeIndex];

  useEffect(() => {
    if (isPaused) return undefined;

    const intervalId = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % slideCount);
    }, 5500);

    return () => window.clearInterval(intervalId);
  }, [isPaused, slideCount]);

  return (
    <section id="who" className="scroll-mt-24 bg-white px-4 py-24 sm:px-5 sm:py-32">
      <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div className="flex flex-col">
          <span
            data-reveal
            className="inline-flex w-fit items-center rounded-full border border-zinc-200 bg-zinc-50 px-3.5 py-1.5 text-xs font-medium text-zinc-600"
          >
            Built for freelancers
          </span>

          <h2
            data-split
            className="mt-6 text-balance text-4xl font-semibold leading-[1.1] tracking-[-0.03em] text-zinc-900 sm:text-5xl"
          >
            One link.{" "}
            <span className="font-serif font-normal italic">Clear projects.</span>{" "}
            <span className="font-serif font-normal italic">Fewer chases.</span>
          </h2>

          <p data-reveal className="mt-5 max-w-md text-base leading-relaxed text-zinc-500 sm:text-lg">
            Mably is the client-facing layer for freelance projects — updates, files,
            feedback, and approvals in one simple workspace, so projects keep moving.
          </p>

          <div
            data-reveal
            className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center"
          >
            <Button
              size="lg"
              asChild
              className="group h-12 rounded-full bg-orange-500 px-8 text-base font-semibold text-white shadow-[0_8px_30px_-6px_rgba(249,115,22,0.55)] hover:bg-orange-600"
            >
              <Link href={APP_SIGN_UP}>
                Get started
                <ArrowRight className="ml-1.5 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="h-12 rounded-full border-zinc-300 px-8 text-base text-zinc-900 hover:bg-zinc-50"
            >
              <Link href={APP_DEMO}>Explore the demo workspace</Link>
            </Button>
          </div>
        </div>

        <div
          data-reveal
          className="flex w-full flex-col overflow-visible lg:max-w-xl lg:justify-self-end"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onFocus={() => setIsPaused(true)}
          onBlur={() => setIsPaused(false)}
        >
          <div className="relative w-full overflow-visible pb-7 pl-7 sm:pb-9 sm:pl-9">
            <div className="relative aspect-square w-full">
              <div className="absolute inset-0 overflow-hidden rounded-[2rem] bg-zinc-100 shadow-[0_40px_80px_-28px_rgba(0,0,0,0.2),0_24px_48px_-24px_rgba(0,0,0,0.12)]">
                {FREELANCER_CAROUSEL_SLIDES.map((slide, index) => (
                  <img
                    key={slide.role}
                    src={slide.image}
                    alt=""
                    className={cn(
                      "absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ease-in-out",
                      index === activeIndex ? "opacity-100" : "opacity-0"
                    )}
                    draggable={false}
                  />
                ))}
              </div>

              <div
                key={activeSlide.role}
                className="absolute bottom-5 left-5 z-10 -translate-x-[22%] translate-y-[14%] animate-in fade-in duration-500 sm:bottom-6 sm:left-6 sm:-translate-x-[24%] sm:translate-y-[16%]"
              >
                <FreelancerCarouselWidget widget={activeSlide.widget} />
              </div>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-center gap-2">
            {FREELANCER_CAROUSEL_SLIDES.map((slide, index) => (
              <button
                key={slide.role}
                type="button"
                onClick={() => setActiveIndex(index)}
                aria-label={`Show slide ${index + 1}`}
                aria-current={index === activeIndex ? "true" : undefined}
                className={cn(
                  "h-2 rounded-full transition-all duration-300",
                  index === activeIndex ? "w-6 bg-zinc-800" : "w-2 bg-zinc-300 hover:bg-zinc-400"
                )}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function FreelancerRoleChip({ label, image, tilt = "cw" }) {
  return (
    <div className="flex shrink-0 items-center gap-3.5 sm:gap-4">
      <div className="flex h-[4.75rem] w-[3.75rem] shrink-0 items-center justify-center sm:h-[5.25rem] sm:w-[4.75rem]">
        <img
          src={image}
          alt=""
          className={cn(
            "h-14 w-14 rounded-lg object-cover ring-1 ring-black/[0.06] sm:h-[4.25rem] sm:w-[4.25rem]",
            tilt === "ccw" ? "-rotate-6" : "rotate-6"
          )}
          draggable={false}
        />
      </div>
      <span className="whitespace-nowrap text-[1.05rem] font-medium tracking-[-0.01em] text-zinc-900 sm:text-lg">
        {label}
      </span>
    </div>
  );
}

function FreelancerRoleMarqueeRow({ items, reverse = false, duration = 48, tilt = "cw" }) {
  const track = [...items, ...items];

  return (
    <div className="mably-marquee-fade relative w-full overflow-hidden py-3 sm:py-4">
      <div
        className={cn(
          "mably-marquee-track flex w-max items-center gap-8 sm:gap-10",
          reverse && "mably-marquee-track-reverse"
        )}
        style={{ "--marquee-duration": `${duration}s` }}
      >
        {track.map((item, index) => (
          <FreelancerRoleChip key={`${item.label}-${index}`} {...item} tilt={tilt} />
        ))}
      </div>
    </div>
  );
}

function TestimonialImageWidgets() {
  const activityBars = [
    { height: 38, className: "bg-orange-400" },
    { height: 52, className: "bg-orange-400" },
    { height: 44, className: "bg-orange-500" },
    { height: 68, className: "bg-orange-500" },
    { height: 82, className: "bg-orange-600" },
  ];

  return (
    <div className="pointer-events-none absolute inset-0" data-reveal-group>
      <div
        data-reveal-item
        className="absolute bottom-[22%] left-[7%] z-10 flex max-w-[min(72%,15rem)] origin-bottom-left scale-50 items-center gap-3 rounded-2xl bg-white px-3.5 py-3 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.28)] ring-1 ring-zinc-200/80 sm:bottom-[24%] sm:left-[9%] sm:scale-100 sm:gap-3.5 sm:px-4 sm:py-3.5"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-500 text-white shadow-[0_4px_14px_-2px_rgba(249,115,22,0.55)]">
          <FolderOpen className="h-4 w-4" strokeWidth={2.25} />
        </span>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
            Approved deliverables
          </p>
          <p className="truncate text-base font-bold tracking-tight text-zinc-900 sm:text-lg">
            12 on record
          </p>
        </div>
      </div>

      <div
        data-reveal-item
        className="absolute right-[10%] top-[16%] z-10 w-[min(40vw,11.5rem)] origin-top-right scale-50 rounded-2xl bg-white p-3.5 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.28)] ring-1 ring-zinc-200/80 sm:right-[12%] sm:top-[18%] sm:scale-100 sm:w-44 sm:p-4"
      >
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-500 text-white shadow-[0_4px_14px_-2px_rgba(249,115,22,0.55)]">
            <Zap className="h-3.5 w-3.5" strokeWidth={2.25} />
          </span>
          <p className="text-sm font-bold leading-tight text-zinc-900">Project activity</p>
        </div>
        <div className="mt-3 flex h-12 items-end justify-between gap-1 sm:h-14 sm:gap-1.5">
          {activityBars.map((bar, index) => (
            <span
              key={index}
              className={cn("w-full rounded-sm", bar.className)}
              style={{ height: `${bar.height}%` }}
            />
          ))}
        </div>
        <p className="mt-2 text-[10px] font-semibold leading-snug text-zinc-600">
          Updates clients actually saw
        </p>
      </div>
    </div>
  );
}

function FreelancerRolesMarqueeSection() {
  return (
    <section className="border-y border-zinc-100 bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-5">
        <div className="text-center">
          <h2
            data-split
            className="text-balance text-3xl font-semibold tracking-[-0.03em] text-zinc-900 sm:text-4xl"
          >
            For everyone
            <span className="font-normal text-zinc-400"> who works with clients.</span>
          </h2>
          <p data-reveal className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-zinc-500 sm:text-lg">
            The client-facing layer for freelance projects — designers, developers,
            consultants, and studio owners who are done with messy handoffs.
          </p>
        </div>

        <div data-reveal className="mt-12 w-full overflow-hidden space-y-6 sm:mt-14 sm:space-y-7">
          <FreelancerRoleMarqueeRow items={FREELANCER_ROLE_ROWS[0]} duration={52} tilt="cw" />
          <div className="sm:translate-x-8">
            <FreelancerRoleMarqueeRow
              items={FREELANCER_ROLE_ROWS[1]}
              reverse
              duration={58}
              tilt="ccw"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

const EARLY_OFFER_GROWTH_PLAN =
  EARLY_OFFER_PLANS.find((plan) => plan.key === "growth") ?? EARLY_OFFER_PLANS[1];
const EARLY_OFFER_GROWTH_PRICING = earlyOfferPrice(EARLY_OFFER_GROWTH_PLAN.listPriceMonthly);

function LandingEarlyOfferBanner({ visible }) {
  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-50 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
        visible ? "translate-y-0" : "pointer-events-none translate-y-full"
      )}
      aria-hidden={!visible}
    >
      <div className="border-t border-zinc-200/90 bg-white/90 shadow-[0_-8px_30px_-12px_rgba(0,0,0,0.12)] backdrop-blur-xl supports-[backdrop-filter]:bg-white/80">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:gap-4 sm:px-5 sm:py-3.5">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-[#f5d9b8] via-[#fde8d4] to-[#b8d4f5] sm:h-12 sm:w-12"
            aria-hidden
          >
            <img
              src="/images/Logo-icon.svg"
              alt=""
              className="h-6 w-6 sm:h-7 sm:w-7"
              draggable={false}
            />
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold tracking-tight text-zinc-900 sm:text-[0.9375rem]">
              {EARLY_OFFER_DISCOUNT_PERCENT}% off — first{" "}
              {EARLY_OFFER_FOUNDING_CUSTOMER_LIMIT} subscribers only
            </p>
            <p className="mt-0.5 truncate text-xs text-zinc-500 sm:text-sm">
              ${EARLY_OFFER_GROWTH_PRICING.display}/mo locked in forever for <span className="font-medium text-zinc-900">Growth plan</span>. Spots are filling
              fast.
            </p>
          </div>

          <Button
            size="sm"
            asChild
            className="h-9 shrink-0 rounded-full bg-zinc-900 px-4 text-white hover:bg-zinc-800 sm:h-10 sm:px-5"
          >
            <Link href={APP_SIGN_UP}>
              <span className="sm:hidden">{EARLY_OFFER_COPY.stickyCtaLabel}</span>
              <span className="hidden sm:inline">{EARLY_OFFER_COPY.claimCta}</span>
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

export function MablyLandingPage() {
  const rootRef = useRef(null);
  const galleryRef = useRef(null);
  const [navScrollProgress, setNavScrollProgress] = useState(0);
  const [offerBannerVisible, setOfferBannerVisible] = useState(false);
  const [galleryDetailIndex, setGalleryDetailIndex] = useState(null);
  const [galleryScroll, setGalleryScroll] = useState({ canLeft: false, canRight: true });

  const galleryDetail =
    galleryDetailIndex !== null ? GALLERY[galleryDetailIndex] ?? null : null;

  const galleryStepIndexRef = useRef(0);
  const galleryScrollingRef = useRef(false);

  const syncGalleryFromScroll = useCallback(() => {
    const el = galleryRef.current;
    if (!el) return;

    const cards = Array.from(el.querySelectorAll("[data-gallery-card]"));
    const maxScroll = Math.max(0, el.scrollWidth - el.clientWidth);
    const { scrollLeft } = el;

    if (cards.length) {
      const { positions } = buildGallerySnapPositions(el, cards);
      const minStep = (cards[0]?.offsetWidth ?? 300) + 16;
      const stepIndices = buildGalleryStepIndices(positions, maxScroll, minStep);
      galleryStepIndexRef.current = findClosestStepIndex(
        scrollLeft,
        positions,
        stepIndices,
        maxScroll
      );
    }

    setGalleryScroll({
      canLeft: scrollLeft > 4,
      canRight: scrollLeft < maxScroll - 4,
    });
  }, []);

  const scrollGallery = (direction) => {
    const el = galleryRef.current;
    if (!el) return;

    const cards = Array.from(el.querySelectorAll("[data-gallery-card]"));
    if (!cards.length) return;

    const { positions, maxScroll } = buildGallerySnapPositions(el, cards);
    const minStep = (cards[0]?.offsetWidth ?? 300) + 16;
    const stepIndices = buildGalleryStepIndices(positions, maxScroll, minStep);
    const { scrollLeft } = el;
    const canLeft = scrollLeft > 4;
    const canRight = scrollLeft < maxScroll - 4;

    if (direction === "left" && !canLeft) return;
    if (direction === "right" && !canRight) return;

    const lastStep = stepIndices.length - 1;
    let stepIndex = galleryStepIndexRef.current;

    if (direction === "left") {
      stepIndex = Math.max(0, stepIndex - 1);
    } else {
      stepIndex = Math.min(lastStep, stepIndex + 1);
    }

    galleryStepIndexRef.current = stepIndex;
    galleryScrollingRef.current = true;

    el.scrollTo({
      left: positions[stepIndices[stepIndex]],
      behavior: "smooth",
    });
  };

  useEffect(() => {
    const el = galleryRef.current;
    if (!el) return;

    let scrollEndTimer;

    const onScroll = () => {
      const maxScroll = Math.max(0, el.scrollWidth - el.clientWidth);
      const { scrollLeft } = el;
      setGalleryScroll({
        canLeft: scrollLeft > 4,
        canRight: scrollLeft < maxScroll - 4,
      });

      clearTimeout(scrollEndTimer);
      scrollEndTimer = window.setTimeout(() => {
        galleryScrollingRef.current = false;
        syncGalleryFromScroll();
      }, 100);
    };

    const onScrollEnd = () => {
      clearTimeout(scrollEndTimer);
      galleryScrollingRef.current = false;
      syncGalleryFromScroll();
    };

    syncGalleryFromScroll();
    el.addEventListener("scroll", onScroll, { passive: true });
    el.addEventListener("scrollend", onScrollEnd, { passive: true });
    window.addEventListener("resize", syncGalleryFromScroll);

    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(syncGalleryFromScroll) : null;
    ro?.observe(el);

    return () => {
      clearTimeout(scrollEndTimer);
      el.removeEventListener("scroll", onScroll);
      el.removeEventListener("scrollend", onScrollEnd);
      window.removeEventListener("resize", syncGalleryFromScroll);
      ro?.disconnect();
    };
  }, [syncGalleryFromScroll]);

  useEffect(() => {
    const howSection = rootRef.current?.querySelector("#how");
    if (!howSection) return;

    const updateBannerVisibility = () => {
      const { top } = howSection.getBoundingClientRect();
      setOfferBannerVisible(top <= window.innerHeight - OFFER_BANNER_HOW_OFFSET_PX);
    };

    updateBannerVisibility();
    window.addEventListener("scroll", updateBannerVisibility, { passive: true });
    window.addEventListener("resize", updateBannerVisibility);
    return () => {
      window.removeEventListener("scroll", updateBannerVisibility);
      window.removeEventListener("resize", updateBannerVisibility);
    };
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const progress = Math.min(
        1,
        Math.max(0, window.scrollY / NAV_SCROLL_RANGE_PX)
      );
      setNavScrollProgress(progress);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrolled = navScrollProgress > 0.12;
  const navMaxWidthRem = NAV_MAX_WIDTH_REM * (1 - NAV_WIDTH_SHRINK * navScrollProgress);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger, ScrollToPlugin, SplitText);
    const root = rootRef.current;
    if (!root) return;

    const anchors = Array.from(root.querySelectorAll('a[href^="#"]'));
    const onAnchorClick = (event) => {
      const href = event.currentTarget.getAttribute("href");
      const target = href && href.length > 1 ? document.querySelector(href) : null;
      if (!target) return;
      event.preventDefault();
      gsap.to(window, {
        scrollTo: { y: target, offsetY: 64 },
        duration: 1.1,
        ease: "power3.inOut",
      });
    };
    anchors.forEach((a) => a.addEventListener("click", onAnchorClick));

    const mm = gsap.matchMedia(rootRef);

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const splits = [];

      const heroTitle = root.querySelector("[data-hero-title]");
      if (heroTitle) {
        const split = new SplitText(heroTitle, { type: "words" });
        splits.push(split);
        gsap.fromTo(
          split.words,
          { y: 64, opacity: 0 },
          { y: 0, opacity: 1, duration: 1.2, stagger: 0.06, ease: "power4.out", delay: 0.15 }
        );
      }

      gsap.fromTo(
        root.querySelectorAll("[data-hero-fade]"),
        { y: 32, opacity: 0 },
        { y: 0, opacity: 1, duration: 1, stagger: 0.12, ease: "power4.out", delay: heroTitle ? 0.6 : 0.2 }
      );

      gsap.fromTo(
        root.querySelector("[data-hero-media]"),
        { scale: 1 },
        {
          scale: 1.12,
          ease: "none",
          scrollTrigger: {
            trigger: root.querySelector("[data-hero]"),
            start: "top top",
            end: "bottom top",
            scrub: true,
          },
        }
      );

      gsap.utils.toArray(root.querySelectorAll("[data-split]")).forEach((el) => {
        const split = new SplitText(el, { type: "words" });
        splits.push(split);
        gsap.fromTo(
          split.words,
          { y: 36, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.9,
            stagger: 0.04,
            ease: "power4.out",
            scrollTrigger: { trigger: el, start: "top 85%", once: true },
          }
        );
      });

      gsap.utils.toArray(root.querySelectorAll("[data-reveal]")).forEach((el) => {
        gsap.fromTo(
          el,
          { y: 40, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 1,
            ease: "power4.out",
            scrollTrigger: { trigger: el, start: "top 86%", once: true },
          }
        );
      });

      gsap.utils.toArray(root.querySelectorAll("[data-reveal-group]")).forEach((group) => {
        gsap.fromTo(
          group.querySelectorAll("[data-reveal-item]"),
          { y: 44, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.95,
            stagger: 0.1,
            ease: "power4.out",
            scrollTrigger: { trigger: group, start: "top 84%", once: true },
          }
        );
      });

      gsap.utils.toArray(root.querySelectorAll("[data-parallax]")).forEach((el) => {
        const amount = Number(el.dataset.parallax) || 6;
        gsap.fromTo(
          el,
          { yPercent: -amount },
          {
            yPercent: amount,
            ease: "none",
            scrollTrigger: {
              trigger: el.closest("[data-parallax-frame]") ?? el,
              start: "top bottom",
              end: "bottom top",
              scrub: true,
            },
          }
        );
      });

      return () => splits.forEach((split) => split.revert());
    });

    mm.add("(min-width: 768px) and (prefers-reduced-motion: no-preference)", () => {
      const section = root.querySelector("[data-hscroll-section]");
      const pin = section?.querySelector("[data-hscroll-pin]");
      const track = section?.querySelector("[data-hscroll-track]");

      if (!section || !pin || !track) return;

      const slides = gsap.utils.toArray("[data-hscroll-slide]", track);
      const progressBar = section.querySelector("[data-hscroll-progress]");
      const setProgressWidth = progressBar
        ? gsap.quickSetter(progressBar, "width", "%")
        : null;

      const setActiveSlide = (scrollProgress) => {
        if (!slides.length) return;
        const clamped = Math.min(Math.max(scrollProgress, 0), 1);
        const activeIndex = Math.round(clamped * (slides.length - 1));
        slides.forEach((slide, index) => {
          slide.dataset.active = index === activeIndex ? "true" : "false";
        });
        setProgressWidth?.(clamped * 100);
      };

      const getScrollDistance = () => {
        const lastSlide = track.querySelector("[data-hscroll-slide]:last-child");
        if (!lastSlide) return 0;
        const trackStyle = window.getComputedStyle(track);
        const padRight = parseFloat(trackStyle.paddingRight) || 0;
        return Math.max(
          0,
          lastSlide.offsetLeft + lastSlide.offsetWidth + padRight - pin.clientWidth
        );
      };

      const tween = gsap.to(track, {
        x: () => -getScrollDistance(),
        ease: "none",
        scrollTrigger: {
          trigger: pin,
          start: "top top",
          end: () => `+=${getScrollDistance()}`,
          pin,
          scrub: 0.65,
          invalidateOnRefresh: true,
          anticipatePin: 1,
          onUpdate(self) {
            setActiveSlide(self.progress);
          },
        },
      });

      setActiveSlide(0);

      const onLoad = () => ScrollTrigger.refresh();
      window.addEventListener("load", onLoad);

      return () => {
        window.removeEventListener("load", onLoad);
        tween.scrollTrigger?.kill();
        tween.kill();
      };
    });

    return () => {
      anchors.forEach((a) => a.removeEventListener("click", onAnchorClick));
      mm.revert();
    };
  }, []);

  return (
    <div
      ref={rootRef}
      className={cn(
        "min-h-screen bg-white text-zinc-900 antialiased transition-[padding] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
        offerBannerVisible && "pb-[4.75rem] sm:pb-20"
      )}
    >
      {/* Nav */}
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 px-0 pt-4 transition-[padding] duration-500",
          scrolled && "max-sm:px-6"
        )}
      >
        <div
          className="mx-auto flex h-14 items-center justify-between rounded-full border border-solid px-4 sm:px-0 sm:pl-7 sm:pr-3"
          style={{
            maxWidth: `min(${navMaxWidthRem}rem, calc(100% - 2rem))`,
            backgroundColor:
              navScrollProgress > 0
                ? `rgba(255, 255, 255, ${navScrollProgress * 0.75})`
                : "transparent",
            borderColor: `rgba(0, 0, 0, ${navScrollProgress * 0.06})`,
            boxShadow:
              navScrollProgress > 0
                ? `0 8px 40px -12px rgba(0, 0, 0, ${navScrollProgress * 0.16})`
                : "none",
            backdropFilter:
              navScrollProgress > 0
                ? `blur(${navScrollProgress * 24}px)`
                : "none",
          }}
        >
          <Link href="/" className="flex shrink-0 items-center">
            <img
              src="/images/Logo-SVG.svg"
              alt="Mably"
              className={cn(
                "h-7 w-auto transition duration-500",
                !scrolled && "brightness-0 invert"
              )}
              draggable={false}
            />
          </Link>
          <nav
            className={cn(
              "hidden items-center gap-8 text-sm font-medium transition-colors duration-500 md:flex",
              scrolled ? "text-zinc-600" : "text-white/80"
            )}
          >
            <a href="#features" className="transition hover:opacity-70">
              Features
            </a>
            <a href="#who" className="transition hover:opacity-70">
              Who it&apos;s for
            </a>
            <a href="#pricing" className="transition hover:opacity-70">
              Pricing
            </a>
            <a href="#faq" className="transition hover:opacity-70">
              FAQ
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              asChild
              className={cn(
                "hidden rounded-full transition-colors duration-500 sm:inline-flex",
                scrolled
                  ? "text-zinc-700 hover:bg-zinc-100"
                  : "text-white hover:bg-white/15 hover:text-white"
              )}
            >
              <Link href={APP_SIGN_IN}>Sign in</Link>
            </Button>
            <Button
              asChild
              className="rounded-full bg-orange-500 px-5 text-white transition-colors duration-500 hover:bg-orange-600"
            >
              <Link href={APP_SIGN_UP}>Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section data-hero className="p-1.5 sm:p-2">
        <div className="relative flex min-h-[calc(100svh-0.75rem)] flex-col overflow-hidden rounded-[1.75rem] bg-zinc-950 sm:min-h-[calc(100svh-1rem)] sm:rounded-[2.25rem]">
          <div className="absolute inset-0">
            <video
              data-hero-media
              className="h-full w-full object-cover"
              src={LANDING.heroVideo}
              poster={LANDING.heroVideoThumbnail}
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
            />
            <div className="absolute inset-0 bg-black/40" />
            <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-black/55 to-transparent" />
          </div>

          <div className="relative z-10 flex flex-1 items-center justify-center px-6 pb-10 pt-36 sm:pt-40">
            <div className="mx-auto max-w-3xl text-center text-white">
              <h1
                data-hero-title
                className="text-balance text-5xl font-semibold leading-[1.06] tracking-[-0.035em] sm:text-6xl lg:text-7xl xl:text-[5.25rem] xl:leading-[1.04]"
              >
                Upgrade your client experience
              </h1>
              <p
                data-hero-fade
                className="mx-auto mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-white/80 sm:mt-7 sm:text-xl"
              >
                Mably gives every client one simple workspace — so they always know
                what changed, what needs review, and where everything is.
              </p>

              <div
                data-hero-fade
                className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"
              >
                <Button
                  size="lg"
                  asChild
                  className="group h-12 rounded-full bg-orange-500 px-8 text-base font-semibold text-white shadow-[0_8px_30px_-6px_rgba(249,115,22,0.55)] hover:bg-orange-600"
                >
                  <Link href={APP_SIGN_UP}>
                    Get started
                    <ArrowRight className="ml-1.5 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="ghost"
                  asChild
                  className="h-12 rounded-full border border-white/30 bg-white/10 px-8 text-base text-white backdrop-blur-md hover:bg-white/20 hover:text-white"
                >
                  <Link href={APP_DEMO}>Explore the demo workspace</Link>
                </Button>
              </div>
              <p data-hero-fade className="mt-5 text-xs text-white/60">
                From $9/month · Cancel anytime · One link clients remember
              </p>
            </div>
          </div>

          <div className="pointer-events-none relative z-10 hidden items-end justify-between px-8 pb-7 text-xs font-medium text-white/70 sm:flex">
            <p data-hero-fade>The client-facing layer for freelancers.</p>
            <p data-hero-fade>Clear projects. Recorded approvals.</p>
          </div>
        </div>
      </section>

      <HorizontalScrollShowcase />

      {/* How it works */}
      <section id="how" className="scroll-mt-24 px-4 py-24 sm:px-5 sm:py-32">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto mb-14 max-w-lg text-center sm:mb-16">
            <h2
              data-split
              className="text-3xl font-semibold tracking-[-0.03em] text-zinc-900 sm:text-4xl lg:text-[2.75rem]"
            >
              How it works
            </h2>
            <p data-reveal className="mt-4 text-base text-zinc-500 sm:text-lg">
              Set up a branded workspace, send one link, and keep updates, files,
              feedback, and approvals in one place clients understand.
            </p>
          </div>

          <div
            data-reveal-group
            className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6"
          >
            {HOW_IT_WORKS.map((step) => {
              const Icon = step.icon;
              return (
                <article
                  key={step.step}
                  data-reveal-item
                  className="flex flex-col rounded-[1.75rem] bg-[#f9f8f3] p-6 sm:p-7"
                >
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-sm",
                      step.iconClass
                    )}
                  >
                    <Icon className="h-5 w-5" strokeWidth={1.75} />
                  </div>
                  <h3 className="mt-5 text-lg font-semibold leading-snug text-zinc-900">
                    {step.title}
                  </h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-zinc-500">
                    {step.copy}
                  </p>
                  <div className="mt-6 rounded-2xl bg-white p-4 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.12)] ring-1 ring-black/[0.04]">
                    <HowItWorksPreview type={step.preview} />
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* Horizontal gallery — Oura-style */}
      <section id="features" className="scroll-mt-24 overflow-hidden bg-[#f5f2ed] py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-5">
          <div className="mb-10 flex items-end justify-between gap-4">
            <h2
              data-split
              className="max-w-lg text-balance text-3xl font-semibold tracking-[-0.03em] sm:text-4xl"
            >
              Everything clients need to stay clear.
              <span className="font-normal text-zinc-500"> Built for momentum, not chaos.</span>
            </h2>
            <div className="hidden shrink-0 gap-2 sm:flex">
              <button
                type="button"
                onClick={() => scrollGallery("left")}
                aria-disabled={!galleryScroll.canLeft}
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full border border-zinc-300 bg-white text-zinc-700 transition-opacity",
                  galleryScroll.canLeft
                    ? "opacity-100 hover:opacity-60"
                    : "opacity-30"
                )}
                aria-label="Scroll left"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => scrollGallery("right")}
                aria-disabled={!galleryScroll.canRight}
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full border border-zinc-300 bg-white text-zinc-700 transition-opacity",
                  galleryScroll.canRight
                    ? "opacity-100 hover:opacity-60"
                    : "opacity-30"
                )}
                aria-label="Scroll right"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        <div
          ref={galleryRef}
          className="flex gap-4 overflow-x-auto overscroll-x-contain pb-2 pl-[max(1rem,calc((100vw-80rem)/2+1rem))] pr-[max(1rem,calc((100vw-80rem)/2+1rem))] sm:pl-[max(1.25rem,calc((100vw-80rem)/2+1.25rem))] sm:pr-[max(1.25rem,calc((100vw-80rem)/2+1.25rem))] [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {GALLERY.map((item, index) => (
            <article
              key={item.badge}
              data-gallery-card
              data-reveal
              role="button"
              tabIndex={0}
              onClick={() => setGalleryDetailIndex(index)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setGalleryDetailIndex(index);
                }
              }}
              className="group relative w-[min(78vw,300px)] shrink-0 cursor-pointer overflow-hidden rounded-3xl sm:w-[300px]"
            >
              <img
                src={item.image}
                alt=""
                className="aspect-[3/4] w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                draggable={false}
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent transition-opacity duration-300 group-hover:from-black/75" />
              <span className="pointer-events-none absolute left-4 top-4 flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-medium text-white backdrop-blur-md">
                {item.badge}
              </span>
              <button
                type="button"
                onClick={() => setGalleryDetailIndex(index)}
                className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-zinc-800 shadow-sm transition hover:scale-105 hover:bg-white"
                aria-label={`Learn more about ${item.badge}`}
              >
                <Plus className="h-4 w-4" />
              </button>
              <p className="pointer-events-none absolute bottom-6 left-5 right-5 text-2xl font-medium leading-tight text-white">
                {item.title}{" "}
                <span className="font-serif italic">{item.emphasis}</span>
              </p>
            </article>
          ))}
        </div>

        <GalleryFeatureDialog
          item={galleryDetail}
          open={galleryDetailIndex !== null}
          onOpenChange={(open) => {
            if (!open) setGalleryDetailIndex(null);
          }}
        />
      </section>

      <FreelancerCarouselSection />

      {/* DISABLED: Full-width video + glass stats — set `showVideoStatsSection` to true to restore */}
      {false && (
      <section className="relative min-h-[88svh] overflow-hidden">
        <video
          className="absolute inset-0 h-full w-full object-cover"
          src={LANDING.bgVideo}
          poster={LANDING.heroBg}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/30 to-black/40" />

        <div className="relative z-10 mx-auto flex min-h-[88svh] max-w-7xl flex-col justify-center px-4 py-24 sm:px-5 lg:flex-row lg:items-center lg:justify-between lg:gap-16">
          <div className="max-w-md text-white">
            <h2
              data-split
              className="text-balance text-3xl font-semibold leading-snug tracking-[-0.025em] sm:text-4xl lg:text-5xl"
            >
              Give every client
              <br />
              <span className="font-serif italic font-normal">a clear project experience.</span>
            </h2>
            <p data-reveal className="mt-6 text-base leading-relaxed text-white/75">
              One link where they see what changed, what needs review, and what was
              approved — without digging through email or WhatsApp.
            </p>
            <div data-reveal className="mt-8">
              <DemoLink className="text-white/80 hover:text-white" />
            </div>
          </div>

          <div data-reveal-group className="mt-12 grid grid-cols-2 gap-3 sm:gap-4 lg:mt-0 lg:w-[340px]">
            {OVERLAY_STATS.map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  data-reveal-item
                  className="rounded-2xl border border-white/10 bg-black/35 p-4 backdrop-blur-xl sm:p-5"
                >
                  <div className="flex items-start justify-between">
                    <p className="text-2xl font-semibold text-white sm:text-3xl">{stat.value}</p>
                    <Icon className="h-4 w-4 text-white/50" strokeWidth={1.5} />
                  </div>
                  <p className="mt-2 text-xs leading-snug text-white/65">{stat.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
      )}

      {/* Demo interstitial */}
      <section className="border-y border-zinc-100 bg-zinc-50 px-4 py-20 sm:px-5 sm:py-28">
        <div data-reveal className="mx-auto max-w-3xl text-center">
          <h2 className="text-balance text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
            See how a real client workspace works
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-zinc-500">
            Walk through updates, files, approvals, and invoices in a live demo —
            sign up free, no subscription required.
          </p>
          <Button
            size="lg"
            asChild
            className="group mt-8 h-12 rounded-full bg-orange-500 px-8 text-base font-semibold text-white shadow-[0_8px_30px_-6px_rgba(249,115,22,0.55)] hover:bg-orange-600"
          >
            <Link href={APP_DEMO}>
              Explore the demo workspace
              <ArrowRight className="ml-1.5 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Testimonial */}
      <section className="px-4 py-16 sm:px-5 sm:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto mb-10 max-w-2xl text-center sm:mb-12">
            <h2
              data-split
              className="text-3xl font-semibold tracking-[-0.03em] text-zinc-900 sm:text-4xl"
            >
              Trusted by freelancers.
              <span className="font-normal text-zinc-400"> Who refuse to run projects from scattered messages.</span>
            </h2>
          </div>

          <div className="grid items-stretch gap-4 sm:gap-5 lg:grid-cols-[minmax(0,1.85fr)_minmax(0,1fr)]">
            <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl">
              <img
                data-reveal
                src={TESTIMONIAL.image}
                alt=""
                className="aspect-[3/2] w-full object-cover"
                draggable={false}
              />
              <TestimonialImageWidgets />
            </div>

            <figure
              data-reveal
              className="flex min-h-0 flex-col justify-between rounded-2xl bg-[#f4f4f2] p-6 sm:rounded-3xl sm:p-7 lg:p-8"
            >
              <div>
                <span
                  className="select-none font-serif text-5xl leading-none text-zinc-300 sm:text-6xl"
                  aria-hidden
                >
                  &ldquo;
                </span>
                <blockquote className="mt-2 text-pretty text-lg font-medium leading-relaxed text-zinc-700 sm:text-xl sm:leading-relaxed">
                  {TESTIMONIAL.quote}
                </blockquote>
              </div>
              <figcaption className="mt-6 flex items-center gap-3 sm:mt-8">
                <img
                  src={TESTIMONIAL.avatar}
                  alt={TESTIMONIAL.name}
                  className="h-10 w-10 shrink-0 rounded-full object-cover"
                  draggable={false}
                />
                <div>
                  <p className="text-sm font-semibold text-zinc-900">{TESTIMONIAL.name}</p>
                  <p className="mt-0.5 text-xs text-zinc-600 sm:text-sm">{TESTIMONIAL.role}</p>
                </div>
              </figcaption>
            </figure>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="relative scroll-mt-24 overflow-hidden px-4 py-24 sm:px-5 sm:py-32">
        <div
          className="pointer-events-none absolute -left-32 top-0 h-72 w-72 rounded-full bg-orange-200/40 blur-3xl"
          aria-hidden
        />
        <div className="relative mx-auto max-w-6xl">
          <div className="mx-auto mb-14 max-w-2xl text-center sm:mb-16">
            <p data-reveal className="text-sm font-medium text-zinc-500">
              Pricing
            </p>
            <h2
              data-split
              className="mt-3 text-balance text-3xl font-semibold tracking-[-0.03em] text-zinc-900 sm:text-4xl lg:text-[2.75rem]"
            >
              One workspace for your clients.
              <span className="font-normal text-zinc-400"> One honest price for you.</span>
            </h2>
            <p data-reveal className="mt-4 text-base leading-relaxed text-zinc-500 sm:mt-5 sm:text-lg">
              Stop stitching together email, Drive, and invoices. Send one branded link —
              clients know what to review, what changed, and what was approved. Cancel anytime.
            </p>
          </div>

          <div
            data-reveal-group
            className="mx-auto grid max-w-5xl gap-5 lg:grid-cols-2 lg:items-stretch"
          >
            {PRICING.map((plan) => (
              <div
                key={plan.name}
                data-reveal-item
                className={cn(
                  "relative flex flex-col rounded-[1.75rem] p-8 sm:p-9",
                  plan.highlight
                    ? "bg-orange-500 text-white shadow-[0_24px_60px_-20px_rgba(249,115,22,0.55)]"
                    : "border border-zinc-100 bg-white text-zinc-900 shadow-[0_12px_40px_-24px_rgba(0,0,0,0.12)]"
                )}
              >

                {plan.savingsBadge ? (
                  <span className="absolute right-5 top-5 rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-orange-600 shadow-sm ring-1 ring-white/80">
                    {plan.savingsBadge}
                  </span>
                ) : null}

                <div>
                  <h3 className="text-2xl font-semibold tracking-[-0.02em] sm:text-[1.75rem]">
                    {plan.name}
                  </h3>
                  <p
                    className={cn(
                      "mt-2 text-sm leading-relaxed",
                      plan.highlight ? "text-white/75" : "text-zinc-500"
                    )}
                  >
                    {plan.description}
                  </p>
                </div>

                <div className="mt-8 flex items-baseline gap-1.5">
                  <span className="text-5xl font-semibold tracking-tight sm:text-[3.25rem]">
                    {plan.price}
                  </span>
                  <span
                    className={cn(
                      "text-sm font-medium",
                      plan.highlight ? "text-white/70" : "text-zinc-500"
                    )}
                  >
                    {plan.period}
                  </span>
                </div>

                <p
                  className={cn(
                    "mt-3 text-sm leading-relaxed",
                    plan.highlight ? "text-white/75" : "text-zinc-500"
                  )}
                >
                  {plan.note}
                </p>

                <ul className="mt-8 flex-1 space-y-3.5">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-[15px] leading-snug">
                      <Check
                        className={cn(
                          "mt-0.5 h-4 w-4 shrink-0",
                          plan.highlight ? "text-white" : "text-zinc-900"
                        )}
                        strokeWidth={2.5}
                      />
                      <span className={plan.highlight ? "text-white/90" : "text-zinc-700"}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <Button
                  size="lg"
                  asChild
                  className={cn(
                    "mt-10 h-12 w-full rounded-full text-[15px] font-semibold",
                    plan.highlight
                      ? "bg-white text-orange-600 hover:bg-orange-50"
                      : "bg-orange-500 text-white hover:bg-orange-600"
                  )}
                >
                  <Link href={APP_SIGN_UP}>
                    {plan.cta}
                    <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            ))}
          </div>

          <p
            data-reveal
            className="mx-auto mt-12 max-w-xl text-center text-sm leading-relaxed text-zinc-500 sm:text-[15px]"
          >
            Custom client systems cost hundreds a month.
            We&apos;re offering the first 50 founding members{" "}
            <span className="font-medium text-zinc-700">75% off locked in forever</span> —
            for freelancers who want clearer projects without the chaos. Spots are filling fast.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <LandingFaqSection />

      <FreelancerRolesMarqueeSection />

      {/* Final CTA */}
      <section className="relative overflow-hidden px-4 py-28 sm:px-5 sm:py-40">
        <img
          src={LANDING.finalCta}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          draggable={false}
        />
        <div className="absolute inset-0 bg-black/30" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/50 to-black/65" />

        <div className="relative z-10 mx-auto max-w-3xl text-center text-white">
          <h2
            data-split
            className="text-balance text-4xl font-semibold leading-[1.1] tracking-[-0.03em] sm:text-5xl"
          >
            Make your next client project
            <br />
            <span className="text-orange-400">clearer than the last.</span>
          </h2>
          <div data-reveal className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              size="lg"
              asChild
              className="group h-12 rounded-full bg-orange-500 px-10 text-white hover:bg-orange-600"
            >
              <Link href={APP_SIGN_UP}>
                Get started
                <ArrowRight className="ml-1.5 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="ghost"
              asChild
              className="h-12 rounded-full border border-white/30 bg-white/10 px-8 text-white backdrop-blur-sm hover:bg-white/20 hover:text-white"
            >
              <Link href={APP_DEMO}>Explore the demo workspace</Link>
            </Button>
          </div>
          <p data-reveal className="mt-6 text-sm text-white/60">
            From $9/month · Cancel anytime · One link clients remember
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-100 px-4 py-14 sm:px-5">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-8 sm:grid-cols-3">
          <div className="text-center sm:text-left">
            <img
              src="/images/Logo-SVG.svg"
              alt="Mably"
              className="mx-auto h-6 w-auto opacity-80 sm:mx-0"
              draggable={false}
            />
            <p className="mt-2 text-xs text-zinc-400">
              Client workspace software for freelancers.
            </p>
          </div>
          <nav className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-zinc-500">
            <Link href="/whats-new" className="transition hover:text-orange-600">
              What&apos;s new
            </Link>
            <Link href={LEGAL_LINKS.terms} className="transition hover:text-orange-600">
              Terms
            </Link>
            <Link href={LEGAL_LINKS.privacy} className="transition hover:text-orange-600">
              Privacy
            </Link>
            <Link href={LEGAL_LINKS.refund} className="transition hover:text-orange-600">
              Refund
            </Link>
          </nav>
          <p className="text-center text-sm text-zinc-400 sm:text-right">
            © {new Date().getFullYear()} Mably
          </p>
        </div>
      </footer>

      <LandingEarlyOfferBanner visible={offerBannerVisible} />
    </div>
  );
}
