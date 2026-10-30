"use client";

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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { ClientsListViews } from "@/components/clients/clients-list-views";
import {
  stickyPageHeaderClass,
  stickyPageHeaderInnerClass,
  pageContentWrapClass,
} from "@/lib/ui/page-chrome";
import { ClientDetailsDialog } from "@/components/client-details-dialog";
import { AddClientDialog } from "@/components/add-client-dialog";
import { DeleteClientDialog } from "@/components/delete-client-dialog";
import { getProjectsForClient } from "@/lib/actions/clients";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function ClientsPageClient({ initialClients }) {
  const router = useRouter();
  const [clients, setClients] = useState(() => initialClients ?? []);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedClient, setSelectedClient] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [clientProjects, setClientProjects] = useState([]);
  const [clientProjectsLoading, setClientProjectsLoading] = useState(false);
  const [clientFormOpen, setClientFormOpen] = useState(false);
  const [clientBeingEdited, setClientBeingEdited] = useState(null);
  const [clientPendingDeletion, setClientPendingDeletion] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const itemsPerPage = 10;

  useEffect(() => {
    setClients(initialClients ?? []);
  }, [initialClients]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  useEffect(() => {
    if (!dialogOpen || !selectedClient?.id) {
      setClientProjects([]);
      setClientProjectsLoading(false);
      return;
    }

    let cancelled = false;
    setClientProjectsLoading(true);
    (async () => {
      const res = await getProjectsForClient(selectedClient.id, {
        portalProjectIds: selectedClient.portalProjectIds ?? [],
      });
      if (!cancelled) {
        setClientProjects(res.ok ? res.projects : []);
        setClientProjectsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [dialogOpen, selectedClient]);

  const filteredClients = clients.filter((client) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      (client.name || "").toLowerCase().includes(searchLower) ||
      (client.email || "").toLowerCase().includes(searchLower) ||
      (client.location || "").toLowerCase().includes(searchLower) ||
      (client.phone || "").includes(searchQuery)
    );
  });

  useEffect(() => {
    const pages = Math.max(1, Math.ceil(filteredClients.length / itemsPerPage));
    if (currentPage > pages) setCurrentPage(pages);
  }, [filteredClients.length, currentPage]);

  const totalPages = Math.max(1, Math.ceil(filteredClients.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentClients = filteredClients.slice(startIndex, endIndex);

  // Handle page changes
  const handlePrevious = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNext = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleClientClick = (client) => {
    setSelectedClient(client);
    setDialogOpen(true);
  };

  const openAddClient = () => {
    setClientBeingEdited(null);
    setClientFormOpen(true);
  };

  const openEditClient = (client) => {
    if (client?.isPortalOnly) return;
    setClientBeingEdited(client);
    setClientFormOpen(true);
  };

  const requestDeleteClient = (client) => {
    if (client?.isPortalOnly) return;
    setClientPendingDeletion(client);
    setDeleteDialogOpen(true);
  };

  const handleClientDeleted = () => {
    if (clientPendingDeletion && selectedClient?.id === clientPendingDeletion.id) {
      setDialogOpen(false);
      setSelectedClient(null);
    }
    setClientPendingDeletion(null);
    router.refresh();
  };

  return (
    <>
        <header className={stickyPageHeaderClass}>
          <div className={stickyPageHeaderInnerClass}>
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden sm:block">
                  <BreadcrumbLink href="/clients">Clients</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden sm:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>All Clients</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <Button
              size="sm"
              className="ml-auto shrink-0 gap-1 rounded-lg font-semibold sm:size-default"
              onClick={openAddClient}
            >
              <Plus className="h-4 w-4 stroke-2 sm:h-5 sm:w-5" />
              <span className="sm:hidden">Add</span>
              <span className="hidden sm:inline">Add new client</span>
            </Button>
          </div>
        </header>

        <div className="flex-1">
          <div className={pageContentWrapClass}>
            {/* Search Bar */}
            <div className="mb-6">
              <div className="relative w-full max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={handleSearch}
                  className="pl-9 h-11"
                />
              </div>
            </div>

            <ClientsListViews
              clients={currentClients}
              onClientClick={handleClientClick}
              onEditClient={openEditClient}
              onRequestDelete={requestDeleteClient}
            />

            {/* Pagination */}
            {filteredClients.length > 0 && (
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredClients.length)} of{" "}
                  {filteredClients.length} clients
                </p>
                <div className="flex items-center justify-between gap-2 sm:justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handlePrevious}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  <div className="text-sm font-medium">
                    Page {currentPage} of {totalPages}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
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

      {/* Client Details Dialog */}
      <ClientDetailsDialog
        client={selectedClient}
        projects={clientProjects}
        projectsLoading={clientProjectsLoading}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />

      <AddClientDialog
        open={clientFormOpen}
        onOpenChange={(open) => {
          setClientFormOpen(open);
          if (!open) setClientBeingEdited(null);
        }}
        client={clientBeingEdited}
        onSaved={() => router.refresh()}
        existingClients={clients}
      />

      <DeleteClientDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open) setClientPendingDeletion(null);
        }}
        client={clientPendingDeletion}
        onDeleted={handleClientDeleted}
      />

    </>
  );
}

