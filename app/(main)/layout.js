import { redirect } from "next/navigation";
import { MainAppShell } from "@/components/main-app-shell";
import { getCurrentUserProfile } from "@/lib/data/profile";
import { getFreelancerSubscriptionForUser } from "@/lib/data/billing";
import { hasPaidFreelancerSubscription } from "@/lib/billing/project-limits";

export const dynamic = "force-dynamic";

export default async function MainLayout({ children }) {
  const [user, subscription] = await Promise.all([
    getCurrentUserProfile(),
    getFreelancerSubscriptionForUser(),
  ]);

  if (!user) {
    redirect("/");
  }

  const hasSubscription = hasPaidFreelancerSubscription(subscription);

  return (
    <MainAppShell
      user={user}
      hasSubscription={hasSubscription}
      subscription={subscription}
    >
      {children}
    </MainAppShell>
  );
}
