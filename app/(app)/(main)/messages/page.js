import { listMyProjectConversations } from "@/lib/actions/project-chat";
import { MessagesInbox } from "@/components/messages/messages-inbox";

export const dynamic = "force-dynamic";

/**
 * @param {{ searchParams: Promise<{ projectId?: string }> }} props
 */
export default async function MessagesPage({ searchParams }) {
  const params = await searchParams;
  const result = await listMyProjectConversations();
  const conversations = result.ok ? result.conversations : [];
  const initialProjectId =
    typeof params?.projectId === "string" && params.projectId.trim()
      ? params.projectId.trim()
      : null;

  return (
    <MessagesInbox
      initialConversations={conversations}
      initialProjectId={initialProjectId}
    />
  );
}
