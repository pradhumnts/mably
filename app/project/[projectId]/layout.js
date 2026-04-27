import { redirect } from "next/navigation";
import { Toaster } from "@/components/ui/sonner";
import { createClient } from "@/lib/supabase/server";
import { getProjectPortalBundle } from "@/lib/data/project-portal";
import { ProjectPortalShell } from "./project-portal-shell";

export default async function ProjectLayout({ children, params }) {
  const { projectId } = await params;
  const bundle = await getProjectPortalBundle(projectId);

  if (!bundle) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    redirect(user ? "/projects" : "/");
  }

  return (
    <>
      <ProjectPortalShell bundle={bundle}>{children}</ProjectPortalShell>
      <Toaster />
    </>
  );
}
