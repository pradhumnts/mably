"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { ProjectLayoutWrapper } from "../../project-layout-wrapper";
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
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Plus, ExternalLink, Search, AlertTriangle, LinkIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AddLinkDialog } from "@/components/add-link-dialog";

// Dummy links data
const dummyLinks = [
  {
    id: 1,
    name: "Homepage Design System V2",
    type: "figma",
    logo: "/link-logos/figma.svg",
    needsApproval: false,
    uploadedBy: "Emma Reed",
    uploadedByAvatar: "https://plus.unsplash.com/premium_photo-1675710868549-3c9d54a40219?q=80&w=2670&auto=format&fit=crop",
    uploadedAt: "12 Jan, 03:45 PM",
    description: "Complete design system with all components, color schemes, and responsive layouts for the homepage redesign.",
    linkUrl: "https://figma.com",
  },
  {
    id: 2,
    name: "Interactive Wireflow - User Journey",
    type: "miro",
    logo: "/link-logos/miro.svg",
    needsApproval: true,
    uploadedBy: "Emma Reed",
    uploadedByAvatar: "https://plus.unsplash.com/premium_photo-1675710868549-3c9d54a40219?q=80&w=2670&auto=format&fit=crop",
    uploadedAt: "11 Jan, 11:20 AM",
    description: "Interactive user flow diagrams mapping the complete customer journey from landing to conversion with all touchpoints.",
    linkUrl: "https://miro.com",
  },
  {
    id: 3,
    name: "Meeting Schedule & Availability",
    type: "calendly",
    logo: "/link-logos/62a9b6cb8ff6441a2952dac4.png",
    needsApproval: false,
    uploadedBy: "Sophie James",
    uploadedByAvatar: "https://plus.unsplash.com/premium_photo-1690034979551-65a363a0e4a6?q=80&w=1287&auto=format&fit=crop",
    uploadedAt: "10 Jan, 09:30 AM",
    description: "",
    linkUrl: "https://calendly.com",
  },
  {
    id: 4,
    name: "Product Documentation Hub",
    type: "notion",
    logo: "/link-logos/notion.svg",
    needsApproval: false,
    uploadedBy: "Emma Reed",
    uploadedByAvatar: "https://plus.unsplash.com/premium_photo-1675710868549-3c9d54a40219?q=80&w=2670&auto=format&fit=crop",
    uploadedAt: "09 Jan, 04:15 PM",
    description: "Centralized documentation hub with project requirements, technical specs, user stories, and meeting notes.",
    linkUrl: "https://notion.so",
  },
  {
    id: 5,
    name: "Landing Page Prototype Demo",
    type: "framer",
    logo: "/link-logos/framer.svg",
    needsApproval: true,
    uploadedBy: "Emma Reed",
    uploadedByAvatar: "https://plus.unsplash.com/premium_photo-1675710868549-3c9d54a40219?q=80&w=2670&auto=format&fit=crop",
    uploadedAt: "08 Jan, 02:00 PM",
    description: "Fully interactive prototype with animations and micro-interactions. Click through to experience the final design flow.",
    linkUrl: "https://framer.com",
  },
  {
    id: 6,
    name: "Brand Assets & Resources",
    type: "figma",
    logo: "/link-logos/figma.svg",
    needsApproval: false,
    uploadedBy: "Sophie James",
    uploadedByAvatar: "https://plus.unsplash.com/premium_photo-1690034979551-65a363a0e4a6?q=80&w=1287&auto=format&fit=crop",
    uploadedAt: "07 Jan, 05:30 PM",
    description: "Complete brand asset library with logos, icons, illustrations, and UI components ready for implementation.",
    linkUrl: "https://figma.com",
  },
  {
    id: 7,
    name: "Project Roadmap & Milestones",
    type: "notion",
    logo: "/link-logos/notion.svg",
    needsApproval: false,
    uploadedBy: "Emma Reed",
    uploadedByAvatar: "https://plus.unsplash.com/premium_photo-1675710868549-3c9d54a40219?q=80&w=2670&auto=format&fit=crop",
    uploadedAt: "06 Jan, 10:45 AM",
    description: "Strategic roadmap with quarterly goals, feature releases, and development milestones for the next 12 months.",
    linkUrl: "https://notion.so",
  },
  {
    id: 8,
    name: "Collaborative Brainstorm Board",
    type: "miro",
    logo: "/link-logos/miro.svg",
    needsApproval: true,
    uploadedBy: "Michael Chen",
    uploadedByAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150",
    uploadedAt: "05 Jan, 03:20 PM",
    description: "Open brainstorming space for feature ideas, feedback, and collaborative problem-solving. Everyone can contribute!",
    linkUrl: "https://miro.com",
  },
  {
    id: 9,
    name: "Mobile App Designs - Final",
    type: "figma",
    logo: "/link-logos/figma.svg",
    needsApproval: false,
    uploadedBy: "Emma Reed",
    uploadedByAvatar: "https://plus.unsplash.com/premium_photo-1675710868549-3c9d54a40219?q=80&w=2670&auto=format&fit=crop",
    uploadedAt: "04 Jan, 01:15 PM",
    description: "",
    linkUrl: "https://figma.com",
  },
  {
    id: 10,
    name: "Marketing Campaign Dashboard",
    type: "framer",
    logo: "/link-logos/framer.svg",
    needsApproval: true,
    uploadedBy: "Sophie James",
    uploadedByAvatar: "https://plus.unsplash.com/premium_photo-1690034979551-65a363a0e4a6?q=80&w=1287&auto=format&fit=crop",
    uploadedAt: "03 Jan, 11:50 AM",
    description: "Interactive dashboard prototype showing real-time campaign metrics, analytics, and performance indicators.",
    linkUrl: "https://framer.com",
  },
];

