import Link from "next/link";
import { SignupForm } from "@/components/signup-form";
import { FieldDescription } from "@/components/ui/field";
import { sanitizeNextPath } from "@/lib/auth/safe-next-path";

export const metadata = {
  title: "Sign Up",
  description: "Create your Mably account",
};

export default async function SignupPage({ searchParams }) {
  const sp = await searchParams;
  const rawNext = Array.isArray(sp.next) ? sp.next[0] : sp.next;
  const next = sanitizeNextPath(typeof rawNext === "string" ? rawNext : undefined) ?? null;
  const rawIntent = Array.isArray(sp.intent) ? sp.intent[0] : sp.intent;
  const intent = rawIntent === "portal" ? "portal" : null;

  return (
    <div>
      <img
        src="/images/Login-background.webp"
        alt="Signup background"
        className="absolute top-0 z-1 inset-0 w-full h-100 object-cover rounded-xl"
        draggable={false}
      />
      <div className="absolute top-24 flex justify-center items-center w-full z-10 animate-in fade-in duration-700">
        <img
          src="/images/Logo-SVG.svg"
          alt="Logo"
          className="center mx-auto z-2 w-40 justify-center items-center"
          draggable={false}
        />
      </div>
      <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10 relative max-w-full">
        <div className="w-full max-w-sm">
          <SignupForm key={next ? `signup-${next}` : "signup-form"} next={next} intent={intent} />
        </div>
        <FieldDescription className="text-center text-xs absolute bottom-[60px] max-w-full w-full">
          By clicking continue, you agree to our{" "}
          <Link href="/terms" className="underline underline-offset-4">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="underline underline-offset-4">
            Privacy Policy
          </Link>
          .
        </FieldDescription>
      </div>
    </div>
  );
}
