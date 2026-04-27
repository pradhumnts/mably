"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { usePortalProject } from "../project-portal-shell";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DollarSign,
  MoreVertical,
  ArrowUpDown,
  Link as LinkIcon,
  ChevronLeft,
  ChevronRight,
  Search,
  FileX,
  ExternalLink,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { CreateInvoiceDialog } from "@/components/create-invoice-dialog";
import { DeleteProjectInvoiceDialog } from "@/components/delete-project-invoice-dialog";
import { toast } from "sonner";
import { listProjectInvoices, updateProjectInvoiceStatus } from "@/lib/actions/project-invoices";

const ITEMS_PER_PAGE = 10;

function invoiceDisplayId(id) {
  const compact = String(id).replace(/-/g, "");
  return `#${compact.slice(0, 8).toUpperCase()}`;
}

function formatDue(iso) {
  if (!iso || typeof iso !== "string") return "—";
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return iso;
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function statusUi(db) {
  if (db === "paid") return "Paid";
  if (db === "canceled") return "Canceled";
  return "Unpaid";
}

function getStatusBadge(statusLabel) {
  const colors = {
    Paid: "bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-950 dark:text-green-200",
    Canceled: "bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-950 dark:text-red-200",
    Unpaid: "bg-purple-100 text-purple-700 hover:bg-purple-100 dark:bg-purple-950 dark:text-purple-200",
  };

  return <Badge className={colors[statusLabel] || ""}>{statusLabel}</Badge>;
}

export default function ProjectPayments() {
  const params = useParams();
  const projectId = params.projectId;
  const { sidebar, meta } = usePortalProject();
  const isFreelancer = Boolean(meta?.isFreelancer);

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [createInvoiceDialogOpen, setCreateInvoiceDialogOpen] = useState(false);
  const [deleteInvoiceTarget, setDeleteInvoiceTarget] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const load = useCallback(async () => {
    setLoading(true);
    const r = await listProjectInvoices(String(projectId));
    setLoading(false);
    if (!r.ok) {
      toast.error(r.error || "Could not load invoices");
      setRows([]);
      return;
    }
    setRows(r.rows);
  }, [projectId]);

  useEffect(() => {
    void load();
  }, [load]);

  const tableRows = useMemo(() => {
    return rows.map((row) => ({
      ...row,
      invoiceNo: invoiceDisplayId(row.id),
      statusLabel: statusUi(row.status),
      dueLabel: formatDue(row.dueDate),
      subtitle:
        (row.notes && String(row.notes).trim()) ||
        sidebar?.clientEmail ||
        "—",
    }));
  }, [rows, sidebar?.clientEmail]);

  const filteredInvoices = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return tableRows.filter((invoice) => {
      const matchesSearch =
        !q ||
        invoice.invoiceNo.toLowerCase().includes(q) ||
        (sidebar?.projectName && sidebar.projectName.toLowerCase().includes(q)) ||
        (sidebar?.clientName && sidebar.clientName.toLowerCase().includes(q)) ||
        (sidebar?.clientEmail && sidebar.clientEmail.toLowerCase().includes(q)) ||
        String(invoice.amount).includes(q) ||
        (invoice.notes && invoice.notes.toLowerCase().includes(q)) ||
        invoice.invoiceLink.toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === "all" || invoice.statusLabel === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [tableRows, searchQuery, statusFilter, sidebar]);

  const totalPages = Math.max(1, Math.ceil(filteredInvoices.length / ITEMS_PER_PAGE));

  useEffect(() => {
    setCurrentPage((p) => {
      const tp = Math.max(1, Math.ceil(filteredInvoices.length / ITEMS_PER_PAGE));
      return p > tp ? tp : p;
    });
  }, [filteredInvoices.length]);

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentInvoices = filteredInvoices.slice(startIndex, endIndex);

  const handlePrevious = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNext = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const handleCopyInvoiceLink = async (invoiceLink) => {
    try {
      await navigator.clipboard.writeText(invoiceLink);
      toast.success("Invoice link copied");
    } catch {
      toast.error("Could not copy link");
    }
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleStatusFilter = (value) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const handleMarkPaid = async (id) => {
    const r = await updateProjectInvoiceStatus(String(projectId), id, "paid");
    if (!r.ok) {
      toast.error(r.error || "Could not update");
      return;
    }
    toast.success("Marked as paid");
    void load();
  };

  const handleMarkUnpaid = async (id) => {
    const r = await updateProjectInvoiceStatus(String(projectId), id, "unpaid");
    if (!r.ok) {
      toast.error(r.error || "Could not update");
      return;
    }
    toast.success("Marked as unpaid");
    void load();
  };

  const handleMarkCanceled = async (id) => {
    const r = await updateProjectInvoiceStatus(String(projectId), id, "canceled");
    if (!r.ok) {
      toast.error(r.error || "Could not update");
      return;
    }
    toast.success("Invoice canceled");
    void load();
  };

  const openDeleteInvoice = (invoice) => {
    const amountLabel = `$${invoice.amount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
    setDeleteInvoiceTarget({
      id: invoice.id,
      invoiceNo: invoice.invoiceNo,
      amountLabel,
    });
  };

  const subtitlePreview = (text) => {
    const t = typeof text === "string" ? text.trim() : "";
    if (!t || t === "—") return "—";
    return t.length > 72 ? `${t.slice(0, 72)}…` : t;
  };

  return (
    <>
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="flex h-16 items-center gap-2 px-4 sm:px-6 lg:px-8 max-w-[1600px] mx-auto">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="h-4 my-auto mr-2" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href={`/project/${projectId}/dashboard`}>Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Payments</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          {isFreelancer ? (
            <Button
              className="ml-auto flex items-center gap-1 font-semibold rounded-lg"
              onClick={() => setCreateInvoiceDialogOpen(true)}
            >
              <DollarSign className="h-5 w-5 stroke-2" />
              <span className="hidden sm:inline">Add invoice</span>
            </Button>
          ) : null}
        </div>
      </header>

      <div className="flex-1">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search invoices…"
                value={searchQuery}
                onChange={handleSearch}
                className="pl-9 h-10"
                disabled={loading}
              />
            </div>

            <Select value={statusFilter} onValueChange={handleStatusFilter} disabled={loading}>
              <SelectTrigger className="w-[180px] h-10">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="Paid">Paid</SelectItem>
                <SelectItem value="Unpaid">Unpaid</SelectItem>
                <SelectItem value="Canceled">Canceled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent h-[48px]">
                  <TableHead className="w-[120px]">
                    <span className="flex items-center gap-2 font-medium text-muted-foreground">
                      Invoice no.
                      <ArrowUpDown className="h-4 w-4 opacity-50" />
                    </span>
                  </TableHead>
                  <TableHead className="min-w-[240px]">
                    <span className="text-muted-foreground">Details</span>
                  </TableHead>
                  <TableHead>
                    <span className="text-muted-foreground">Amount</span>
                  </TableHead>
                  <TableHead>
                    <span className="text-muted-foreground">Due</span>
                  </TableHead>
                  <TableHead>
                    <span className="text-muted-foreground">Status</span>
                  </TableHead>
                  <TableHead className="w-[88px]">
                    <span className="sr-only">Link</span>
                  </TableHead>
                  {isFreelancer ? <TableHead className="w-10" /> : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={isFreelancer ? 7 : 6} className="py-16 text-center text-muted-foreground">
                      Loading invoices…
                    </TableCell>
                  </TableRow>
                ) : currentInvoices.length > 0 ? (
                  currentInvoices.map((invoice) => (
                    <TableRow key={invoice.id} className="group h-[68px] border-none hover:bg-muted/60">
                      <TableCell className="font-medium font-mono text-sm">{invoice.invoiceNo}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar className="h-9 w-9 shrink-0">
                            <AvatarImage src={sidebar?.clientAvatar || undefined} alt={sidebar?.clientName || ""} />
                            <AvatarFallback>{(sidebar?.clientName || "C").charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col min-w-0">
                            <span className="font-medium truncate">{sidebar?.projectName || "Project"}</span>
                            <span className="text-sm text-muted-foreground truncate">
                              {subtitlePreview(invoice.subtitle)}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium whitespace-nowrap">
                        $
                        {invoice.amount.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </TableCell>
                      <TableCell className="text-foreground whitespace-nowrap">{invoice.dueLabel}</TableCell>
                      <TableCell>{getStatusBadge(invoice.statusLabel)}</TableCell>
                      <TableCell className="pr-0">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0 border border-border"
                            type="button"
                            aria-label="Copy invoice link"
                            onClick={() => void handleCopyInvoiceLink(invoice.invoiceLink)}
                          >
                            <LinkIcon className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0 border border-border"
                            type="button"
                            aria-label="Open invoice in new tab"
                            onClick={() => window.open(invoice.invoiceLink, "_blank", "noopener,noreferrer")}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                      {isFreelancer ? (
                        <TableCell className="pr-4">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 p-0 border border-border"
                                type="button"
                                aria-label="Invoice actions"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="border border-border">
                              {invoice.status === "unpaid" ? (
                                <DropdownMenuItem onClick={() => void handleMarkPaid(invoice.id)}>
                                  Mark as paid
                                </DropdownMenuItem>
                              ) : null}
                              {invoice.status === "paid" ? (
                                <DropdownMenuItem onClick={() => void handleMarkUnpaid(invoice.id)}>
                                  Mark as unpaid
                                </DropdownMenuItem>
                              ) : null}
                              {invoice.status !== "canceled" ? (
                                <DropdownMenuItem onClick={() => void handleMarkCanceled(invoice.id)}>
                                  Cancel invoice
                                </DropdownMenuItem>
                              ) : null}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => openDeleteInvoice(invoice)}
                              >
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      ) : null}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={isFreelancer ? 7 : 6} className="py-12">
                      <div className="flex flex-col items-center justify-center px-4 text-center">
                        <div className="rounded-full bg-muted p-6 mb-4">
                          <FileX className="h-12 w-12 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">No invoices found</h3>
                        <p className="text-muted-foreground max-w-sm mb-4">
                          {searchQuery
                            ? `Nothing matches "${searchQuery}". Try another search or filter.`
                            : statusFilter !== "all"
                              ? "No rows match this status. Try another filter."
                              : isFreelancer
                                ? "Add an external invoice link so your client always knows where to pay."
                                : "Your freelancer has not added any invoice links yet."}
                        </p>
                        {(searchQuery || statusFilter !== "all") && (
                          <Button
                            variant="outline"
                            type="button"
                            onClick={() => {
                              setSearchQuery("");
                              setStatusFilter("all");
                            }}
                          >
                            Clear filters
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {!loading && filteredInvoices.length > 0 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Showing {startIndex + 1} to {Math.min(endIndex, filteredInvoices.length)} of{" "}
                {filteredInvoices.length} invoice{filteredInvoices.length !== 1 ? "s" : ""}
              </p>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" type="button" onClick={handlePrevious} disabled={currentPage === 1}>
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <div className="text-sm font-medium">
                  Page {currentPage} of {totalPages}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  onClick={handleNext}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {isFreelancer ? (
        <>
          <CreateInvoiceDialog
            open={createInvoiceDialogOpen}
            onOpenChange={setCreateInvoiceDialogOpen}
            projectId={String(projectId)}
            projectData={sidebar}
            onCreated={() => void load()}
          />
          <DeleteProjectInvoiceDialog
            open={Boolean(deleteInvoiceTarget)}
            onOpenChange={(open) => {
              if (!open) setDeleteInvoiceTarget(null);
            }}
            projectId={String(projectId)}
            item={deleteInvoiceTarget}
            onDeleted={() => void load()}
          />
        </>
      ) : null}
    </>
  );
}
