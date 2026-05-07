"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import {
  ChevronRight,
  ChevronLeft,
  Activity,
  Library,
  CreditCard,
  MessageSquare,
  Check,
  Code2,
  Palette,
  PenLine,
  TrendingUp,
  Video,
  Star,
  Upload,
} from "lucide-react";
import { updateProfile, uploadProfileAvatar } from "@/lib/actions/profile";
import { completeFreelancerOnboarding } from "@/lib/actions/onboarding";
import { toast } from "sonner";
// import { LegalFooterLinks } from "@/components/legal-footer-links"; // hidden until legal pages are live

const STEP1_BULLETS = [
  {
    icon: Activity,
    text: "One timeline for milestones, uploads, and messages.",
  },
  {
    icon: Library,
    text: "Files and links together, with optional client approvals.",
  },
  {
    icon: MessageSquare,
    text: "Comments on each file so feedback sits next to the work.",
  },
  {
    icon: CreditCard,
    text: "Add your invoice link—clients pay from the same portal.",
  },
];

const ROLE_OPTIONS = [
  {
    id: "development_tech",
    title: "Development & Tech",
    description: "Software, web, mobile and integrations.",
    icon: Code2,
  },
  {
    id: "design_creative",
    title: "Design & Creative",
    description: "Brand, UI/UX, visual design, and creative production.",
    icon: Palette,
  },
  {
    id: "writing_content",
    title: "Writing & Content",
    description: "Copy, content strategy, editorial, and documentation.",
    icon: PenLine,
  },
  {
    id: "marketing_growth",
    title: "Marketing & Growth",
    description: "Campaigns, performance, SEO, and growth experiments.",
    icon: TrendingUp,
  },
  {
    id: "media_production",
    title: "Media & Production",
    description: "Video, audio, photography, and multimedia production.",
    icon: Video,
  },
];

const STEP_IMAGES = ["/images/library-screen.png", "/images/activity-screen.png"];

/**
 * @param {{ initialProfile: { name: string; email: string; phone: string; title: string; location: string; avatar?: string | null } }} props
 */
