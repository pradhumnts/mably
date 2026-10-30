import { listLibraryLinks } from "@/lib/actions/project-library";
import LibraryLinks from "./links-page-client";

export default async function LibraryLinksPage({ params }) {
  const { projectId } = await params;
  const initialData = await listLibraryLinks(String(projectId));
  return <LibraryLinks initialData={initialData} />;
}
