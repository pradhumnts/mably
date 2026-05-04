import { redirect } from "next/navigation";
import { getCurrentUserProfile } from "@/lib/data/profile";
import { getFreelancerSubscriptionForUser } from "@/lib/data/billing";
import { SettingsPageClient } from "./settings-page-client";
import {
  getPolarAccessToken,
  getPolarProductGrowth,
  getPolarProductStarter,
} from "@/lib/billing/polar-env";
import { reconcilePolarSubscriptionForUser } from "@/lib/billing/reconcile-polar-subscription";

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
  let canReconcile = false;

  if (isFreelancer) {
    canReconcile = Boolean(token);
    polarConfigured = Boolean(token && starter && growth);
    if (token) {
      await reconcilePolarSubscriptionForUser(profile.id);
    }
    subscription = await getFreelancerSubscriptionForUser();
  }

  const initialTab =
    isFreelancer && sp?.tab === "subscription" ? "subscription" : "profile";

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
              canReconcile,
            }
          : null
      }
    />
  );
}
