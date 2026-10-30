import { listProjectInvoices } from "@/lib/actions/project-invoices";
import ProjectPayments from "./payments-page-client";

export default async function ProjectPaymentsPage({ params }) {
  const { projectId } = await params;
  const initialData = await listProjectInvoices(String(projectId));
  return <ProjectPayments initialData={initialData} />;
}
