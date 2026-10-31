"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

/**
 * Surfaces invite accept success/error from dedicated `/invite/workspace/...` redirects.
 */
export function WorkspaceInviteFlash() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const accepted = searchParams.get("inviteAccepted");
    const error = searchParams.get("inviteError");
    if (!accepted && !error) return;

    if (accepted) {
      toast.success("Joined workspace");
    } else if (error) {
      toast.error(error);
    }

    const next = new URLSearchParams(searchParams.toString());
    next.delete("inviteAccepted");
    next.delete("inviteError");
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [searchParams, pathname, router]);

  return null;
}
