import { SidebarShellSkeleton } from "@/components/app-page-skeleton";

/** Sits above the `(main)` layout so entering the app from a portal shows the shell immediately. */
export default function Loading() {
  return <SidebarShellSkeleton />;
}
