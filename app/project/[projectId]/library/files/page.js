"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
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
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Upload, Download, Search, FileX, Trash2, MessageCircle, Check, FileWarning } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UploadFileDialog } from "@/components/upload-file-dialog";
import { DeleteLibraryItemDialog } from "@/components/delete-library-item-dialog";
import { usePortalProject } from "../../project-portal-shell";
import {
  getLibraryFileDownloadUrl,
  getLibraryStorageUsageForProject,
  listLibraryFiles,
  markLibraryFileCommentsRead,
  setLibraryFileApprovalStatus,
} from "@/lib/actions/project-library";
import { formatStorageShort } from "@/lib/billing/library-storage-policy";
import { LibraryFileDiscussion } from "@/components/library-file-discussion";
import { fileLogoForKind, inferFileKindFromMime } from "@/lib/library/infer-types";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { createClient as createBrowserSupabaseClient } from "@/lib/supabase/client";

function formatUploadedAt(iso) {
  try {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
    }).format(new Date(iso));
  } catch {
    return "";
  }
}

function formatUploadedAtFull(iso) {
  try {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(new Date(iso));
  } catch {
    return "";
  }
}

const getFileIcon = (logo) => {
  return (
    <div className="w-12 h-12 rounded-lg border border-slate-200 bg-white flex items-center justify-center p-2">
      <img src={logo} alt="" className="w-full h-full object-contain" />
    </div>
  );
};

function fileApprovalBadge(needsApproval, approvalStatus, isFreelancer) {
  if (!needsApproval) return null;
  const status = approvalStatus || "pending";
  if (status === "pending") {
    return {
      label: isFreelancer ? "Awaiting client approval" : "Needs your approval",
      className:
        "border-amber-300 bg-amber-50 text-amber-950 dark:bg-amber-950/30 dark:text-amber-100 dark:border-amber-800",
    };
  }
  if (status === "approved") {
    return {
      label: "Approved",
      className:
        "border-emerald-300 bg-emerald-600 text-white dark:bg-emerald-700 dark:border-emerald-600",
    };
  }
  if (status === "revision_requested") {
    return {
      label: "Revision requested",
      className: "border-orange-300 bg-orange-50 text-orange-950 dark:bg-orange-950/40 dark:text-orange-100",
    };
  }
  return null;
}

