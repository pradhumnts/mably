"use client";

import { AppSidebar } from "@/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
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
import { useState } from "react";

// Dummy client data - expanded for pagination testing
const dummyClients = [
  {
    id: 1,
    name: "Sophie James",
    email: "sophie@arcmetals.co",
    phone: "+1234567890",
    location: "Atlanta, GA",
    lastActive: "10:30 AM, Mar 4 2025",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
    socials: {
      twitter: "https://twitter.com/sophiejames",
      linkedin: "https://linkedin.com/in/sophiejames",
      whatsapp: "https://wa.me/1234567890",
      tiktok: "https://tiktok.com/@sophiejames",
    },
  },
  {
    id: 2,
    name: "Elsa Watson",
    email: "elsa@techcorp.com",
    phone: "+1234567891",
    location: "Florida, CA",
    lastActive: "10:30 AM, Mar 4 2025",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150",
    socials: {
      twitter: "https://twitter.com/elsawatson",
      linkedin: "https://linkedin.com/in/elsawatson",
      whatsapp: "https://wa.me/1234567891",
      tiktok: "https://tiktok.com/@elsawatson",
    },
  },
  {
    id: 3,
    name: "Sherlock Holmes",
    email: "sherlock@detective.co",
    phone: "+1234567892",
    location: "Sydney, AU",
    lastActive: "10:30 AM, Mar 4 2025",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150",
    socials: {
      twitter: "https://twitter.com/sherlockholmes",
      linkedin: "https://linkedin.com/in/sherlockholmes",
      whatsapp: "https://wa.me/1234567892",
      tiktok: "https://tiktok.com/@sherlockholmes",
    },
  },
  {
    id: 4,
    name: "Caroline Witters",
    email: "caroline@design.io",
    phone: "+1234567893",
    location: "Atlanta, GA",
    lastActive: "10:30 AM, Mar 4 2025",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
    socials: {
      twitter: "https://twitter.com/carolinewitters",
      linkedin: "https://linkedin.com/in/carolinewitters",
      whatsapp: "https://wa.me/1234567893",
      tiktok: "https://tiktok.com/@carolinewitters",
    },
  },
  {
    id: 5,
    name: "Peter Colivas",
    email: "peter@startup.com",
    phone: "+1234567894",
    location: "Atlanta, GA",
    lastActive: "10:30 AM, Mar 4 2025",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
    socials: {
      twitter: "https://twitter.com/petercolivas",
      linkedin: "https://linkedin.com/in/petercolivas",
      whatsapp: "https://wa.me/1234567894",
      tiktok: "https://tiktok.com/@petercolivas",
    },
  },
  {
    id: 6,
    name: "Jessica Martinez",
    email: "jessica@marketing.io",
    phone: "+1234567895",
    location: "New York, NY",
    lastActive: "9:15 AM, Mar 4 2025",
    avatar: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150",
    socials: {
      twitter: "https://twitter.com/jessicamartinez",
      linkedin: "https://linkedin.com/in/jessicamartinez",
      whatsapp: "https://wa.me/1234567895",
      tiktok: "https://tiktok.com/@jessicamartinez",
    },
  },
  {
    id: 7,
    name: "David Chen",
    email: "david@consulting.com",
    phone: "+1234567896",
    location: "San Francisco, CA",
    lastActive: "11:45 AM, Mar 3 2025",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
    socials: {
      twitter: "https://twitter.com/davidchen",
      linkedin: "https://linkedin.com/in/davidchen",
      whatsapp: "https://wa.me/1234567896",
      tiktok: "https://tiktok.com/@davidchen",
    },
  },
  {
    id: 8,
    name: "Amanda Thompson",
    email: "amanda@finance.co",
    phone: "+1234567897",
    location: "Chicago, IL",
    lastActive: "2:30 PM, Mar 3 2025",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150",
    socials: {
      twitter: "https://twitter.com/amandathompson",
      linkedin: "https://linkedin.com/in/amandathompson",
      whatsapp: "https://wa.me/1234567897",
      tiktok: "https://tiktok.com/@amandathompson",
    },
  },
  {
    id: 9,
    name: "Robert Anderson",
    email: "robert@legal.io",
    phone: "+1234567898",
    location: "Boston, MA",
    lastActive: "8:00 AM, Mar 3 2025",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150",
    socials: {
      twitter: "https://twitter.com/robertanderson",
      linkedin: "https://linkedin.com/in/robertanderson",
      whatsapp: "https://wa.me/1234567898",
      tiktok: "https://tiktok.com/@robertanderson",
    },
  },
  {
    id: 10,
    name: "Emily Rodriguez",
    email: "emily@creative.com",
    phone: "+1234567899",
    location: "Miami, FL",
    lastActive: "4:20 PM, Mar 2 2025",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150",
    socials: {
      twitter: "https://twitter.com/emilyrodriguez",
      linkedin: "https://linkedin.com/in/emilyrodriguez",
      whatsapp: "https://wa.me/1234567899",
      tiktok: "https://tiktok.com/@emilyrodriguez",
    },
  },
  {
    id: 11,
    name: "Michael Kim",
    email: "michael@tech.io",
    phone: "+1234567900",
    location: "Seattle, WA",
    lastActive: "1:10 PM, Mar 2 2025",
    avatar: "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=150",
    socials: {
      twitter: "https://twitter.com/michaelkim",
      linkedin: "https://linkedin.com/in/michaelkim",
      whatsapp: "https://wa.me/1234567900",
      tiktok: "https://tiktok.com/@michaelkim",
    },
  },
  {
    id: 12,
    name: "Sarah Johnson",
    email: "sarah@agency.co",
    phone: "+1234567901",
    location: "Austin, TX",
    lastActive: "10:50 AM, Mar 2 2025",
    avatar: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=150",
    socials: {
      twitter: "https://twitter.com/sarahjohnson",
      linkedin: "https://linkedin.com/in/sarahjohnson",
      whatsapp: "https://wa.me/1234567901",
      tiktok: "https://tiktok.com/@sarahjohnson",
    },
  },
  {
    id: 13,
    name: "James Wilson",
    email: "james@consulting.io",
    phone: "+1234567902",
    location: "Denver, CO",
    lastActive: "3:30 PM, Mar 1 2025",
    avatar: "https://images.unsplash.com/photo-1557862921-37829c790f19?w=150",
    socials: {
      twitter: "https://twitter.com/jameswilson",
      linkedin: "https://linkedin.com/in/jameswilson",
      whatsapp: "https://wa.me/1234567902",
      tiktok: "https://tiktok.com/@jameswilson",
    },
  },
  {
    id: 14,
    name: "Lisa Park",
    email: "lisa@innovation.com",
    phone: "+1234567903",
    location: "Portland, OR",
    lastActive: "9:00 AM, Mar 1 2025",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150",
    socials: {
      twitter: "https://twitter.com/lisapark",
      linkedin: "https://linkedin.com/in/lisapark",
      whatsapp: "https://wa.me/1234567903",
      tiktok: "https://tiktok.com/@lisapark",
    },
  },
  {
    id: 15,
    name: "Daniel Lee",
    email: "daniel@development.co",
    phone: "+1234567904",
    location: "Philadelphia, PA",
    lastActive: "5:45 PM, Feb 28 2025",
    avatar: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150",
    socials: {
      twitter: "https://twitter.com/daniellee",
      linkedin: "https://linkedin.com/in/daniellee",
      whatsapp: "https://wa.me/1234567904",
      tiktok: "https://tiktok.com/@daniellee",
    },
  },
];

