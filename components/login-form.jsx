"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { sanitizeNextPath } from "@/lib/auth/safe-next-path";

export function LoginForm({ className, next = null, intent = null, ...props }) {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [showOtpInput, setShowOtpInput] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");

    const { signInWithEmail } = await import('@/lib/auth/actions');
    const result = await signInWithEmail(email);

    if (result.error) {
      setMessage(result.error);
    } else {
      // Success - just show OTP input, no message needed
      setShowOtpInput(true);
    }

    setIsLoading(false);
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");

    const { verifyOtp } = await import("@/lib/auth/actions");
    const fromUrl =
      typeof window !== "undefined"
        ? sanitizeNextPath(new URLSearchParams(window.location.search).get("next"))
        : null;
    const nextForVerify = next ?? fromUrl ?? undefined;
    const result = await verifyOtp(email, otp, nextForVerify);

    if (result?.error) {
      setMessage(result.error);
      setIsLoading(false);
    }
    // If successful, verifyOtp will redirect to dashboard
  };

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    setMessage("");

    const { signInWithOAuth } = await import("@/lib/auth/actions");
    const fromUrl =
      typeof window !== "undefined"
        ? sanitizeNextPath(new URLSearchParams(window.location.search).get("next"))
        : null;
    const nextForOAuth = next ?? fromUrl ?? undefined;
    const result = await signInWithOAuth("google", nextForOAuth);

    if (result?.error) {
      setMessage(result.error);
      setIsLoading(false);
      return;
    }

    if (result?.url && typeof window !== "undefined") {
      window.location.assign(result.url);
      return;
    }

    setMessage("Could not start Google sign-in. Please try again.");
    setIsLoading(false);
  };

  const portalFlow =
    intent === "portal" || (typeof next === "string" && next.startsWith("/project/"));
  const signupFlow = intent === "signup";

  return (
    <div className={cn("flex flex-col gap-[24px] animate-in fade-in slide-in-from-bottom-4 duration-500 z-3 relative", className)} {...props}>
      <form onSubmit={handleSubmit}>
        <FieldGroup className="gap-[40px]">
          <div className="flex flex-col items-center gap-[8px] text-center">
            <p className="text-sm text-primary font-semibold uppercase">
              {portalFlow ? "Project portal" : signupFlow ? "Create account" : "Welcome back"}
            </p>
            <h1 className="text-2xl font-semibold">
              {portalFlow
                ? "Sign in to continue"
                : signupFlow
                  ? "Create your account"
                  : "Sign in to your account"}
            </h1>
            <FieldDescription className="text-center text-sm">
              {!showOtpInput
                ? portalFlow
                  ? "Use the same email your freelancer invited — we will email you a one-time code."
                  : signupFlow
                    ? "Enter your email to create your account. If you already have one, we will sign you in."
                    : "Enter your email to sign in. New here? We will create your account."
                : `We sent a 6-digit code to ${email}`}
            </FieldDescription>
          </div>
          <div className="flex flex-col gap-[24px]">
          <div className="flex flex-col gap-[16px]">
          {!showOtpInput ? (
            <>
              <Field className="gap-[6px]">
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </Field>
              {message && (
                <div className={`rounded-md p-3 text-sm ${message.includes('error') || message.includes('Invalid') ? 'bg-destructive/10 border border-destructive/20 text-destructive' : 'bg-primary/10 border border-primary/20 text-primary'}`}>
                  {message}
                </div>
              )}
              <Field>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Sending code..." : signupFlow ? "Create account with email" : "Continue with Email"}
                </Button>
              </Field>
            </>
          ) : (
            <>
              <Field>
                <FieldLabel htmlFor="otp" className="sr-only">
                  Verification code
                </FieldLabel>
                <InputOTP
                  maxLength={6}
                  id="otp"
                  value={otp}
                  onChange={(value) => setOtp(value)}
                  required
                  disabled={isLoading}
                  containerClassName="gap-4 justify-center"
                >
                  <InputOTPGroup className="gap-2.5 *:data-[slot=input-otp-slot]:h-16 *:data-[slot=input-otp-slot]:w-12 *:data-[slot=input-otp-slot]:rounded-md *:data-[slot=input-otp-slot]:border *:data-[slot=input-otp-slot]:text-xl">
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                  </InputOTPGroup>
                  <InputOTPSeparator />
                  <InputOTPGroup className="gap-2.5 *:data-[slot=input-otp-slot]:h-16 *:data-[slot=input-otp-slot]:w-12 *:data-[slot=input-otp-slot]:rounded-md *:data-[slot=input-otp-slot]:border *:data-[slot=input-otp-slot]:text-xl">
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
                <FieldDescription className="text-center text-sm">
                  Didn&apos;t receive the code?{" "}
                  <button
                    type="button"
                    onClick={handleSubmit}
                    className="text-primary hover:underline font-medium"
                    disabled={isLoading}
                  >
                    Resend
                  </button>
                </FieldDescription>
              </Field>
              {message && (
                <div className={`rounded-md p-3 text-sm text-center ${message.includes('error') || message.includes('Invalid') ? 'bg-destructive/10 border border-destructive/20 text-destructive' : 'bg-primary/10 border border-primary/20 text-primary'}`}>
                  {message}
                </div>
              )}
              <Field>
                <Button onClick={handleVerifyOtp} className="w-full" disabled={isLoading || otp.length !== 6}>
                  {isLoading ? "Verifying..." : "Verify Code"}
                </Button>
              </Field>
              <button
                type="button"
                onClick={() => {
                  setShowOtpInput(false);
                  setOtp("");
                  setMessage("");
                }}
                className="text-sm text-muted-foreground hover:text-foreground underline text-center w-full"
              >
                Use a different email
              </button>
            </>
          )}
          </div>
          <FieldSeparator className="uppercase text-xs">Or continue with</FieldSeparator>
          <Field>
            <Button variant="outline" type="button" disabled={isLoading} className="w-full" onClick={handleGoogleAuth}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="size-4">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              {signupFlow ? "Create account with Google" : "Continue with Google"}
            </Button>
          </Field>
          </div>
        </FieldGroup>
      </form>
    </div>
  );
}

