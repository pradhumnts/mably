import { getFoundingPricingState } from "@/lib/billing/founding-pricing";
import {
  getPolarAccessToken,
  getPolarProductGrowth,
  getPolarProductStarter,
} from "@/lib/billing/polar-env";
import { getFreelancerSubscriptionForUser } from "@/lib/data/billing";
import { listClientsForCurrentUser } from "@/lib/data/clients";
import { getCurrentUserProfile } from "@/lib/data/profile";
import { DEFAULT_BRAND_COLOR_HEX } from "@/components/brand-color-field";
import { getCreateProjectStep5BlockReason } from "@/lib/data/project-creation-gate";
import { CreateProjectPageClient } from "./create-project-page-client";

export const dynamic = "force-dynamic";

export default async function CreateProjectPage(props) {
  const searchParams = await props.searchParams;
  const raw = searchParams?.clientId;
  const fromQuery =
    typeof raw === "string"
      ? raw.trim()
      : Array.isArray(raw)
        ? (raw[0] ?? "").trim()
        : "";

  const initialClients = await listClientsForCurrentUser({
    seedSamples: false,
    includeSamples: false,
    includePortalPeople: false,
  });
  const initialClientId =
    fromQuery && initialClients.some((c) => c.id === fromQuery) ? fromQuery : "";

  const createProjectBlockReason = await getCreateProjectStep5BlockReason();

  const token = getPolarAccessToken();
  const polarConfigured = Boolean(
    token && getPolarProductStarter() && getPolarProductGrowth()
  );
  const [foundingPricing, subscription, profile] = await Promise.all([
    getFoundingPricingState(),
    getFreelancerSubscriptionForUser(),
    getCurrentUserProfile(),
  ]);

  const defaultBrandColor =
    profile?.defaultBrandColor ?? DEFAULT_BRAND_COLOR_HEX;

  return (
    <CreateProjectPageClient
      initialClients={initialClients}
      initialClientId={initialClientId}
      defaultBrandColor={defaultBrandColor}
      createProjectBlockReason={createProjectBlockReason}
      polarConfigured={polarConfigured}
      foundingPricing={foundingPricing}
      currentPlanKey={subscription?.plan_key ?? null}
    />
  );
}
