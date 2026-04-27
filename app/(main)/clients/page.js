import { listClientsForCurrentUser } from "@/lib/data/clients";
import { ClientsPageClient } from "./clients-page-client";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const initialClients = await listClientsForCurrentUser();

  return <ClientsPageClient initialClients={initialClients} />;
}
