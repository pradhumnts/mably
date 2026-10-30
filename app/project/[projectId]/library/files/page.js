import {
  getLibraryStorageUsageForProject,
  listLibraryFiles,
} from "@/lib/actions/project-library";
import LibraryFiles from "./files-page-client";

export default async function LibraryFilesPage({ params }) {
  const { projectId } = await params;
  const [files, usage] = await Promise.all([
    listLibraryFiles(String(projectId)),
    getLibraryStorageUsageForProject(String(projectId)),
  ]);
  return <LibraryFiles initialData={{ files, usage }} />;
}
