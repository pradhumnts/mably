"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
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
import { Plus, ExternalLink, Search, LinkIcon, Trash2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AddLinkDialog } from "@/components/add-link-dialog";
import { DeleteLibraryItemDialog } from "@/components/delete-library-item-dialog";
import { usePortalProject } from "../../project-portal-shell";
import { listLibraryLinks } from "@/lib/actions/project-library";
import { inferLinkKindFromUrl, linkLogoForKind } from "@/lib/library/infer-types";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

function formatUploadedAt(iso) {
  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(
      new Date(iso)
    );
  } catch {
    return "";
  }
}

const getLinkIcon = (logo) => {
  return (
    <div className="w-12 h-12 rounded-lg border border-slate-200 bg-white flex items-center justify-center p-2">
      {logo ? (
        <img src={logo} alt="" className="w-full h-full object-contain" />
      ) : (
        <LinkIcon className="h-7 w-7 text-slate-500" strokeWidth={2} aria-hidden />
      )}
    </div>
  );
};

export default function LibraryLinks() {
  const params = useParams();
  const searchParams = useSearchParams();
  const projectId = params.projectId;
  const portal = usePortalProject();
  const isFreelancer = Boolean(portal?.meta?.isFreelancer);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedLinks, setExpandedLinks] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [linkTypeFilter, setLinkTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [addLinkDialogOpen, setAddLinkDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const load = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    const res = await listLibraryLinks(String(projectId));
    setLoading(false);
    if (!res.ok) {
      toast.error(res.error || "Could not load links");
      setItems([]);
      return;
    }
    setItems(res.items || []);
  }, [projectId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const linkId = searchParams.get("link");
    if (!linkId) return;
    setExpandedLinks((prev) => ({ ...prev, [linkId]: true }));
    requestAnimationFrame(() => {
      document
        .getElementById(`library-link-${linkId}`)
        ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  }, [searchParams]);

  const toggleExpanded = (linkId) => {
    setExpandedLinks((prev) => ({
      ...prev,
      [linkId]: !prev[linkId],
    }));
  };

  const orderIndex = new Map(items.map((row, i) => [row.id, i]));

  const mapped = items.map((row) => {
    const kind = inferLinkKindFromUrl(row.url);
    return {
      id: row.id,
      name: row.title,
      type: kind,
      logo: linkLogoForKind(kind),
      uploadedBy: row.created_by_display_name || "Member",
      uploadedByAvatar: row.created_by_avatar_url || null,
      uploadedAt: formatUploadedAt(row.created_at),
      description: row.description || "",
      linkUrl: row.url,
    };
  });

  let filteredLinks = mapped.filter((link) => {
    const matchesSearch =
      link.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      link.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      link.uploadedBy.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = linkTypeFilter === "all" || link.type === linkTypeFilter;

    return matchesSearch && matchesType;
  });

  if (sortBy === "newest") {
    filteredLinks = [...filteredLinks].sort(
      (a, b) => (orderIndex.get(a.id) ?? 0) - (orderIndex.get(b.id) ?? 0)
    );
  } else if (sortBy === "oldest") {
    filteredLinks = [...filteredLinks].sort(
      (a, b) => (orderIndex.get(b.id) ?? 0) - (orderIndex.get(a.id) ?? 0)
    );
  } else if (sortBy === "name") {
    filteredLinks = [...filteredLinks].sort((a, b) => a.name.localeCompare(b.name));
  }

  const openDeleteLink = (linkId, label) => {
    setDeleteTarget({ id: linkId, label });
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
                <BreadcrumbLink href={`/project/${projectId}/library/files`}>Library</BreadcrumbLink>
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

      <div className="flex-1">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="flex items-center justify-between gap-4 mb-6">
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
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>

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

          {loading ? (
            <p className="text-sm text-muted-foreground">Loading links…</p>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredLinks.length > 0 ? (
                filteredLinks.map((link) => (
                  <Card
                    key={link.id}
                    id={`library-link-${link.id}`}
                    className="overflow-hidden p-[16px] hover:shadow-lg shadow-sm transition-shadow duration-200"
                  >
                    <CardContent className="p-0">
                      <div className="flex items-start gap-4">
                        {getLinkIcon(link.logo)}

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-base mb-1">{link.name}</h3>
                          </div>

                          <div className="flex items-center gap-2 mb-2">
                            <Avatar className="h-5 w-5">
                              <AvatarImage src={link.uploadedByAvatar || undefined} alt={link.uploadedBy} />
                              <AvatarFallback className="text-xs">
                                {link.uploadedBy.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm text-muted-foreground">{link.uploadedBy}</span>
                            <span className="text-sm text-muted-foreground">•</span>
                            <span className="text-sm text-muted-foreground">{link.uploadedAt}</span>
                          </div>

                          {expandedLinks[link.id] ? (
                            <p className="text-sm text-muted-foreground">
                              {link.description || "No comment on link."}{" "}
                              {link.description ? (
                                <button
                                  type="button"
                                  onClick={() => toggleExpanded(link.id)}
                                  className="text-primary hover:underline focus:outline-none inline"
                                >
                                  Show Less
                                </button>
                              ) : null}
                            </p>
                          ) : (
                            <div className="flex items-baseline gap-1">
                              <p className="text-sm text-muted-foreground truncate flex-1 min-w-0">
                                {link.description || "No comment on link."}
                              </p>
                              {link.description && link.description.length > 80 ? (
                                <button
                                  type="button"
                                  onClick={() => toggleExpanded(link.id)}
                                  className="text-primary hover:underline focus:outline-none text-sm whitespace-nowrap flex-shrink-0"
                                >
                                  Read More
                                </button>
                              ) : null}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="icon"
                                className="border border-slate-200"
                                asChild
                              >
                                <a
                                  href={link.linkUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  aria-label="Open link in new tab"
                                >
                                  <ExternalLink className="h-4 w-4" />
                                </a>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom">Open link in new tab</TooltipContent>
                          </Tooltip>
                          {isFreelancer ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  className="border border-slate-200 text-destructive hover:text-destructive"
                                  aria-label="Remove link"
                                  onClick={() => openDeleteLink(link.id, link.name)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="bottom">Remove link</TooltipContent>
                            </Tooltip>
                          ) : null}
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
                        : "No links have been added yet."}
                  </p>
                  {searchQuery || linkTypeFilter !== "all" || sortBy !== "newest" ? (
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
                  ) : null}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <AddLinkDialog
        open={addLinkDialogOpen}
        onOpenChange={setAddLinkDialogOpen}
        projectId={String(projectId)}
        onSaved={() => void load()}
      />

      <DeleteLibraryItemDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        projectId={String(projectId)}
        kind="link"
        item={deleteTarget}
        onDeleted={() => void load()}
      />
    </>
  );
}
