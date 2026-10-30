import { listClientsForCurrentUser } from "@/lib/data/clients";
import { requireFreelancerAppProfile } from "@/lib/auth/freelancer-app-gate";
import { ClientsPageClient } from "./clients-page-client";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  // Listing seeds sample CRM contacts, so the access gate must pass first.
  await requireFreelancerAppProfile();
  const initialClients = await listClientsForCurrentUser();

  return <ClientsPageClient initialClients={initialClients} />;
}
