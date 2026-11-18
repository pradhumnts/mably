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
import {
  Plus,
  ExternalLink,
  Search,
  LinkIcon,
  MoreVertical,
  Pencil,
  Pin,
  Trash2,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AddLinkDialog } from "@/components/add-link-dialog";
import { DeleteLibraryItemDialog } from "@/components/delete-library-item-dialog";
import { usePortalProject } from "../../project-portal-shell";
import { listLibraryLinks, setLibraryLinkPinned } from "@/lib/actions/project-library";
import {
  inferLinkKindFromUrl,
  resolveLibraryLinkHref,
  resolveLinkLogo,
} from "@/lib/library/infer-types";
import { toast } from "sonner";
import {
  stickyPageHeaderClass,
  stickyPageHeaderInnerClass,
  pageContentWrapClass,
  libraryToolbarClass,
  libraryFiltersClass,
  libraryFilterSelectTriggerClass,
} from "@/lib/ui/page-chrome";
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

function LinkLogo({ logo, name }) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(logo) && !failed;

  return (
    <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl border border-slate-200/80 bg-gradient-to-br from-white to-slate-50 p-1.5 shadow-sm">
      {showImage ? (
        <img
          src={logo}
          alt=""
          className="h-full w-full rounded-md object-cover"
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
        />
      ) : (
        <div
          className="flex h-full w-full items-center justify-center rounded-lg bg-slate-100 text-sm font-semibold uppercase tracking-wide text-slate-500"
          aria-hidden
        >
          {(name || "?").trim().charAt(0) || (
            <LinkIcon className="h-5 w-5 text-slate-400" strokeWidth={2} />
          )}
        </div>
      )}
    </div>
  );
}

function isLibraryLinkActionTarget(target) {
  if (!(target instanceof Element)) return false;
  return Boolean(target.closest("[data-library-link-action]"));
}

function openLinkInNewTab(rawUrl) {
  const href = resolveLibraryLinkHref(rawUrl);
  if (!href) {
    toast.error("Invalid link");
    return;
  }
  window.open(href, "_blank", "noopener,noreferrer");
}

/**
 * @param {{ initialData?: Awaited<ReturnType<typeof listLibraryLinks>> | null }} props
 *   Server-loaded links; when missing or failed, they load on mount instead.
 */
