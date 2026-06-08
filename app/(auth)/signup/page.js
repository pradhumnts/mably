import { LoginScreen } from "@/components/login-screen";
import { sanitizeNextPath } from "@/lib/auth/safe-next-path";

export const metadata = {
  title: "Create account",
  description: "Create your Mably account or sign in",
};

export default async function SignupPage({ searchParams }) {
  const sp = await searchParams;
  const rawNext = Array.isArray(sp?.next) ? sp.next[0] : sp?.next;
  const next = sanitizeNextPath(typeof rawNext === "string" ? rawNext : undefined) ?? null;
  return <LoginScreen next={next} intent="signup" />;
}
