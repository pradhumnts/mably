import { redirect } from "next/navigation";

/** Notifications open from the sidebar flyout — no standalone page. */
export default function NotificationsPage() {
  redirect("/projects");
}