const getLinkIcon = (logo) => {
  return (
    <div className="w-12 h-12 rounded-lg border border-slate-200 bg-white flex items-center justify-center p-2">
      <img src={logo} alt="Link icon" className="w-full h-full object-contain" />
    </div>
  );
};

export default function LibraryLinks() {
  const params = useParams();
  const projectId = params.projectId;
  const [expandedLinks, setExpandedLinks] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [linkTypeFilter, setLinkTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [addLinkDialogOpen, setAddLinkDialogOpen] = useState(false);

  const projectData = {
    projectName: "Sophie & Co.",
    planType: "Enterprise",
    clientName: "Sophie James",
    clientEmail: "shophie@arcmetals.co",
    clientAvatar: "https://plus.unsplash.com/premium_photo-1690034979551-65a363a0e4a6?q=80&w=1287&auto=format&fit=crop",
  };

  const toggleExpanded = (linkId) => {
    setExpandedLinks((prev) => ({
      ...prev,
      [linkId]: !prev[linkId],
    }));
  };

  // Filter and sort links
  let filteredLinks = dummyLinks.filter((link) => {
    const matchesSearch = 
      link.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      link.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      link.uploadedBy.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = linkTypeFilter === "all" || link.type === linkTypeFilter;
    
    return matchesSearch && matchesType;
  });

  // Sort links
  if (sortBy === "newest") {
    filteredLinks = filteredLinks.sort((a, b) => b.id - a.id);
  } else if (sortBy === "oldest") {
    filteredLinks = filteredLinks.sort((a, b) => a.id - b.id);
  } else if (sortBy === "name") {
    filteredLinks = filteredLinks.sort((a, b) => a.name.localeCompare(b.name));
  }

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
                <BreadcrumbLink href={`/project/${projectId}/library/files`}>
                  Library
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Links</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <Button 
            variant="outline" 
            className="ml-auto flex items-center gap-1 font-semibold rounded-lg"
            onClick={() => setAddLinkDialogOpen(true)}
          >
            <Plus className="h-5 w-5 stroke-2" />
            <span className="hidden sm:inline">Add Link</span>
          </Button>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {/* Filters */}
          <div className="flex items-center justify-between gap-4 mb-6">
            {/* Search Bar */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search links..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-10"
              />
            </div>
            <div className="flex gap-2">
              {/* Link Type Filter */}
              <Select value={linkTypeFilter} onValueChange={setLinkTypeFilter}>
                <SelectTrigger className="w-[180px] h-10">
                  <SelectValue placeholder="Link type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="figma">Figma</SelectItem>
                  <SelectItem value="framer">Framer</SelectItem>
                  <SelectItem value="miro">Miro</SelectItem>
                  <SelectItem value="notion">Notion</SelectItem>
                  <SelectItem value="calendly">Calendly</SelectItem>
                </SelectContent>
              </Select>

              {/* Sort By */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px] h-10">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="name">Name (A-Z)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Links Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredLinks.length > 0 ? (
              filteredLinks.map((link) => (
              <Card key={link.id} className="overflow-hidden p-[16px] hover:shadow-lg shadow-sm transition-shadow duration-200">
                <CardContent className="p-0">
                  <div className="flex items-start gap-4">
                    {/* Link Icon */}
                    {getLinkIcon(link.logo)}

                    {/* Link Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-base mb-1">{link.name}</h3>
                        
                        {/* Link Metadata */}
                        {link.needsApproval && (
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <Badge variant="secondary" className="text-xs bg-orange-100 py-[12px] px-[6px] text-orange-700 hover:bg-orange-100 flex items-center gap-1">
                              <AlertTriangle className="h-3.5 w-3.5 text-orange-700" strokeWidth={2} />
                              Needs Approval
                            </Badge>
                          </div>
                        )}
                      </div>
                      
                      {/* Uploaded By */}
                      <div className="flex items-center gap-2 mb-2">
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={link.uploadedByAvatar} alt={link.uploadedBy} />
                          <AvatarFallback className="text-xs">{link.uploadedBy.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-muted-foreground">{link.uploadedBy}</span>
                        <span className="text-sm text-muted-foreground">•</span>
                        <span className="text-sm text-muted-foreground">{link.uploadedAt}</span>
                      </div>

                      {/* Description */}
                      {expandedLinks[link.id] ? (
                        <p className="text-sm text-muted-foreground">
                          {link.description || "No comment on link."}{" "}
                          {link.description && (
                            <button
                              onClick={() => toggleExpanded(link.id)}
                              className="text-primary hover:underline focus:outline-none inline"
                            >
                              Show Less
                            </button>
                          )}
                        </p>
                      ) : (
                        <div className="flex items-baseline gap-1">
                          <p className="text-sm text-muted-foreground truncate flex-1 min-w-0">
                            {link.description || "No comment on link."}
                          </p>
                          {link.description && link.description.length > 80 && (
                            <button
                              onClick={() => toggleExpanded(link.id)}
                              className="text-primary hover:underline focus:outline-none text-sm whitespace-nowrap flex-shrink-0"
                            >
                              Read More
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="border border-slate-200"
                        asChild
                      >
                        <a href={link.linkUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
              ))
            ) : (
              <div className="col-span-2 flex flex-col items-center justify-center py-12 px-4 text-center">
                <div className="rounded-full bg-muted p-6 mb-4">
                  <LinkIcon className="h-12 w-12 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No links found</h3>
                <p className="text-muted-foreground max-w-sm mb-4">
                  {searchQuery 
                    ? `No links match "${searchQuery}". Try adjusting your search or filters.`
                    : linkTypeFilter !== "all" || sortBy !== "newest"
                    ? "No links match the selected filters. Try adjusting your filters."
                    : "No links have been added yet. Add your first link to get started."
                  }
                </p>
                {(searchQuery || linkTypeFilter !== "all" || sortBy !== "newest") && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchQuery("");
                      setLinkTypeFilter("all");
                      setSortBy("newest");
                    }}
                  >
                    Clear filters
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Link Dialog */}
      <AddLinkDialog
        open={addLinkDialogOpen}
        onOpenChange={setAddLinkDialogOpen}
      />
    </ProjectLayoutWrapper>
  );
}
