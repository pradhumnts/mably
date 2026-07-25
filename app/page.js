import { LoginScreen } from "@/components/login-screen";
import { sanitizeNextPath } from "@/lib/auth/safe-next-path";
import {
  getCanonicalAppUrl,
  getSocialShareMetadata,
} from "@/lib/marketing/social-share-metadata";

const title = "Mably — Simple client portal for freelancers";
const description =
  "Sign in to Mably or create an account. One branded client portal for files, feedback, approvals, and project handoff.";

export const metadata = {
  title: "Sign in or create account",
  description,
  ...getSocialShareMetadata({
    title,
    description,
    url: getCanonicalAppUrl(),
  }),
  // app.mably.io root is a login screen — keep it out of Google so it doesn't
  // compete with the mably.io marketing homepage for brand/home queries.
  // No canonical either: noindex + canonical send conflicting signals.
  robots: { index: false, follow: true },
  alternates: {},
};

export default async function Home({ searchParams }) {
  const sp = await searchParams;
  const rawNext = Array.isArray(sp.next) ? sp.next[0] : sp.next;
  const next = sanitizeNextPath(typeof rawNext === "string" ? rawNext : undefined) ?? null;
  const rawIntent = Array.isArray(sp.intent) ? sp.intent[0] : sp.intent;
  const intent = rawIntent === "portal" || rawIntent === "signup" ? rawIntent : null;

  return <LoginScreen next={next} intent={intent} />;
}
