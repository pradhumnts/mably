import { redirect } from "next/navigation";
import { MainAppShell } from "@/components/main-app-shell";
import { getCurrentUserProfile } from "@/lib/data/profile";

export const dynamic = "force-dynamic";

export default async function MainLayout({ children }) {
  const user = await getCurrentUserProfile();

  if (!user) {
    redirect("/");
  }

  return <MainAppShell user={user}>{children}</MainAppShell>;
}
