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
  // Legacy invite emails used ?acceptInvite= on Settings → Team; send them to the
  // dedicated accept route so accept runs server-side without relying on tab mount.
  const legacyAccept =
    typeof sp?.acceptInvite === "string" ? sp.acceptInvite.trim() : "";
  if (legacyAccept) {
    redirect(`/invite/workspace/${legacyAccept}`);
  }

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

  const allowedTabs = new Set([
    "profile",
    "subscription",
    "branding",
    "notifications",
    "calendar",
    "portal",
    "members",
  ]);
  const requested = typeof sp?.tab === "string" ? sp.tab : "profile";
  const initialTab =
    isFreelancer && allowedTabs.has(requested) ? requested : "profile";

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
        defaultBrandColor: profile.defaultBrandColor,
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
