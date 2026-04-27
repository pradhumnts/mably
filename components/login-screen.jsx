import { LoginForm } from "@/components/login-form";
import { FieldDescription } from "@/components/ui/field";
import { LEGAL_LINKS } from "@/lib/constants/legal-links";

export function LoginScreen({ next = null, intent = null }) {
  return (
    <div>
      <img
        src="/images/Login-background.webp"
        alt="Login background"
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
      <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10 relative">
        <div className="w-full max-w-sm">
          <LoginForm key={next ? `login-${next}` : "login-form"} next={next} intent={intent} />
        </div>
        <FieldDescription className="absolute bottom-8 left-0 right-0 mx-auto max-w-full px-4 text-center text-xs leading-relaxed">
          By continuing, you agree to our{" "}
          <a
            href={LEGAL_LINKS.terms}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-4"
          >
            Terms
          </a>
          ,{" "}
          <a
            href={LEGAL_LINKS.privacy}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-4"
          >
            Privacy
          </a>
          , and{" "}
          <a
            href={LEGAL_LINKS.refund}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-4"
          >
            Refund
          </a>{" "}
          policy.
        </FieldDescription>
      </div>
    </div>
  );
}
