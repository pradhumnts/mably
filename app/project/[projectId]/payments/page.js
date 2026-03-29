"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { ProjectLayoutWrapper } from "../project-layout-wrapper";
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
import { Plus, MoreVertical, ArrowUpDown, DollarSign, Link as LinkIcon, ChevronLeft, ChevronRight, Search, FileX } from "lucide-react";
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
import { toast } from "sonner";

// Dummy invoices data
const dummyInvoices = [
  {
    id: 1,
    invoiceNo: "#25-043",
    projectName: "Social Waves Media Website Design...",
    clientName: "Sophie James",
    clientEmail: "shophie@arcmetals.co",
    clientAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
    amount: 1625.00,
    dueDate: "Mar 4 2025",
    status: "Paid",
    invoiceLink: "https://stripe.com/invoice/inv_1234567890",
  },
  {
    id: 2,
    invoiceNo: "#25-038",
    projectName: "E-Commerce Platform Development",
    clientName: "Michael Chen",
    clientEmail: "michael@techcorp.com",
    clientAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150",
    amount: 3850.00,
    dueDate: "Mar 15 2025",
    status: "Unpaid",
    invoiceLink: "https://contra.com/invoice/con_9876543210",
  },
  {
    id: 3,
    invoiceNo: "#25-029",
    projectName: "Mobile Banking App UI/UX",
    clientName: "Emma Wilson",
    clientEmail: "emma@banktech.io",
    clientAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150",
    amount: 5200.00,
    dueDate: "Feb 28 2025",
    status: "Canceled",
    invoiceLink: "https://upwork.com/invoice/up_1122334455",
  },
  {
    id: 4,
    invoiceNo: "#25-051",
    projectName: "Real Estate Portal - Phase 2",
    clientName: "Lisa Anderson",
    clientEmail: "lisa@realestate.com",
    clientAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
    amount: 2900.00,
    dueDate: "Mar 20 2025",
    status: "Paid",
    invoiceLink: "https://stripe.com/invoice/inv_5544332211",
  },
  {
    id: 5,
    invoiceNo: "#25-019",
    projectName: "Healthcare Dashboard Analytics",
    clientName: "David Park",
    clientEmail: "david@healthcare.co",
    clientAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
    amount: 4100.00,
    dueDate: "Feb 10 2025",
    status: "Paid",
    invoiceLink: "https://contra.com/invoice/con_7788990011",
  },
  {
    id: 6,
    invoiceNo: "#25-055",
    projectName: "Fitness Tracker Mobile App",
    clientName: "James Smith",
    clientEmail: "james@fitness.io",
    clientAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
    amount: 1800.00,
    dueDate: "Mar 25 2025",
    status: "Unpaid",
    invoiceLink: "https://upwork.com/invoice/up_4455667788",
  },
  {
    id: 7,
    invoiceNo: "#25-012",
    projectName: "Corporate Website Redesign",
    clientName: "Sarah Johnson",
    clientEmail: "sarah@corporate.com",
    clientAvatar: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150",
    amount: 2750.00,
    dueDate: "Jan 30 2025",
    status: "Paid",
    invoiceLink: "https://stripe.com/invoice/inv_2233445566",
  },
  {
    id: 8,
    invoiceNo: "#25-047",
    projectName: "SaaS Platform - Monthly Retainer",
    clientName: "Robert Anderson",
    clientEmail: "robert@saastech.io",
    clientAvatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150",
    amount: 6500.00,
    dueDate: "Mar 10 2025",
    status: "Unpaid",
    invoiceLink: "https://contra.com/invoice/con_9988776655",
  },
  {
    id: 9,
    invoiceNo: "#25-033",
    projectName: "Restaurant Booking System",
    clientName: "Emily Rodriguez",
    clientEmail: "emily@foodtech.com",
    clientAvatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150",
    amount: 3200.00,
    dueDate: "Feb 20 2025",
    status: "Canceled",
    invoiceLink: "https://upwork.com/invoice/up_3344556677",
  },
  {
    id: 10,
    invoiceNo: "#25-058",
    projectName: "Education Platform - LMS Integration",
    clientName: "Daniel Lee",
    clientEmail: "daniel@edutech.io",
    clientAvatar: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150",
    amount: 4750.00,
    dueDate: "Apr 5 2025",
    status: "Paid",
    invoiceLink: "https://stripe.com/invoice/inv_6677889900",
  },
  {
    id: 11,
    invoiceNo: "#25-062",
    projectName: "Travel Booking App - MVP",
    clientName: "Jessica Martinez",
    clientEmail: "jessica@traveltech.io",
    clientAvatar: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150",
    amount: 5800.00,
    dueDate: "Apr 12 2025",
    status: "Unpaid",
    invoiceLink: "https://contra.com/invoice/con_1122998877",
  },
  {
    id: 12,
    invoiceNo: "#25-024",
    projectName: "Inventory Management System",
    clientName: "Thomas Brown",
    clientEmail: "thomas@warehouse.co",
    clientAvatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150",
    amount: 3400.00,
    dueDate: "Feb 15 2025",
    status: "Paid",
    invoiceLink: "https://stripe.com/invoice/inv_8899001122",
  },
  {
    id: 13,
    invoiceNo: "#25-067",
    projectName: "Social Media Dashboard - Analytics",
    clientName: "Amanda Taylor",
    clientEmail: "amanda@socialmedia.com",
    clientAvatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150",
    amount: 2200.00,
    dueDate: "Apr 18 2025",
    status: "Unpaid",
    invoiceLink: "https://upwork.com/invoice/up_5566778899",
  },
  {
    id: 14,
    invoiceNo: "#25-041",
    projectName: "CRM Integration - Salesforce",
    clientName: "Kevin Zhang",
    clientEmail: "kevin@enterprise.io",
    clientAvatar: "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=150",
    amount: 7200.00,
    dueDate: "Mar 8 2025",
    status: "Canceled",
    invoiceLink: "https://contra.com/invoice/con_6677334455",
  },
  {
    id: 15,
    invoiceNo: "#25-070",
    projectName: "Video Streaming Platform - Beta",
    clientName: "Olivia Martin",
    clientEmail: "olivia@streamtech.com",
    clientAvatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150",
    amount: 8900.00,
    dueDate: "Apr 30 2025",
    status: "Paid",
    invoiceLink: "https://stripe.com/invoice/inv_3344112233",
  },
];

