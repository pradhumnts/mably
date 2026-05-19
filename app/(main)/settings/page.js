import { redirect } from "next/navigation";
import { getCurrentUserProfile } from "@/lib/data/profile";
import { getFreelancerSubscriptionForUser } from "@/lib/data/billing";
import { SettingsPageClient } from "./settings-page-client";
import { getFoundingPricingState } from "@/lib/billing/founding-pricing";
import {
  getPolarAccessToken,
  getPolarProductGrowth,
  getPolarProductStarter,
} from "@/lib/billing/polar-env";
export const metadata = {
  title: "Settings · Mably",
  description: "Account and workspace settings",
};

export default async function SettingsPage({ searchParams }) {
  const sp = await searchParams;
  const profile = await getCurrentUserProfile();
  if (!profile) {
    redirect("/");
  }

  const isFreelancer = profile.role !== "client";
  const token = getPolarAccessToken();
  const starter = getPolarProductStarter();
  const growth = getPolarProductGrowth();

  let subscription = null;
  let polarConfigured = false;
  let autoSyncFromPolar = false;

  if (isFreelancer) {
    autoSyncFromPolar = Boolean(token);
    polarConfigured = Boolean(token && starter && growth);
    subscription = await getFreelancerSubscriptionForUser();
  }

  const initialTab =
    isFreelancer && sp?.tab === "subscription" ? "subscription" : "profile";

  const foundingPricing = isFreelancer ? await getFoundingPricingState() : null;
  const preferFoundingCheckout =
    isFreelancer && (sp?.early === "1" || sp?.early === "true");
  const checkoutPlan =
    sp?.plan === "starter" || sp?.plan === "growth" ? sp.plan : null;

  return (
    <SettingsPageClient
      initialProfile={{
        name: profile.name,
        email: profile.email,
        avatar: profile.avatar,
        phone: profile.phone,
        title: profile.title,
        location: profile.location,
        calendarLink: profile.calendarLink,
        notificationPreferences: profile.notificationPreferences,
        role: profile.role,
      }}
      initialTab={initialTab}
      billing={
        isFreelancer
          ? {
              polarConfigured,
              initialSubscription: subscription,
              autoSyncFromPolar,
              foundingPricing,
              preferFoundingCheckout,
              checkoutPlan,
            }
          : null
      }
    />
  );
}
