"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
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
import { isLibraryFilePreviewable } from "@/lib/library/file-preview";
import { LibraryFilePreviewDialog } from "@/components/library-file-preview-dialog";
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

function isLibraryFileActionTarget(target) {
  if (!(target instanceof Element)) return false;
  return Boolean(target.closest("[data-library-file-action]"));
}

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
  const [previewFile, setPreviewFile] = useState(null);
  const [approvalBusyKey, setApprovalBusyKey] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  /**
   * Library quota: per-file limits for everyone; usage banner only when `showBanner`.
   * @type {[null | { showBanner: boolean; usedBytes: number; totalBytes: number; maxFileBytes: number; maxFileLabel: string; planKey: string | null; percentUsed: number }, import('react').Dispatch<any>]}
   */
  const [libraryQuota, setLibraryQuota] = useState(null);

  const load = useCallback(async (options = {}) => {
    const silent = options.silent === true;
    if (!projectId) return;
    if (!silent) setLoading(true);
    const [filesRes, usageRes] = await Promise.all([
      listLibraryFiles(String(projectId)),
      getLibraryStorageUsageForProject(String(projectId)),
    ]);
    if (!silent) setLoading(false);
    if (!filesRes.ok) {
      if (!silent) {
        toast.error(filesRes.error || "Could not load files");
        setItems([]);
        setLibraryQuota(null);
      }
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
    } else if (!silent) {
      setLibraryQuota(null);
      toast.error(usageRes.error || "Could not load library upload limits");
    }
  }, [projectId]);

  const refreshLibrary = useCallback(() => {
    void load({ silent: true });
  }, [load]);

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

  const nameById = new Map(items.map((row) => [String(row.id), row.display_name || "File"]));

  const mapped = items.map((row) => {
    const kind = inferFileKindFromMime(row.mime_type, row.original_filename || row.display_name);
    const needsApproval = Boolean(row.needs_approval);
    const approvalStatus = needsApproval ? row.approval_status || "pending" : null;
    const fromDiscussion =
      row.upload_origin === "discussion" && row.origin_discussion_file_id
        ? nameById.get(String(row.origin_discussion_file_id)) || null
        : null;
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
      mimeType: row.mime_type || null,
      needsApproval,
      approvalStatus,
      fromDiscussion,
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

  const handleFileRenamed = useCallback((fileId, newName) => {
    const id = String(fileId);
    const name = String(newName || "").trim();
    if (!name) return;
    setItems((prev) =>
      prev.map((row) => (String(row.id) === id ? { ...row, display_name: name } : row))
    );
    setPreviewFile((prev) =>
      prev && String(prev.fileId) === id ? { ...prev, name } : prev
    );
  }, []);

  const fileDisplayNameById = useMemo(
    () =>
      Object.fromEntries(
        items.map((row) => [String(row.id), row.display_name || "File"])
      ),
    [items]
  );

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

  const handleFilePrimaryAction = (file) => {
    if (isLibraryFilePreviewable(file.type, file.mimeType)) {
      setPreviewFile(file);
      return;
    }
    void handleDownload(file.fileId);
  };

  const handleCardActivate = (file, event) => {
    if (isLibraryFileActionTarget(event.target)) return;
    if (discussionFileId === file.fileId) return;
    handleFilePrimaryAction(file);
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
    void refreshLibrary();
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
                <BreadcrumbPage>Files</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <Button
            variant="outline"
            size="sm"
            className="ml-auto shrink-0 gap-1 rounded-lg font-semibold sm:size-default"
            onClick={() => setUploadFileDialogOpen(true)}
          >
            <Upload className="h-4 w-4 stroke-2 sm:h-5 sm:w-5" />
            <span className="sm:hidden">Upload</span>
            <span className="hidden sm:inline">Upload File</span>
          </Button>
        </div>
      </header>

      <div className="flex-1">
        <div className={pageContentWrapClass}>
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

          <div className={libraryToolbarClass}>
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-10"
              />
            </div>
            <div className={libraryFiltersClass}>
              <Select value={fileTypeFilter} onValueChange={setFileTypeFilter}>
                <SelectTrigger className={libraryFilterSelectTriggerClass}>
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
                <SelectTrigger className={libraryFilterSelectTriggerClass}>
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
                  <Fragment key={file.id}>
                  <Card
                    id={`library-file-${file.fileId}`}
                    role="button"
                    tabIndex={0}
                    className="cursor-pointer overflow-hidden p-[16px] shadow-sm transition-shadow duration-200 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label={
                      isLibraryFilePreviewable(file.type, file.mimeType)
                        ? `Preview ${file.name}`
                        : `Download ${file.name}`
                    }
                    onClick={(event) => handleCardActivate(file, event)}
                    onKeyDown={(event) => {
                      if (event.key !== "Enter" && event.key !== " ") return;
                      event.preventDefault();
                      handleFilePrimaryAction(file);
                    }}
                  >
                    <CardContent className="p-0">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                        <div className="flex min-w-0 flex-1 items-start gap-4">
                        <button
                          type="button"
                          className="shrink-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          aria-label={
                            isLibraryFilePreviewable(file.type, file.mimeType)
                              ? `Preview ${file.name}`
                              : `Download ${file.name}`
                          }
                          onClick={(event) => {
                            event.stopPropagation();
                            handleFilePrimaryAction(file);
                          }}
                        >
                          {getFileIcon(file.logo)}
                        </button>

                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex min-w-0 flex-wrap items-center gap-2">
                            <button
                              type="button"
                              className="min-w-0 truncate text-left text-base font-semibold hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                              onClick={(event) => {
                                event.stopPropagation();
                                handleFilePrimaryAction(file);
                              }}
                            >
                              {file.name}
                            </button>
                            {approvalBadge ? (
                              <Badge variant="outline" className={approvalBadge.className}>
                                {approvalBadge.label}
                              </Badge>
                            ) : null}
                            {file.fromDiscussion ? (
                              <Badge
                                variant="outline"
                                className="border-sky-200 bg-sky-50 text-sky-950 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-100"
                              >
                                From discussion · {file.fromDiscussion}
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
                                  data-library-file-action
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    toggleExpanded(file.id);
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
                                {file.description || "No comment on file."}
                              </p>
                              {file.description && file.description.length > 80 ? (
                                <button
                                  type="button"
                                  data-library-file-action
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    toggleExpanded(file.id);
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

                        <div className="flex shrink-0 items-center justify-end gap-1.5">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="border border-slate-200 shrink-0"
                                disabled={downloadingId === file.fileId}
                                data-library-file-action
                                aria-label="Download file"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  void handleDownload(file.fileId);
                                }}
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
                                data-library-file-action
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setDiscussionFileId(file.fileId);
                                }}
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
                                  data-library-file-action
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    openDeleteFile(file.fileId, file.name);
                                  }}
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
                            data-library-file-action
                            onClick={(event) => {
                              event.stopPropagation();
                              void handleSetFileApproval(file.fileId, "approved");
                            }}
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
                            data-library-file-action
                            onClick={(event) => {
                              event.stopPropagation();
                              void handleSetFileApproval(file.fileId, "revision_requested");
                            }}
                          >
                            <FileWarning className="h-4 w-4" />
                            Request revision
                          </Button>
                        </div>
                      ) : null}
                    </CardContent>
                  </Card>
                  <LibraryFileDiscussion
                    projectId={String(projectId)}
                    fileId={String(file.fileId)}
                    fileName={file.name}
                    fileLogo={file.logo}
                    uploadedByName={file.uploadedBy}
                    uploadedByAvatar={file.uploadedByAvatar}
                    uploadedAt={file.uploadedAtFull}
                    isFreelancer={isFreelancer}
                    maxFileBytes={libraryQuota?.maxFileBytes}
                    maxFileLabel={libraryQuota?.maxFileLabel}
                    onLibraryChanged={refreshLibrary}
                    fileDisplayNameById={fileDisplayNameById}
                    onPreviewAttachedFile={(attached) => setPreviewFile(attached)}
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
                  </Fragment>
                  );
                })
              ) : (
                <div className="col-span-full flex flex-col items-center justify-center py-12 px-4 text-center">
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
        onUploaded={refreshLibrary}
      />

      <DeleteLibraryItemDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        projectId={String(projectId)}
        kind="file"
        item={deleteTarget}
        onDeleted={refreshLibrary}
      />

      <LibraryFilePreviewDialog
        open={Boolean(previewFile)}
        onOpenChange={(open) => {
          if (!open) setPreviewFile(null);
        }}
        projectId={String(projectId)}
        file={previewFile}
        onDownload={(fileId) => void handleDownload(fileId)}
        onRenamed={handleFileRenamed}
      />
    </>
  );
}
