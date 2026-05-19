/** localStorage: user dismissed the founder welcome modal */
export const FOUNDER_WELCOME_SEEN_KEY = "mably:founder-welcome:seen";

/** sessionStorage: show founder welcome once on /projects after first project + invite */
export const FOUNDER_WELCOME_PENDING_KEY = "mably:founder-welcome:pending";

export function hasSeenFounderWelcome() {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(FOUNDER_WELCOME_SEEN_KEY) === "1";
  } catch {
    return false;
  }
}

export function markFounderWelcomeSeen() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(FOUNDER_WELCOME_SEEN_KEY, "1");
  } catch {
    /* ignore */
  }
}

/** Call after first project is created and invite is sent, before redirecting to /projects. */
export function queueFounderWelcomeAfterFirstProject() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(FOUNDER_WELCOME_PENDING_KEY, "1");
  } catch {
    /* ignore */
  }
}

/** Returns true once per queued session (clears the pending flag). */
export function consumeFounderWelcomePending() {
  if (typeof window === "undefined") return false;
  try {
    if (sessionStorage.getItem(FOUNDER_WELCOME_PENDING_KEY) === "1") {
      sessionStorage.removeItem(FOUNDER_WELCOME_PENDING_KEY);
      return true;
    }
  } catch {
    /* ignore */
  }
  return false;
}

/** @type {readonly { name: string; role: string; imageSrc: string }[]} */
export const FOUNDER_WELCOME_TEAM = [
  {
    name: "Sanjana",
    role: "Team",
    imageSrc: "/images/founder/sanjana.jpeg",
  },
  {
    name: "Maya",
    role: "Team",
    imageSrc: "/images/demo-client-profile.webp",
  },
  {
    name: "Alex",
    role: "Team",
    imageSrc:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&h=120&fit=crop",
  },
];

/** @type {const} */
export const FOUNDER_WELCOME_COPY = {
  eyebrow: "A note from the founder",
  headline: "Congratulations — your first project is live!",
  paragraphs: [
    "You just sent your client their portal invite. That's a real milestone — we're cheering for you. We're a team, and we're here when you need us.",
  ],
  projectCapabilitiesParagraph:
    "In this project you can share files and links, chat with your client, watch the activity feed, and send payment links — all in one place, without juggling a dozen tools.",
  signOff: "Cheering you on,",
  founder: {
    name: "Pradyumn Vaishnav",
    title: "Founder, Mably",
    imageSrc: "/images/founder/prad.png",
    signatureSrc: "/images/founder/prad-sign.webp",
    email: "prad@mably.io",
    emailLabel: "Feel free to reach out to me personally",
  },
  teamHeading: "Connect anytime with our team",
  teamEmail: "hello@mably.io",
  teamEmailLabel: "Reach the team at",
  cta: "Got it — Let's get back to work",
};