export default function LibraryLinks({ initialData = null }) {
  const params = useParams();
  const searchParams = useSearchParams();
  const projectId = params.projectId;
  const portal = usePortalProject();
  const isFreelancer = Boolean(portal?.meta?.isFreelancer);
  const hasInitialData = Boolean(initialData?.ok);

  const [items, setItems] = useState(() => (hasInitialData ? initialData.items || [] : []));
  const [loading, setLoading] = useState(!hasInitialData);
  const [expandedLinks, setExpandedLinks] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [linkTypeFilter, setLinkTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [pinBusyId, setPinBusyId] = useState(/** @type {string | null} */ (null));
  const [addLinkDialogOpen, setAddLinkDialogOpen] = useState(false);
  const [editLink, setEditLink] = useState(null);
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
    if (hasInitialData) return;
    void load();
  }, [load, hasInitialData]);

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
      logo: resolveLinkLogo(kind, row.url),
      uploadedBy: row.created_by_display_name || "Member",
      uploadedByAvatar: row.created_by_avatar_url || null,
      uploadedAt: formatUploadedAt(row.created_at),
      description: row.description || "",
      linkUrl: row.url,
      pinned: Boolean(row.pinned_at),
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

  filteredLinks = [
    ...filteredLinks.filter((link) => link.pinned),
    ...filteredLinks.filter((link) => !link.pinned),
  ];

  const toggleLinkPin = useCallback(
    async (linkId) => {
      const id = String(linkId);
      const row = items.find((item) => String(item.id) === id);
      if (!row || !projectId || pinBusyId) return;
      const nextPinned = !row.pinned_at;
      const previousPinnedAt = row.pinned_at ?? null;
      setPinBusyId(id);
      setItems((prev) =>
        prev.map((item) =>
          String(item.id) === id
            ? { ...item, pinned_at: nextPinned ? new Date().toISOString() : null }
            : item
        )
      );
      const res = await setLibraryLinkPinned(String(projectId), id, nextPinned);
      setPinBusyId(null);
      if (!res.ok) {
        setItems((prev) =>
          prev.map((item) =>
            String(item.id) === id ? { ...item, pinned_at: previousPinnedAt } : item
          )
        );
        toast.error(res.error || "Could not update pin");
      }
    },
    [items, pinBusyId, projectId]
  );

  const openDeleteLink = (linkId, label) => {
    setDeleteTarget({ id: linkId, label });
  };

  const handleLinkOpen = (link) => {
    openLinkInNewTab(link.linkUrl);
  };

  const handleCardActivate = (link, event) => {
    if (isLibraryLinkActionTarget(event.target)) return;
    handleLinkOpen(link);
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
                <BreadcrumbLink href={`/project/${projectId}/dashboard`}>Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden sm:block" />
              <BreadcrumbItem>
                <BreadcrumbLink href={`/project/${projectId}/library/files`}>Library</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden sm:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Links</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <Button
            variant="outline"
            size="sm"
            className="ml-auto shrink-0 gap-1 rounded-lg font-semibold sm:size-default"
            onClick={() => setAddLinkDialogOpen(true)}
          >
            <Plus className="h-4 w-4 stroke-2 sm:h-5 sm:w-5" />
            <span className="sm:hidden">Add</span>
            <span className="hidden sm:inline">Add Link</span>
          </Button>
        </div>
      </header>

      <div className="flex-1">
        <div className={pageContentWrapClass}>
          <div className={libraryToolbarClass}>
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search links..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-10"
              />
            </div>
            <div className={libraryFiltersClass}>
              <Select value={linkTypeFilter} onValueChange={setLinkTypeFilter}>
                <SelectTrigger className={libraryFilterSelectTriggerClass}>
                  <SelectValue placeholder="Link type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="figma">Figma</SelectItem>
                  <SelectItem value="framer">Framer</SelectItem>
                  <SelectItem value="miro">Miro</SelectItem>
                  <SelectItem value="notion">Notion</SelectItem>
                  <SelectItem value="calendly">Calendly</SelectItem>
                  <SelectItem value="loom">Loom</SelectItem>
                  <SelectItem value="drive">Google Drive</SelectItem>
                  <SelectItem value="dropbox">Dropbox</SelectItem>
                  <SelectItem value="github">GitHub</SelectItem>
                  <SelectItem value="wordpress">WordPress</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className={libraryFilterSelectTriggerClass}>
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
                filteredLinks.map((link) => {
                  const isPinned = link.pinned;
                  return (
                  <Card
                    key={link.id}
                    id={`library-link-${link.id}`}
                    role="button"
                    tabIndex={0}
                    className="cursor-pointer overflow-hidden p-[16px] shadow-sm transition-shadow duration-200 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label={`Open ${link.name} in new tab`}
                    onClick={(event) => handleCardActivate(link, event)}
                    onKeyDown={(event) => {
                      if (event.key !== "Enter" && event.key !== " ") return;
                      event.preventDefault();
                      handleLinkOpen(link);
                    }}
                  >
                    <CardContent className="p-0">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                        <div className="flex min-w-0 flex-1 items-start gap-4">
                        <button
                          type="button"
                          className="shrink-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          aria-label={`Open ${link.name} in new tab`}
                          onClick={(event) => {
                            event.stopPropagation();
                            handleLinkOpen(link);
                          }}
                        >
                          <LinkLogo logo={link.logo} name={link.name} />
                        </button>

                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex min-w-0 flex-wrap items-center gap-2">
                            {isPinned ? (
                              <Pin
                                className="h-3.5 w-3.5 shrink-0 fill-current text-amber-600"
                                aria-label="Pinned"
                              />
                            ) : null}
                            <button
                              type="button"
                              className="truncate text-left text-base font-semibold hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                              onClick={(event) => {
                                event.stopPropagation();
                                handleLinkOpen(link);
                              }}
                            >
                              {link.name}
                            </button>
                          </div>

                          <div className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1">
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
                                  data-library-link-action
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    toggleExpanded(link.id);
                                  }}
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
                                  data-library-link-action
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    toggleExpanded(link.id);
                                  }}
                                  className="text-primary hover:underline focus:outline-none text-sm whitespace-nowrap flex-shrink-0"
                                >
                                  Read More
                                </button>
                              ) : null}
                            </div>
                          )}
                        </div>
                        </div>

                        <div className="flex shrink-0 items-center justify-end gap-2">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="icon"
                                className="border border-slate-200 shrink-0"
                                asChild
                              >
                                <a
                                  href={resolveLibraryLinkHref(link.linkUrl) || link.linkUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  data-library-link-action
                                  aria-label="Open link in new tab"
                                  onClick={(event) => event.stopPropagation()}
                                >
                                  <ExternalLink className="h-4 w-4" />
                                </a>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom">Open link in new tab</TooltipContent>
                          </Tooltip>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="border border-slate-200 shrink-0"
                                data-library-link-action
                                aria-label={`More actions for ${link.name}`}
                                onClick={(event) => event.stopPropagation()}
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              className="w-auto min-w-44 border border-slate-200"
                              data-library-link-action
                              onClick={(event) => event.stopPropagation()}
                            >
                              <DropdownMenuItem
                                data-library-link-action
                                className="whitespace-nowrap"
                                disabled={pinBusyId === String(link.id)}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  void toggleLinkPin(link.id);
                                }}
                              >
                                <Pin className="h-4 w-4" />
                                {isPinned ? "Unpin link" : "Pin link"}
                              </DropdownMenuItem>
                              {isFreelancer ? (
                                <>
                                  <DropdownMenuItem
                                    data-library-link-action
                                    className="whitespace-nowrap"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      setEditLink(link);
                                    }}
                                  >
                                    <Pencil className="h-4 w-4" />
                                    Edit link
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    data-library-link-action
                                    className="whitespace-nowrap text-destructive focus:text-destructive"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      openDeleteLink(link.id, link.name);
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                    Delete link
                                  </DropdownMenuItem>
                                </>
                              ) : null}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  );
                })
              ) : (
                <div className="col-span-full flex flex-col items-center justify-center py-12 px-4 text-center">
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

      <AddLinkDialog
        open={Boolean(editLink)}
        onOpenChange={(open) => {
          if (!open) setEditLink(null);
        }}
        projectId={String(projectId)}
        mode="edit"
        link={editLink}
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