export function FreelancerOnboardingClient({ initialProfile }) {
  const router = useRouter();
  const avatarInputRef = useRef(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [animKey, setAnimKey] = useState(0);
  const [saving, setSaving] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(() => initialProfile.avatar ?? null);
  const [avatarUploading, setAvatarUploading] = useState(false);

  const [form, setForm] = useState(() => ({
    name: initialProfile.name ?? "",
    title: initialProfile.title ?? "",
  }));

  const [selectedRole, setSelectedRole] = useState(null);

  const goTo = (next) => {
    setCurrentStep(next);
    setAnimKey((k) => k + 1);
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be 5MB or smaller");
      return;
    }
    setAvatarUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    const result = await uploadProfileAvatar(formData);
    setAvatarUploading(false);
    if (!result.ok) {
      toast.error(result.error || "Could not upload photo");
      return;
    }
    if (result.publicUrl) {
      setAvatarUrl(result.publicUrl);
      toast.success("Photo updated");
      router.refresh();
    }
  };

  const handleNextFromStep2 = async () => {
    if (!form.name.trim()) {
      toast.error("Please add your name");
      return;
    }
    setSaving(true);
    const p = await updateProfile({
      fullName: form.name.trim(),
      phone: initialProfile.phone ?? "",
      title: form.title.trim(),
      location: initialProfile.location ?? "",
    });
    if (!p.ok) {
      setSaving(false);
      toast.error(p.error || "Could not save profile");
      return;
    }
    setSaving(false);
    toast.success("Profile saved");
    goTo(3);
  };

  const handleFinish = async () => {
    if (!selectedRole) {
      toast.error("Choose the option that fits you best");
      return;
    }
    setFinishing(true);
    const r = await completeFreelancerOnboarding(selectedRole);
    setFinishing(false);
    if (!r.ok) {
      toast.error(r.error || "Something went wrong");
      return;
    }
    toast.success("You're all set");
    router.replace("/projects");
    router.refresh();
  };

  const rightImage = STEP_IMAGES[Math.min(currentStep, STEP_IMAGES.length) - 1] ?? STEP_IMAGES[0];

  return (
    <div className="flex min-h-screen flex-col overflow-hidden bg-background">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
      <div className="flex flex-col w-full lg:w-[48%] min-h-0 px-8 py-10 sm:px-12 sm:py-14 lg:px-20 lg:py-20 justify-between overflow-y-auto">
        <div className="mb-10">
          <img
            src="/images/Logo-SVG.svg"
            alt="Mably"
            className="h-8 w-auto"
            draggable={false}
          />
        </div>

        <div
          key={animKey}
          className="flex-1 flex flex-col justify-center gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-xl"
        >
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => s < currentStep && goTo(s)}
                disabled={s > currentStep}
                aria-label={`Step ${s}`}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-400 focus:outline-none",
                  s === currentStep
                    ? "w-10 bg-primary"
                    : s < currentStep
                      ? "w-6 bg-primary/40 hover:bg-primary/60"
                      : "w-6 bg-muted-foreground/25"
                )}
              />
            ))}
          </div>

          {currentStep === 1 ? (
            <>
              <p className="text-xs sm:text-sm font-semibold uppercase tracking-widest text-primary">
                Welcome to Mably
              </p>
              <h1 className="text-3xl sm:text-4xl lg:text-[2.6rem] font-bold leading-tight tracking-tight text-foreground">
                Everything your clients need,{" "}
                <span className="italic text-primary">in one calm workspace.</span>
              </h1>
              <ul className="space-y-3">
                {STEP1_BULLETS.map(({ icon: Icon, text }) => (
                  <li key={text} className="flex items-start gap-3 text-sm sm:text-base text-foreground">
                    <span className="mt-1 flex-shrink-0 h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center">
                      <Icon className="h-3 w-3 text-primary" />
                    </span>
                    {text}
                  </li>
                ))}
              </ul>
            </>
          ) : null}

          {currentStep === 2 ? (
            <>
              <p className="text-xs sm:text-sm font-semibold uppercase tracking-widest text-primary">
                Your profile
              </p>
              <div className="space-y-2">
              <h1 className="text-3xl sm:text-4xl font-bold leading-tight tracking-tight text-foreground">
                How should clients see you?
              </h1>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Update anything now, you can always change it later
                in Settings.
              </p>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 max-w-md pb-2">
                <Avatar className="h-20 w-20 shrink-0 rounded-full border border-border bg-muted">
                  <AvatarImage src={avatarUrl || undefined} alt="" className="object-cover" />
                  <AvatarFallback className="text-xl font-medium">
                    {(form.name || initialProfile.name || "?").charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2 min-w-0">
                  <Label>Profile photo</Label>
                  <p className="text-xs text-muted-foreground">
                    JPEG, PNG, GIF, or WebP, up to 5MB.
                  </p>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp,.jpg,.jpeg,.png,.gif,.webp"
                    className="sr-only"
                    onChange={(ev) => void handleAvatarUpload(ev)}
                    disabled={avatarUploading || saving}
                    aria-label="Upload profile photo"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    disabled={avatarUploading || saving}
                    onClick={() => avatarInputRef.current?.click()}
                  >
                    <Upload className="h-4 w-4" />
                    {avatarUploading ? "Uploading…" : avatarUrl ? "Change photo" : "Add photo"}
                  </Button>
                </div>
              </div>
              <div className="space-y-4 max-w-md">
                <div className="space-y-2">
                  <Label htmlFor="ob-email">Email</Label>
                  <Input id="ob-email" value={initialProfile.email} disabled className="bg-muted/50" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ob-name">Full name</Label>
                  <Input
                    id="ob-name"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    autoComplete="name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ob-title">Title / role</Label>
                  <Input
                    id="ob-title"
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    placeholder="e.g. Brand designer"
                  />
                </div>
              </div>
            </>
          ) : null}

          {currentStep === 3 ? (
            <>
              <p className="text-xs sm:text-sm font-semibold uppercase tracking-widest text-primary">
                Quick survey
              </p>
              <h1 className="text-3xl sm:text-4xl font-bold leading-tight tracking-tight text-foreground">
                What best describes your work?
              </h1>
              <div className="grid grid-cols-1 gap-3 max-w-lg">
                {ROLE_OPTIONS.map(({ id, title, description, icon: Icon }) => {
                  const selected = selectedRole === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setSelectedRole(id)}
                      className={cn(
                        "relative flex gap-4 rounded-xl border-1 p-2.5 text-left transition-all",
                        "hover:border-primary/40 hover:bg-muted/30",
                        selected
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-border bg-card"
                      )}
                    >
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1 pt-0.5">
                        <p className="font-semibold text-foreground">{title}</p>
                        <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
                      </div>
                      <div
                        className={cn(
                          "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 mt-1",
                          selected ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/30"
                        )}
                      >
                        {selected ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : null}
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          ) : null}

          <div className="flex flex-wrap items-center gap-3 pt-2">
            {currentStep > 1 ? (
              <Button type="button" variant="outline" onClick={() => goTo(currentStep - 1)} className="gap-2">
                <ChevronLeft className="h-4 w-4" />
                Back
              </Button>
            ) : null}

            {currentStep === 1 ? (
              <Button type="button" onClick={() => goTo(2)} className="gap-1">
                Continue
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : null}

            {currentStep === 2 ? (
              <Button type="button" onClick={() => void handleNextFromStep2()} disabled={saving} className="gap-1">
                {saving ? "Saving…" : "Continue"}
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : null}

            {currentStep === 3 ? (
              <Button type="button" onClick={() => void handleFinish()} disabled={finishing} className="gap-1">
                {finishing ? "Finishing…" : "Go to my workspace"}
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : null}
          </div>
        </div>

      </div>

      <div
        className="hidden lg:flex flex-1 relative overflow-hidden min-h-[320px]"
        style={{
          background: "linear-gradient(140deg, #fff7f4 0%, #ffece4 40%, #ffd9c8 100%)",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent pointer-events-none" />

        {currentStep === 3 ? (
          <div
            key={`t-${animKey}`}
            className="relative z-10 flex h-full min-h-0 w-full flex-col bg-zinc-100 overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-700"
          >
            <div className="shrink-0 px-10 pt-12 pb-6 sm:px-12 md:px-14 xl:px-16 xl:pt-16 xl:pb-8">
              <div className="max-w-lg">
                <blockquote className="text-2xl sm:text-3xl xl:text-[1.75rem] font-semibold leading-snug tracking-tight text-foreground">
                A branded portal says the same thing as a sharp deck: you’ve got this under control.
                </blockquote>
                <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
                  <p className="text-sm text-muted-foreground">— Built for freelancers who care about client experience</p>
                </div>
              </div>
            </div>

            {/* Scaled mockup: anchored bottom-right, cropped by overflow (reference UI) */}
            <div className="relative w-full h-full min-h-0 overflow-hidden">
              <img
                src="/images/activity-screen.png"
                alt=""
                draggable={false}
                className="pointer-events-none select-none absolute top-0 right-0 object-cover object-left rounded-tl-2xl border border-zinc-200/90 bg-white shadow-[0_28px_90px_rgba(0,0,0,0.16)] ring-1 ring-black/[0.04]"
                style={{ height: "100%", width: "90%" }}
              />
            </div>
          </div>
        ) : (
          <div
            key={`img-${animKey}`}
            className="absolute inset-y-18 left-10 animate-in fade-in slide-in-from-bottom-6 duration-700"
          >
            <div className="h-full rounded-2xl overflow-hidden shadow-[0_24px_80px_rgba(0,0,0,0.15)] border border-white/60 bg-white">
              <img
                src={rightImage}
                alt=""
                className="h-full w-auto max-w-none object-left-top"
                draggable={false}
              />
            </div>
          </div>
        )}
      </div>
      </div>
      {/* <footer className="shrink-0 border-t border-border/50 bg-background/95 py-2 backdrop-blur-sm supports-[backdrop-filter]:bg-background/90">
        <LegalFooterLinks />
      </footer> */}
    </div>
  );
}
