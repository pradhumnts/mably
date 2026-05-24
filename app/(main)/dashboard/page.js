import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/** Dashboard is coming soon — send freelancers to Projects. */
export default function DashboardPage() {
  redirect("/projects");
}
