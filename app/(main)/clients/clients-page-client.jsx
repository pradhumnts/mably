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
import { Plus, Search, Phone, MapPin, Clock, MoreVertical, ChevronLeft, ChevronRight, ArrowUpDown } from "lucide-react";
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
import { ClientDetailsDialog } from "@/components/client-details-dialog";
import { AddClientDialog } from "@/components/add-client-dialog";
import { deleteClient, getProjectsForClient } from "@/lib/actions/clients";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export function ClientsPageClient({ initialClients }) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedClient, setSelectedClient] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [clientProjects, setClientProjects] = useState([]);
  const [clientProjectsLoading, setClientProjectsLoading] = useState(false);
  const [clientFormOpen, setClientFormOpen] = useState(false);
  const [clientBeingEdited, setClientBeingEdited] = useState(null);
  const itemsPerPage = 10;

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
      const res = await getProjectsForClient(selectedClient.id);
      if (!cancelled) {
        setClientProjects(res.ok ? res.projects : []);
        setClientProjectsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [dialogOpen, selectedClient?.id]);

  const filteredClients = initialClients.filter((client) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      client.name.toLowerCase().includes(searchLower) ||
      client.email.toLowerCase().includes(searchLower) ||
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
    setClientBeingEdited(client);
    setClientFormOpen(true);
  };

  const handleDeleteClient = async (client) => {
    if (
      !window.confirm(
        `Delete ${client.name}? This cannot be undone.`
      )
    ) {
      return;
    }
    const result = await deleteClient(client.id);
    if (!result.ok) {
      toast.error(result.error || "Could not delete client");
      return;
    }
    toast.success("Client removed");
    if (selectedClient?.id === client.id) {
      setDialogOpen(false);
      setSelectedClient(null);
    }
    router.refresh();
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
                  <BreadcrumbLink href="/clients">Clients</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>All Clients</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <Button
              className="ml-auto flex items-center gap-1 font-semibold rounded-lg"
              onClick={openAddClient}
            >
              <Plus className="h-5 w-5 stroke-2" />
              <span className="hidden sm:inline">Add new client</span>
            </Button>
          </div>
        </header>

        <div className="flex-1">
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            {/* Search Bar */}
            <div className="mb-6">
              <div className="relative max-w-md">
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

            {/* Clients Table */}
            <div className="rounded-lg border bg-card">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent h-[48px]">
                    <TableHead className="w-[300px]">
                      <button className="flex items-center gap-2 font-medium text-muted-foreground hover:text-foreground">
                        Name
                        <ArrowUpDown className="h-4 w-4" />
                      </button>
                    </TableHead>
                    <TableHead>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        Phone
                      </div>
                    </TableHead>
                    <TableHead>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        Location
                      </div>
                    </TableHead>
                    <TableHead>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        Last Active
                      </div>
                    </TableHead>
                    <TableHead className="w-4"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentClients.length > 0 ? (
                    currentClients.map((client) => (
                    <TableRow
                      key={client.id}
                      className="group h-[68px] border-none hover:bg-zinc-100 cursor-pointer"
                      onClick={() => handleClientClick(client)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-[36px] w-[36px]">
                            <AvatarImage src={client.avatar || undefined} alt={client.name} />
                            <AvatarFallback>
                              {(client.name || "?").charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="font-medium">{client.name}</span>
                            <span className="text-sm text-muted-foreground">
                              {client.email}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-foreground">
                        {client.phone?.trim() ? client.phone : "—"}
                      </TableCell>
                      <TableCell className="text-foreground">
                        {client.location?.trim() ? client.location : "—"}
                      </TableCell>
                      <TableCell className="text-foreground">{client.lastActive}</TableCell>
                        <TableCell className="pr-4" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu className="w-full">
                            <DropdownMenuTrigger asChild className="border border-slate-200">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 p-0"
                                aria-label="Open client menu"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="border border-slate-200">
                              <DropdownMenuItem asChild>
                                <Link
                                  href={`/projects/new?clientId=${encodeURIComponent(client.id)}`}
                                  className="cursor-pointer"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  Start New Project
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleClientClick(client);
                                }}
                              >
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEditClient(client);
                                }}
                              >
                                Edit Client
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteClient(client);
                                }}
                              >
                                Delete Client
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                    </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        <p className="text-muted-foreground">No clients found.</p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {filteredClients.length > 0 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredClients.length)} of{" "}
                  {filteredClients.length} clients
                </p>
                <div className="flex items-center gap-2">
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
      />
    </>
  );
}

