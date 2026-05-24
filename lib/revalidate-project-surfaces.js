import { revalidatePath } from "next/cache";

/** Server-only helper (import from Server Actions / RSC only). */
export function revalidateProjectSurfaces(projectId) {
  revalidatePath("/dashboard");
  revalidatePath("/notifications");
  revalidatePath("/projects");
  revalidatePath("/projects/new");
  if (projectId) {
    revalidatePath(`/project/${projectId}`);
    revalidatePath(`/project/${projectId}/dashboard`);
    revalidatePath(`/project/${projectId}/settings`);
    revalidatePath(`/project/${projectId}/payments`);
    revalidatePath(`/project/${projectId}/library/files`);
    revalidatePath(`/project/${projectId}/library/links`);
    revalidatePath(`/project/${projectId}/activity`);
  }
}
