import { redirect } from "next/navigation";
import { Toaster } from "@/components/ui/sonner";
import { createClient } from "@/lib/supabase/server";
import { getProjectPortalBundle } from "@/lib/data/project-portal";
import {
  isDemoProjectId,
  getDemoProjectPortalBundle,
  resolveDemoFreelancerFromSupabase,
} from "@/lib/data/demo-project";
import { ProjectPortalShell } from "./project-portal-shell";

export default async function ProjectLayout({ children, params }) {
  const { projectId } = await params;

  if (isDemoProjectId(projectId)) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      redirect("/");
    }
    const freelancer = await resolveDemoFreelancerFromSupabase(supabase, user);
    const demoBundle = getDemoProjectPortalBundle(freelancer);
    return (
      <>
        <ProjectPortalShell bundle={demoBundle}>{children}</ProjectPortalShell>
        <Toaster />
      </>
    );
  }

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
