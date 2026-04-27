import { LoginScreen } from "@/components/login-screen";
import { sanitizeNextPath } from "@/lib/auth/safe-next-path";

export const metadata = {
  title: "Sign In",
  description: "Sign in to your Mably account",
};

export default async function Home({ searchParams }) {
  const sp = await searchParams;
  const rawNext = Array.isArray(sp.next) ? sp.next[0] : sp.next;
  const next = sanitizeNextPath(typeof rawNext === "string" ? rawNext : undefined) ?? null;
  const rawIntent = Array.isArray(sp.intent) ? sp.intent[0] : sp.intent;
  const intent = rawIntent === "portal" ? "portal" : null;

  return <LoginScreen next={next} intent={intent} />;
}
