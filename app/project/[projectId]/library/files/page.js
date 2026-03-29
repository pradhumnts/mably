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
import { Upload, Download, Search, MessageCircle, AlertTriangle, FileX } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UploadFileDialog } from "@/components/upload-file-dialog";

// Dummy files data
const dummyFiles = [
  {
    id: 1,
    name: "Brand Guidelines & Standards.pdf",
    type: "pdf",
    logo: "/file-logos/file-pdf.svg",
    needsApproval: false,
    uploadedBy: "Emma Reed",
    uploadedByAvatar: "https://plus.unsplash.com/premium_photo-1675710868549-3c9d54a40219?q=80&w=2670&auto=format&fit=crop",
    uploadedAt: "12 Jan, 02:21 PM",
    description: "Complete brand identity guidelines including logo usage, color palette, typography, and design principles for consistent brand communication.",
    fileUrl: "#",
  },
  {
    id: 2,
    name: "Hero Section Design V3.psd",
    type: "photoshop",
    logo: "/file-logos/adobe-photoshop.svg",
    needsApproval: true,
    uploadedBy: "Emma Reed",
    uploadedByAvatar: "https://plus.unsplash.com/premium_photo-1675710868549-3c9d54a40219?q=80&w=2670&auto=format&fit=crop",
    uploadedAt: "11 Jan, 04:15 PM",
    description: "Latest iteration of the hero section with updated imagery and typography. All layers are organized and ready for review.",
    fileUrl: "#",
  },
  {
    id: 3,
    name: "Logo Variations.ai",
    type: "illustrator",
    logo: "/file-logos/adobe-illustrator.svg",
    needsApproval: false,
    uploadedBy: "Sophie James",
    uploadedByAvatar: "https://plus.unsplash.com/premium_photo-1690034979551-65a363a0e4a6?q=80&w=1287&auto=format&fit=crop",
    uploadedAt: "03 Jan, 11:00 AM",
    description: "",
    fileUrl: "#",
  },
  {
    id: 7,
    name: "Promo Video Final Cut.prproj",
    type: "premiere",
    logo: "/file-logos/adobe-premiere pro.svg",
    needsApproval: true,
    uploadedBy: "Michael Chen",
    uploadedByAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150",
    uploadedAt: "06 Jan, 05:30 PM",
    description: "Final cut of the promotional video with color grading, sound design, and motion graphics. Ready for client approval.",
    fileUrl: "#",
  },
  {
    id: 5,
    name: "Product Launch Presentation.pptx",
    type: "powerpoint",
    logo: "/file-logos/ms-ppt.svg",
    needsApproval: true,
    uploadedBy: "Emma Reed",
    uploadedByAvatar: "https://plus.unsplash.com/premium_photo-1675710868549-3c9d54a40219?q=80&w=2670&auto=format&fit=crop",
    uploadedAt: "08 Jan, 10:20 AM",
    description: "Complete deck for the product launch event including market analysis, feature highlights, and go-to-market strategy.",
    fileUrl: "#",
  },
  {
    id: 10,
    name: "Social Media Calendar.xlsx",
    type: "excel",
    logo: "/file-logos/ms-excel.svg",
    needsApproval: true,
    uploadedBy: "Sophie James",
    uploadedByAvatar: "https://plus.unsplash.com/premium_photo-1690034979551-65a363a0e4a6?q=80&w=1287&auto=format&fit=crop",
    uploadedAt: "04 Jan, 10:00 AM",
    description: "Three-month social media content calendar with post schedules, captions, and performance tracking for all platforms.",
    fileUrl: "#",
  },
  {
    id: 8,
    name: "Hero Background Images.jpg",
    type: "image",
    logo: "/file-logos/image-icon.svg",
    needsApproval: false,
    uploadedBy: "Sophie James",
    uploadedByAvatar: "https://plus.unsplash.com/premium_photo-1690034979551-65a363a0e4a6?q=80&w=1287&auto=format&fit=crop",
    uploadedAt: "05 Jan, 02:00 PM",
    description: "",
    fileUrl: "#",
  },
  {
    id: 11,
    name: "Product Demo Video.mp4",
    type: "video",
    logo: "/file-logos/video-icon.svg",
    needsApproval: true,
    uploadedBy: "Emma Reed",
    uploadedByAvatar: "https://plus.unsplash.com/premium_photo-1675710868549-3c9d54a40219?q=80&w=2670&auto=format&fit=crop",
    uploadedAt: "02 Jan, 04:30 PM",
    description: "Complete product walkthrough video showcasing all key features and user workflows. Ready for client review before final export.",
    fileUrl: "#",
  },
  {
    id: 12,
    name: "Team Photos - Headshots.png",
    type: "image",
    logo: "/file-logos/image-icon.svg",
    needsApproval: false,
    uploadedBy: "Sophie James",
    uploadedByAvatar: "https://plus.unsplash.com/premium_photo-1690034979551-65a363a0e4a6?q=80&w=1287&auto=format&fit=crop",
    uploadedAt: "01 Jan, 10:00 AM",
    description: "",
    fileUrl: "#",
  },
  {
    id: 9,
    name: "Design Assets Package.zip",
    type: "zip",
    logo: "/file-logos/zip.png",
    needsApproval: false,
    uploadedBy: "Emma Reed",
    uploadedByAvatar: "https://plus.unsplash.com/premium_photo-1675710868549-3c9d54a40219?q=80&w=2670&auto=format&fit=crop",
    uploadedAt: "04 Jan, 01:45 PM",
    description: "Complete package of all design assets including icons, illustrations, photos, and UI components for the project.",
    fileUrl: "#",
  },
];