export default function LibraryFiles() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = params.projectId;
  const portal = usePortalProject();
  const isFreelancer = Boolean(portal?.meta?.isFreelancer);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedFiles, setExpandedFiles] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [fileTypeFilter, setFileTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [uploadFileDialogOpen, setUploadFileDialogOpen] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [discussionFileId, setDiscussionFileId] = useState(null);
  const [approvalBusyKey, setApprovalBusyKey] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  /**
   * Library quota: per-file limits for everyone; usage banner only when `showBanner`.
   * @type {[null | { showBanner: boolean; usedBytes: number; totalBytes: number; maxFileBytes: number; maxFileLabel: string; planKey: string | null; percentUsed: number }, import('react').Dispatch<any>]}
   */
  const [libraryQuota, setLibraryQuota] = useState(null);

  const load = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    const [filesRes, usageRes] = await Promise.all([
      listLibraryFiles(String(projectId)),
      getLibraryStorageUsageForProject(String(projectId)),
    ]);
    setLoading(false);
    if (!filesRes.ok) {
      toast.error(filesRes.error || "Could not load files");
      setItems([]);
      setLibraryQuota(null);
      return;
    }
    setItems(filesRes.items || []);

    if (usageRes.ok) {
      setLibraryQuota({
        showBanner: !usageRes.hidden,
        usedBytes: usageRes.usedBytes,
        totalBytes: usageRes.totalBytes,
        maxFileBytes: usageRes.maxFileBytes,
        maxFileLabel: usageRes.maxFileLabel,
        planKey: usageRes.planKey,
        percentUsed: usageRes.percentUsed,
      });
    } else {
      setLibraryQuota(null);
      toast.error(usageRes.error || "Could not load library upload limits");
    }
  }, [projectId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    let cancelled = false;

    void (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!cancelled) setCurrentUserId(user?.id ?? null);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const fromQuery = searchParams.get("discussion");
    if (!fromQuery) return;
    setDiscussionFileId(fromQuery);
    requestAnimationFrame(() => {
      document
        .getElementById(`library-file-${fromQuery}`)
        ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  }, [searchParams]);

  const clearUnreadForFile = useCallback((fileId) => {
    setItems((prev) =>
      prev.map((row) =>
        String(row.id) === String(fileId)
          ? { ...row, unread_comment_count: 0 }
          : row
      )
    );
  }, []);

  const markDiscussionRead = useCallback(
    async (fileId) => {
      if (!projectId || !fileId) return;
      clearUnreadForFile(fileId);
      const res = await markLibraryFileCommentsRead(String(projectId), String(fileId));
      if (!res.ok) {
        // Keep the UI calm; the next list load will correct the count if this fails.
        console.warn("[library] mark file discussion read:", res.error);
      }
    },
    [clearUnreadForFile, projectId]
  );

  useEffect(() => {
    if (!discussionFileId) return;
    void markDiscussionRead(discussionFileId);
  }, [discussionFileId, markDiscussionRead]);

  useEffect(() => {
    if (!projectId || !currentUserId) return;

    const supabase = createBrowserSupabaseClient();
    const channel = supabase
      .channel(`library-file-unread:${projectId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "project_library_file_comments",
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          const row = payload.new;
          if (!row?.file_id || row.author_id === currentUserId) return;

          if (String(row.file_id) === String(discussionFileId)) {
            void markDiscussionRead(row.file_id);
            return;
          }

          setItems((prev) =>
            prev.map((item) =>
              String(item.id) === String(row.file_id)
                ? {
                    ...item,
                    unread_comment_count:
                      Number(item.unread_comment_count || 0) + 1,
                  }
                : item
            )
          );
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [currentUserId, discussionFileId, markDiscussionRead, projectId]);

  const toggleExpanded = (fileId) => {
    setExpandedFiles((prev) => ({
      ...prev,
      [fileId]: !prev[fileId],
    }));
  };

  const mapped = items.map((row) => {
    const kind = inferFileKindFromMime(row.mime_type, row.original_filename || row.display_name);
    const needsApproval = Boolean(row.needs_approval);
    const approvalStatus = needsApproval ? row.approval_status || "pending" : null;
    return {
      id: row.id,
      name: row.display_name,
      type: kind,
      logo: fileLogoForKind(kind),
      uploadedBy: row.created_by_display_name || "Member",
      uploadedByAvatar: row.created_by_avatar_url || null,
      uploadedAt: formatUploadedAt(row.created_at),
      uploadedAtFull: formatUploadedAtFull(row.created_at),
      description: row.description || "",
      fileId: row.id,
      needsApproval,
      approvalStatus,
      unreadCommentCount: Number(row.unread_comment_count || 0),
      sizeBytes: Number.isFinite(Number(row.size_bytes)) ? Number(row.size_bytes) : null,
      sizeLabel:
        Number.isFinite(Number(row.size_bytes)) && Number(row.size_bytes) > 0
          ? formatStorageShort(Number(row.size_bytes))
          : null,
    };
  });

  const orderIndex = new Map(items.map((row, i) => [row.id, i]));

  let filteredFiles = mapped.filter((file) => {
    const matchesSearch =
      file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      file.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      file.uploadedBy.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = fileTypeFilter === "all" || file.type === fileTypeFilter;

    return matchesSearch && matchesType;
  });

  if (sortBy === "newest") {
    filteredFiles = [...filteredFiles].sort(
      (a, b) => (orderIndex.get(a.id) ?? 0) - (orderIndex.get(b.id) ?? 0)
    );
  } else if (sortBy === "oldest") {
    filteredFiles = [...filteredFiles].sort(
      (a, b) => (orderIndex.get(b.id) ?? 0) - (orderIndex.get(a.id) ?? 0)
    );
  } else if (sortBy === "name") {
    filteredFiles = [...filteredFiles].sort((a, b) => a.name.localeCompare(b.name));
  } else if (sortBy === "largest" || sortBy === "smallest") {
    const direction = sortBy === "largest" ? -1 : 1;
    filteredFiles = [...filteredFiles].sort((a, b) => {
      const sizeA = Number(a.sizeBytes ?? 0);
      const sizeB = Number(b.sizeBytes ?? 0);
      if (sizeA !== sizeB) return (sizeA - sizeB) * direction;
      // Tie-breaker: keep newest first so identical sizes have a stable order.
      return (orderIndex.get(a.id) ?? 0) - (orderIndex.get(b.id) ?? 0);
    });
  }

  const handleDownload = async (fileId) => {
    setDownloadingId(fileId);
    const r = await getLibraryFileDownloadUrl(String(projectId), fileId);
    setDownloadingId(null);
    if (!r.ok || !r.url) {
      toast.error(r.error || "Could not download");
      return;
    }
    window.open(r.url, "_blank", "noopener,noreferrer");
  };

  const openDeleteFile = (fileId, label) => {
    setDeleteTarget({ id: fileId, label });
  };

  const handleSetFileApproval = async (fileId, status) => {
    const key = `${fileId}:${status}`;
    setApprovalBusyKey(key);
    const r = await setLibraryFileApprovalStatus(String(projectId), String(fileId), status);
    setApprovalBusyKey(null);
    if (!r.ok) {
      toast.error(r.error || "Could not update approval");
      return;
    }
    toast.success(
      status === "approved" ? "File approved" : status === "revision_requested" ? "Revision requested" : "Updated"
    );
    void load();
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

      <div className="flex-1">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {libraryQuota?.showBanner ? (
            <div className="mb-6 rounded-xl border border-border/80 bg-gradient-to-br from-muted/50 via-muted/25 to-background px-4 py-3.5 sm:px-5 sm:py-4 shadow-sm">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Library storage
                  </p>
                  <p className="text-sm font-semibold leading-snug text-foreground sm:text-base">
                    <span className="tabular-nums">
                      {formatStorageShort(libraryQuota.usedBytes)}
                    </span>
                    <span className="font-normal text-muted-foreground"> of </span>
                    <span className="tabular-nums">
                      {formatStorageShort(libraryQuota.totalBytes)}
                    </span>
                    <span className="font-normal text-muted-foreground"> used</span>
                    <span className="text-muted-foreground"> · </span>
                    <span className="capitalize">{libraryQuota.planKey || "starter"}</span>
                    <span className="font-normal text-muted-foreground"> plan</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Counts every library file across all projects you own, not only this project.
                  </p>
                </div>
                <div className="w-full shrink-0 lg:max-w-sm">
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        libraryQuota.percentUsed >= 90
                          ? "bg-destructive"
                          : libraryQuota.percentUsed >= 75
                            ? "bg-amber-500"
                            : "bg-primary"
                      }`}
                      style={{ width: `${Math.min(100, libraryQuota.percentUsed)}%` }}
                    />
                  </div>
                  <p className="mt-1.5 text-right text-xs tabular-nums text-muted-foreground">
                    {libraryQuota.percentUsed.toFixed(0)}% full
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          <div className="flex items-center justify-between gap-4 mb-6">
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
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px] h-10">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest first</SelectItem>
                  <SelectItem value="oldest">Oldest first</SelectItem>
                  <SelectItem value="name">Name (A-Z)</SelectItem>
                  <SelectItem value="largest">Largest</SelectItem>
                  <SelectItem value="smallest">Smallest</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {loading ? (
            <p className="text-sm text-muted-foreground">Loading files…</p>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredFiles.length > 0 ? (
                filteredFiles.map((file) => {
                  const approvalBadge = fileApprovalBadge(
                    file.needsApproval,
                    file.approvalStatus,
                    isFreelancer
                  );
                  return (
                  <Card
                    key={file.id}
                    id={`library-file-${file.fileId}`}
                    className="overflow-hidden p-[16px] hover:shadow-lg shadow-sm transition-shadow duration-200"
                  >
                    <CardContent className="p-0">
                      <div className="flex items-start gap-4">
                        {getFileIcon(file.logo)}

                        <div className="flex-1 min-w-0">
                          <div className="mb-1 flex min-w-0 flex-wrap items-center gap-2">
                            <h3 className="min-w-0 truncate font-semibold text-base">{file.name}</h3>
                            {approvalBadge ? (
                              <Badge variant="outline" className={approvalBadge.className}>
                                {approvalBadge.label}
                              </Badge>
                            ) : null}
                          </div>

                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-2">
                            <Avatar className="h-5 w-5">
                              <AvatarImage src={file.uploadedByAvatar || undefined} alt={file.uploadedBy} />
                              <AvatarFallback className="text-xs">
                                {file.uploadedBy.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm text-muted-foreground">{file.uploadedBy}</span>
                            <span className="text-sm text-muted-foreground">•</span>
                            <span className="text-sm text-muted-foreground">{file.uploadedAt}</span>
                            {file.sizeLabel ? (
                              <>
                                <span className="text-sm text-muted-foreground">•</span>
                                <span className="text-sm font-medium tabular-nums text-muted-foreground">
                                  {file.sizeLabel}
                                </span>
                              </>
                            ) : null}
                          </div>

                          {expandedFiles[file.id] ? (
                            <p className="text-sm text-muted-foreground">
                              {file.description || "No comment on file."}{" "}
                              {file.description ? (
                                <button
                                  type="button"
                                  onClick={() => toggleExpanded(file.id)}
                                  className="text-primary hover:underline focus:outline-none inline"
                                >
                                  Show Less
                                </button>
                              ) : null}
                            </p>
                          ) : (
                            <div className="flex items-baseline gap-1">
                              <p className="text-sm text-muted-foreground truncate flex-1 min-w-0">
                                {file.description || "No comment on file."}
                              </p>
                              {file.description && file.description.length > 80 ? (
                                <button
                                  type="button"
                                  onClick={() => toggleExpanded(file.id)}
                                  className="text-primary hover:underline focus:outline-none text-sm whitespace-nowrap flex-shrink-0"
                                >
                                  Read More
                                </button>
                              ) : null}
                            </div>
                          )}
                        </div>

                        <div className="flex flex-shrink-0 items-center gap-1.5">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="border border-slate-200 shrink-0"
                                disabled={downloadingId === file.fileId}
                                aria-label="Download file"
                                onClick={() => void handleDownload(file.fileId)}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom">Download file</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="relative border border-slate-200 shrink-0"
                                aria-label={
                                  file.unreadCommentCount > 0
                                    ? `Open file discussion, ${file.unreadCommentCount} unread`
                                    : "Open file discussion"
                                }
                                onClick={() => setDiscussionFileId(file.fileId)}
                              >
                                <MessageCircle className="h-4 w-4" />
                                {file.unreadCommentCount > 0 ? (
                                  <Badge
                                    variant="destructive"
                                    className="absolute -right-1.5 -top-1.5 h-4 min-w-4 rounded-full bg-red-500 px-1 text-[10px] font-semibold leading-none text-white shadow-sm ring-2 ring-background animate-in zoom-in duration-200"
                                  >
                                    {file.unreadCommentCount > 99
                                      ? "99+"
                                      : file.unreadCommentCount}
                                  </Badge>
                                ) : null}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom">
                              {file.unreadCommentCount > 0
                                ? `${file.unreadCommentCount} unread ${
                                    file.unreadCommentCount === 1
                                      ? "comment"
                                      : "comments"
                                  }`
                                : "Open discussion"}
                            </TooltipContent>
                          </Tooltip>
                          {isFreelancer ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  className="border border-slate-200 text-destructive hover:text-destructive shrink-0"
                                  aria-label="Delete file"
                                  onClick={() => openDeleteFile(file.fileId, file.name)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="bottom">Delete this file</TooltipContent>
                            </Tooltip>
                          ) : null}
                        </div>
                      </div>

                      {!isFreelancer &&
                      file.needsApproval &&
                      file.approvalStatus === "pending" ? (
                        <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-200 pt-4">
                          <Button
                            type="button"
                            size="sm"
                            className="inline-flex items-center gap-1.5 font-semibold"
                            disabled={approvalBusyKey !== null}
                            onClick={() => void handleSetFileApproval(file.fileId, "approved")}
                          >
                            <Check className="h-4 w-4" />
                            Approve
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="inline-flex items-center gap-1.5 font-semibold border-slate-300"
                            disabled={approvalBusyKey !== null}
                            onClick={() => void handleSetFileApproval(file.fileId, "revision_requested")}
                          >
                            <FileWarning className="h-4 w-4" />
                            Request revision
                          </Button>
                        </div>
                      ) : null}

                      <LibraryFileDiscussion
                        projectId={String(projectId)}
                        fileId={String(file.fileId)}
                        fileName={file.name}
                        fileLogo={file.logo}
                        uploadedByName={file.uploadedBy}
                        uploadedByAvatar={file.uploadedByAvatar}
                        uploadedAt={file.uploadedAtFull}
                        open={discussionFileId === file.fileId}
                        onOpenChange={(nextOpen) => {
                          if (nextOpen) {
                            setDiscussionFileId(file.fileId);
                          } else {
                            setDiscussionFileId((prev) =>
                              prev === file.fileId ? null : prev
                            );
                            if (
                              String(searchParams.get("discussion") || "") ===
                              String(file.fileId)
                            ) {
                              router.replace(
                                `/project/${projectId}/library/files`,
                                { scroll: false }
                              );
                            }
                          }
                        }}
                      />
                    </CardContent>
                  </Card>
                  );
                })
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
                        : "No files have been uploaded yet."}
                  </p>
                  {searchQuery || fileTypeFilter !== "all" || sortBy !== "newest" ? (
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
                  ) : null}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <UploadFileDialog
        open={uploadFileDialogOpen}
        onOpenChange={setUploadFileDialogOpen}
        projectId={String(projectId)}
        isFreelancer={isFreelancer}
        maxFileBytes={libraryQuota?.maxFileBytes}
        maxFileLabel={libraryQuota?.maxFileLabel}
        onUploaded={() => void load()}
      />

      <DeleteLibraryItemDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        projectId={String(projectId)}
        kind="file"
        item={deleteTarget}
        onDeleted={() => void load()}
      />
    </>
  );
}
