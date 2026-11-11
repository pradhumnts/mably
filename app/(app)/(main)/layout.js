import { MainAppShell } from "@/components/main-app-shell";
import { PresenceHeartbeat } from "@/components/presence-heartbeat";
import { requireFreelancerAppProfile } from "@/lib/auth/freelancer-app-gate";
import { getFreelancerSubscriptionForUser } from "@/lib/data/billing";
import { hasPaidFreelancerSubscription } from "@/lib/billing/project-limits";
import {
  getActiveWorkspaceForCurrentUser,
  listWorkspacesForCurrentUser,
} from "@/lib/data/workspaces";

export const dynamic = "force-dynamic";

export default async function MainLayout({ children }) {
  const [user, subscription, workspaces, active] = await Promise.all([
    requireFreelancerAppProfile(),
    getFreelancerSubscriptionForUser(),
    listWorkspacesForCurrentUser(),
    getActiveWorkspaceForCurrentUser(),
  ]);

  const hasSubscription = hasPaidFreelancerSubscription(subscription);

  return (
    <MainAppShell
      user={user}
      hasSubscription={hasSubscription}
      subscription={subscription}
      workspaces={workspaces}
      activeWorkspaceId={active?.workspaceId ?? null}
    >
      <PresenceHeartbeat />
      {children}
    </MainAppShell>
  );
}
