/** Marketing pricing cards — shared by homepage and /pricing. */
export const MARKETING_PRICING_PLANS = [
  {
    name: "Starter",
    description:
      "One active client project with a branded workspace — the one link your client actually remembers.",
    originalPrice: "$9",
    price: "$2.25",
    period: "/ month",
    note: "Cancel anytime",
    features: [
      "1 active project",
      "Branded client workspace",
      "Invite multiple clients (free)",
      "Invite teammates from Settings → Team",
      "Extra seats $9 at list when they accept",
      "Founding discount covers your seat only",
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
    originalPrice: "$19",
    price: "$4.75",
    period: "/ month",
    note: "Cancel anytime",
    badge: "Most popular",
    savingsBadge: "Best value",
    features: [
      "Everything in Starter",
      "Unlimited projects",
      "Extra seats $19 at list when they accept",
      "25 GB storage (no per-file cap)",
      'Hide "Powered by" badge',
      "Priority support",
    ],
    highlight: true,
    cta: "Get started",
  },
];
