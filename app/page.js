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
};

export default async function Home({ searchParams }) {
  const sp = await searchParams;
  const rawNext = Array.isArray(sp.next) ? sp.next[0] : sp.next;
  const next = sanitizeNextPath(typeof rawNext === "string" ? rawNext : undefined) ?? null;
  const rawIntent = Array.isArray(sp.intent) ? sp.intent[0] : sp.intent;
  const intent = rawIntent === "portal" || rawIntent === "signup" ? rawIntent : null;

  return <LoginScreen next={next} intent={intent} />;
}