export default function ProjectPayments() {
  const params = useParams();
  const projectId = params.projectId;
  const [currentPage, setCurrentPage] = useState(1);
  const [createInvoiceDialogOpen, setCreateInvoiceDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const itemsPerPage = 10;

  const projectData = {
    projectName: "Sophie & Co.",
    planType: "Enterprise",
    clientName: "Sophie James",
    clientEmail: "shophie@arcmetals.co",
    clientAvatar: "https://plus.unsplash.com/premium_photo-1690034979551-65a363a0e4a6?q=80&w=1287&auto=format&fit=crop",
  };

  // Filter invoices based on search query and status
  const filteredInvoices = dummyInvoices.filter((invoice) => {
    const matchesSearch = 
      invoice.invoiceNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.clientEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.amount.toString().includes(searchQuery);
    
    const matchesStatus = statusFilter === "all" || invoice.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Calculate pagination
  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentInvoices = filteredInvoices.slice(startIndex, endIndex);

  // Handle page changes
  const handlePrevious = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNext = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  // Handle copy invoice link
  const handleCopyInvoiceLink = async (invoiceLink) => {
    try {
      await navigator.clipboard.writeText(invoiceLink);
      toast.success("Invoice link copied to clipboard");
    } catch (err) {
      toast.error("Failed to copy link");
    }
  };

  // Reset to page 1 when filters change
  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleStatusFilter = (value) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const getStatusBadge = (status) => {
    const variants = {
      Paid: "default",
      Canceled: "destructive",
      Unpaid: "secondary",
    };

    const colors = {
      Paid: "bg-green-100 text-green-700 hover:bg-green-100",
      Canceled: "bg-red-100 text-red-700 hover:bg-red-100",
      Unpaid: "bg-purple-100 text-purple-700 hover:bg-purple-100",
    };

    return (
      <Badge className={colors[status]}>
        {status}
      </Badge>
    );
  };

  return (
    <ProjectLayoutWrapper projectData={projectData}>
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="flex h-16 items-center gap-2 px-4 sm:px-6 lg:px-8 max-w-[1600px] mx-auto">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="h-4 my-auto mr-2"
          />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href={`/project/${projectId}/dashboard`}>
                  Dashboard
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Payments</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <Button 
            className="ml-auto flex items-center gap-1 font-semibold rounded-lg"
            onClick={() => setCreateInvoiceDialogOpen(true)}
          >
            <DollarSign className="h-5 w-5 stroke-2" />
            <span className="hidden sm:inline">Create Invoice</span>
          </Button>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {/* Filters */}
          <div className="flex items-center gap-4 mb-6">
            {/* Search Bar */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search invoices..."
                value={searchQuery}
                onChange={handleSearch}
                className="pl-9 h-10"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={handleStatusFilter}>
              <SelectTrigger className="w-[180px] h-10">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Paid">Paid</SelectItem>
                <SelectItem value="Unpaid">Unpaid</SelectItem>
                <SelectItem value="Canceled">Canceled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Payments Table */}
          <div className="rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent h-[48px]">
                  <TableHead className="w-[120px]">
                    <button className="flex items-center gap-2 font-medium text-muted-foreground hover:text-foreground">
                      Invoice No.
                      <ArrowUpDown className="h-4 w-4" />
                    </button>
                  </TableHead>
                  <TableHead className="w-[350px]">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      Invoice
                    </div>
                  </TableHead>
                  <TableHead>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      Amount
                    </div>
                  </TableHead>
                  <TableHead>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      Due
                    </div>
                  </TableHead>
                  <TableHead>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      Status
                    </div>
                  </TableHead>
                  <TableHead className="w-4"></TableHead>
                  <TableHead className="w-4"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentInvoices.length > 0 ? (
                  currentInvoices.map((invoice) => (
                  <TableRow
                    key={invoice.id}
                    className="group h-[68px] border-none hover:bg-zinc-100"
                  >
                    <TableCell className="font-medium">{invoice.invoiceNo}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-[36px] w-[36px]">
                          <AvatarImage src={invoice.clientAvatar} alt={invoice.clientName} />
                          <AvatarFallback>{invoice.clientName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-medium">{invoice.projectName}</span>
                          <span className="text-sm text-muted-foreground">
                            {invoice.clientEmail}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      ${invoice.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-foreground">{invoice.dueDate}</TableCell>
                    <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                    <TableCell className="pr-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 p-0 border border-slate-200"
                        aria-label="Copy invoice link"
                        onClick={() => handleCopyInvoiceLink(invoice.invoiceLink)}
                      >
                        <LinkIcon className="h-4 w-4" />
                      </Button>
                    </TableCell>
                    <TableCell className="pr-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild className="border border-slate-200">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 p-0"
                            aria-label="Open invoice menu"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="border border-slate-200">
                          <DropdownMenuItem>
                            Mark as paid
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            Cancel
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive focus:text-destructive">
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="py-12">
                      <div className="flex flex-col items-center justify-center px-4 text-center">
                        <div className="rounded-full bg-muted p-6 mb-4">
                          <FileX className="h-12 w-12 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">No invoices found</h3>
                        <p className="text-muted-foreground max-w-sm mb-4">
                          {searchQuery 
                            ? `No invoices match "${searchQuery}". Try adjusting your search or filters.`
                            : statusFilter !== "all"
                            ? "No invoices match the selected status filter. Try selecting a different status."
                            : "No invoices have been created yet. Create your first invoice to get started."
                          }
                        </p>
                        {(searchQuery || statusFilter !== "all") && (
                          <Button
                            variant="outline"
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

          {/* Pagination */}
          {filteredInvoices.length > 0 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Showing {startIndex + 1} to {Math.min(endIndex, filteredInvoices.length)} of{" "}
                {filteredInvoices.length} invoice{filteredInvoices.length !== 1 ? 's' : ''}
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

      {/* Create Invoice Dialog */}
      <CreateInvoiceDialog
        open={createInvoiceDialogOpen}
        onOpenChange={setCreateInvoiceDialogOpen}
        projectData={projectData}
      />
    </ProjectLayoutWrapper>
  );
}

