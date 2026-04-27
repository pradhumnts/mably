import { redirect } from "next/navigation";
import { getCurrentUserProfile } from "@/lib/data/profile";
import { getFreelancerSubscriptionForUser } from "@/lib/data/billing";
import { BillingPageClient } from "@/components/billing/billing-page-client";
import {
  getPaddleEnvironment,
  getPaddlePriceGrowth,
  getPaddlePriceStarter,
} from "@/lib/billing/paddle-env";

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

  return (
    <BillingPageClient
      userId={profile.id}
      email={profile.email}
      paddleEnvironment={getPaddleEnvironment()}
      starterPriceId={getPaddlePriceStarter()}
      growthPriceId={getPaddlePriceGrowth()}
      initialSubscription={subscription}
    />
  );
}
