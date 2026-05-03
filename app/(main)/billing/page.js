import { redirect } from "next/navigation";
import { getCurrentUserProfile } from "@/lib/data/profile";
import { getFreelancerSubscriptionForUser } from "@/lib/data/billing";
import { BillingPageClient } from "@/components/billing/billing-page-client";
import {
  getPolarAccessToken,
  getPolarProductGrowth,
  getPolarProductStarter,
} from "@/lib/billing/polar-env";

export const metadata = {
  title: "Billing · Mably",
  description: "Manage your Mably subscription",
};

export default async function BillingPage() {
  const profile = await getCurrentUserProfile();
  if (!profile) redirect("/");

  if (profile.role === "client") {
    redirect("/projects");
  }

  const subscription = await getFreelancerSubscriptionForUser();
  const token = getPolarAccessToken();
  const starter = getPolarProductStarter();
  const growth = getPolarProductGrowth();

  return (
    <BillingPageClient
      polarConfigured={Boolean(token && starter && growth)}
      initialSubscription={subscription}
    />
  );
}
