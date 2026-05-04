import { listClientsForCurrentUser } from "@/lib/data/clients";
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

  const initialClients = await listClientsForCurrentUser();
  const initialClientId =
    fromQuery && initialClients.some((c) => c.id === fromQuery) ? fromQuery : "";

  const createProjectBlockReason = await getCreateProjectStep5BlockReason();

  return (
    <CreateProjectPageClient
      initialClients={initialClients}
      initialClientId={initialClientId}
      createProjectBlockReason={createProjectBlockReason}
    />
  );
}