// Dummy project assignments for each client
const clientProjects = {
  1: [
    {
      id: 1,
      name: "Filmmakers' Academy",
      description: "Track progress, deadlines, and tasks",
      budget: 3500,
      status: "Active",
      dueDate: "16 Sep",
    },
  ],
  2: [
    {
      id: 1,
      name: "Filmmakers' Academy",
      description: "Track progress, deadlines, and tasks",
      budget: 3500,
      status: "Active",
      dueDate: "16 Sep",
    },
    {
      id: 2,
      name: "Trekker's Hill",
      description: "Track progress, deadlines, and tasks",
      budget: 1500,
      status: "Active",
      dueDate: "16 Sep",
    },
  ],
  3: [
    {
      id: 3,
      name: "Mobile Banking App",
      description: "Secure and intuitive banking solution",
      budget: 12000,
      status: "Active",
      dueDate: "15 Oct",
    },
  ],
  4: [
    {
      id: 4,
      name: "Healthcare Dashboard",
      description: "Patient management and analytics",
      budget: 6200,
      status: "On Hold",
      dueDate: "05 Oct",
    },
  ],
  5: [
    {
      id: 5,
      name: "Real Estate Portal",
      description: "Property listings and virtual tours",
      budget: 9800,
      status: "Active",
      dueDate: "22 Oct",
    },
  ],
  6: [
    {
      id: 6,
      name: "Fitness Tracker",
      description: "Workout planning and progress tracking",
      budget: 4500,
      status: "Active",
      dueDate: "18 Sep",
    },
  ],
};

export default function ClientsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedClient, setSelectedClient] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [addClientDialogOpen, setAddClientDialogOpen] = useState(false);
  const itemsPerPage = 10;

  // Filter clients based on search query
  const filteredClients = dummyClients.filter((client) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      client.name.toLowerCase().includes(searchLower) ||
      client.email.toLowerCase().includes(searchLower) ||
      client.location.toLowerCase().includes(searchLower) ||
      client.phone.includes(searchQuery)
    );
  });

  // Calculate pagination
  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);
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

  // Reset to page 1 when search query changes
  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  // Handle client row click
  const handleClientClick = (client) => {
    setSelectedClient(client);
    setDialogOpen(true);
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
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
              onClick={() => setAddClientDialogOpen(true)}
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
                            <AvatarImage src={client.avatar} alt={client.name} />
                            <AvatarFallback>{client.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="font-medium">{client.name}</span>
                            <span className="text-sm text-muted-foreground">
                              {client.email}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-foreground">{client.phone}</TableCell>
                      <TableCell className="text-foreground">{client.location}</TableCell>
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
                            <DropdownMenuItem>
                                Start New Project
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleClientClick(client)}>
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                Edit Client
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive focus:text-destructive">
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
      </SidebarInset>

      {/* Client Details Dialog */}
      <ClientDetailsDialog
        client={selectedClient}
        projects={selectedClient ? clientProjects[selectedClient.id] || [] : []}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />

      {/* Add Client Dialog */}
      <AddClientDialog
        open={addClientDialogOpen}
        onOpenChange={setAddClientDialogOpen}
      />
    </SidebarProvider>
  );
}

