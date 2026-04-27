import { redirect } from "next/navigation";
import { getCurrentUserProfile } from "@/lib/data/profile";
import { FreelancerOnboardingClient } from "./onboarding-client";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const profile = await getCurrentUserProfile();
  if (!profile) {
    redirect("/");
  }
  if (profile.role === "client") {
    redirect("/projects");
  }
  if (profile.onboardingCompletedAt) {
    redirect("/projects");
  }

  return (
    <FreelancerOnboardingClient
      initialProfile={{
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
        title: profile.title,
        location: profile.location,
        avatar: profile.avatar ?? null,
      }}
    />
  );
}