const getFileIcon = (logo) => {
  return (
    <div className="w-12 h-12 rounded-lg border border-slate-200 bg-white flex items-center justify-center p-2">
      <img src={logo} alt="File icon" className="w-full h-full object-contain" />
    </div>
  );
};

export default function LibraryFiles() {
  const params = useParams();
  const projectId = params.projectId;
  const [expandedFiles, setExpandedFiles] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [fileTypeFilter, setFileTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [uploadFileDialogOpen, setUploadFileDialogOpen] = useState(false);

  const toggleExpanded = (fileId) => {
    setExpandedFiles((prev) => ({
      ...prev,
      [fileId]: !prev[fileId],
    }));
  };

  // Filter and sort files
  let filteredFiles = dummyFiles.filter((file) => {
    const matchesSearch = 
      file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      file.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      file.uploadedBy.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = fileTypeFilter === "all" || file.type === fileTypeFilter;
    
    return matchesSearch && matchesType;
  });

  // Sort files
  if (sortBy === "newest") {
    filteredFiles = filteredFiles.sort((a, b) => b.id - a.id);
  } else if (sortBy === "oldest") {
    filteredFiles = filteredFiles.sort((a, b) => a.id - b.id);
  } else if (sortBy === "name") {
    filteredFiles = filteredFiles.sort((a, b) => a.name.localeCompare(b.name));
  }

  const projectData = {
    projectName: "Sophie & Co.",
    planType: "Enterprise",
    clientName: "Sophie James",
    clientEmail: "shophie@arcmetals.co",
    clientAvatar: "https://plus.unsplash.com/premium_photo-1690034979551-65a363a0e4a6?q=80&w=1287&auto=format&fit=crop",
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
                <BreadcrumbLink href={`/project/${projectId}/library/files`}>
                  Library
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Files</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <Button 
            variant="outline" 
            className="ml-auto flex items-center gap-1 font-semibold rounded-lg"
            onClick={() => setUploadFileDialogOpen(true)}
          >
            <Upload className="h-5 w-5 stroke-2" />
            <span className="hidden sm:inline">Upload File</span>
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
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-10"
              />
            </div>
            <div className="flex gap-2">
            {/* File Type Filter */}
            <Select value={fileTypeFilter} onValueChange={setFileTypeFilter}>
              <SelectTrigger className="w-[180px] h-10">
                <SelectValue placeholder="File type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="pdf">PDF Files</SelectItem>
                <SelectItem value="image">Images</SelectItem>
                <SelectItem value="video">Videos</SelectItem>
                <SelectItem value="photoshop">Photoshop</SelectItem>
                <SelectItem value="illustrator">Illustrator</SelectItem>
                <SelectItem value="excel">Excel</SelectItem>
                <SelectItem value="powerpoint">PowerPoint</SelectItem>
                <SelectItem value="premiere">Premiere Pro</SelectItem>
                <SelectItem value="zip">ZIP</SelectItem>
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

          {/* Files Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredFiles.length > 0 ? (
              filteredFiles.map((file) => (
              <Card key={file.id} className="overflow-hidden p-[16px] hover:shadow-lg shadow-sm transition-shadow duration-200">
                <CardContent className="p-0">
                  <div className="flex items-start gap-4">
                    {/* File Icon */}
                    {getFileIcon(file.logo)}

                    {/* File Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-base mb-1">{file.name}</h3>
                      
                      {/* File Metadata */}
                      {file.needsApproval && (
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
                          <AvatarImage src={file.uploadedByAvatar} alt={file.uploadedBy} />
                          <AvatarFallback className="text-xs">{file.uploadedBy.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-muted-foreground">{file.uploadedBy}</span>
                        <span className="text-sm text-muted-foreground">•</span>
                        <span className="text-sm text-muted-foreground">{file.uploadedAt}</span>
                      </div>

                      {/* Description */}
                      {expandedFiles[file.id] ? (
                        <p className="text-sm text-muted-foreground">
                          {file.description || "No comment on file."}{" "}
                          {file.description && (
                            <button
                              onClick={() => toggleExpanded(file.id)}
                              className="text-primary hover:underline focus:outline-none inline"
                            >
                              Show Less
                            </button>
                          )}
                        </p>
                      ) : (
                        <div className="flex items-baseline gap-1">
                          <p className="text-sm text-muted-foreground truncate flex-1 min-w-0">
                            {file.description || "No comment on file."}
                          </p>
                          {file.description && file.description.length > 80 && (
                            <button
                              onClick={() => toggleExpanded(file.id)}
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
                    <Button variant="outline">
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon" className="border border-slate-200">
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
              ))
            ) : (
              <div className="col-span-2 flex flex-col items-center justify-center py-12 px-4 text-center">
                <div className="rounded-full bg-muted p-6 mb-4">
                  <FileX className="h-12 w-12 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No files found</h3>
                <p className="text-muted-foreground max-w-sm mb-4">
                  {searchQuery 
                    ? `No files match "${searchQuery}". Try adjusting your search or filters.`
                    : fileTypeFilter !== "all" || sortBy !== "newest"
                    ? "No files match the selected filters. Try adjusting your filters."
                    : "No files have been uploaded yet. Upload your first file to get started."
                  }
                </p>
                {(searchQuery || fileTypeFilter !== "all" || sortBy !== "newest") && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchQuery("");
                      setFileTypeFilter("all");
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

      {/* Upload File Dialog */}
      <UploadFileDialog
        open={uploadFileDialogOpen}
        onOpenChange={setUploadFileDialogOpen}
      />
    </ProjectLayoutWrapper>
  );
}
