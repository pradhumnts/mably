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
import {
  Upload,
  Download,
  Search,
  FileX,
  Trash2,
  MessageCircle,
  Check,
  FileWarning,
  MoreVertical,
  History,
  BadgeCheck,
  Clock,
  Repeat,
  LayoutGrid,
  List,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { UploadLibraryVersionDialog } from "@/components/upload-library-version-dialog";
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
import { cn } from "@/lib/utils";

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

/** @param {number} count */
function formatRevisionCountLabel(count) {
  const n = Math.max(1, Number(count) || 1);
  return n === 1 ? "1 Revision" : `${n} Revisions`;
}

const LIBRARY_CARD_FILE_NAME_MAX_CHARS = 36;

/** @param {string} name */
function formatLibraryCardFileName(name) {
  const text = String(name || "File").trim() || "File";
  if (text.length <= LIBRARY_CARD_FILE_NAME_MAX_CHARS) return text;
  return `${text.slice(0, LIBRARY_CARD_FILE_NAME_MAX_CHARS)}...`;
}

/** @param {{ name: string }} props */
function FileDiscussionSourceIcon({ name }) {
  const label = `From discussion · ${name}`;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          data-library-file-action
          className="inline-flex shrink-0 items-center text-muted-foreground/75 transition-colors hover:text-foreground dark:text-muted-foreground/80 dark:hover:text-foreground"
          aria-label={label}
          onClick={(event) => event.stopPropagation()}
        >
          <Repeat className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
        </span>
      </TooltipTrigger>
      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  );
}

/** @param {{ count: number }} props */
function FileRevisionIndicator({ count }) {
  if (count <= 1) return null;
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-amber-100 bg-amber-50/70 px-2 py-0.5 text-[11px] font-medium leading-none text-amber-900/70 tabular-nums dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-200/80">
      <History className="h-3 w-3 shrink-0 opacity-90" aria-hidden />
      {formatRevisionCountLabel(count)}
    </span>
  );
}

/**
 * @param {{
 *   needsApproval: boolean;
 *   approvalStatus: string | null;
 *   isFreelancer: boolean;
 * }} props
 */
function FileApprovalStatusIndicator({ needsApproval, approvalStatus, isFreelancer }) {
  if (!needsApproval) return null;

  const status = approvalStatus || "pending";
  /** @type {{ label: string; icon: React.ReactNode; className: string } | null} */
  let config = null;

  if (status === "pending") {
    config = {
      label: isFreelancer ? "Awaiting client approval" : "Needs your approval",
      icon: <Clock className="h-3.5 w-3.5" aria-hidden />,
      className:
        "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800/60 dark:bg-amber-950/25 dark:text-amber-200",
    };
  } else if (status === "approved") {
    config = {
      label: "Approved",
      icon: <BadgeCheck className="h-3.5 w-3.5" aria-hidden />,
      className:
        "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-950/25 dark:text-emerald-200",
    };
  } else if (status === "revision_requested") {
    config = {
      label: "Revision requested",
      icon: <FileWarning className="h-3.5 w-3.5" aria-hidden />,
      className:
        "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-800/60 dark:bg-orange-950/25 dark:text-orange-200",
    };
  }

  if (!config) return null;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          data-library-file-action
          className={cn(
            "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border",
            config.className
          )}
          aria-label={config.label}
          onClick={(event) => event.stopPropagation()}
        >
          {config.icon}
        </span>
      </TooltipTrigger>
      <TooltipContent side="bottom">{config.label}</TooltipContent>
    </Tooltip>
  );
}

const LIBRARY_FILES_VIEW_KEY = "mably:library-files-view";

export default function LibraryFiles() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = params.projectId;
  const portal = usePortalProject();
  const isFreelancer = Boolean(portal?.meta?.isFreelancer);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [fileTypeFilter, setFileTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [uploadFileDialogOpen, setUploadFileDialogOpen] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [discussionFileId, setDiscussionFileId] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);
  const [uploadVersionTarget, setUploadVersionTarget] = useState(null);
  const [approvalBusyKey, setApprovalBusyKey] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  /**
   * Library quota: per-file limits for everyone; usage banner only when `showBanner`.
   * @type {[null | { showBanner: boolean; usedBytes: number; totalBytes: number; maxFileBytes: number; maxFileLabel: string; planKey: string | null; percentUsed: number }, import('react').Dispatch<any>]}
   */
  const [libraryQuota, setLibraryQuota] = useState(null);
  const [filesView, setFilesView] = useState(/** @type {"grid" | "list"} */ ("grid"));

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(LIBRARY_FILES_VIEW_KEY);
      if (stored === "grid" || stored === "list") setFilesView(stored);
    } catch {
      // ignore storage errors
    }
  }, []);

  const setFilesViewMode = useCallback((mode) => {
    setFilesView(mode);
    try {
      window.localStorage.setItem(LIBRARY_FILES_VIEW_KEY, mode);
    } catch {
      // ignore storage errors
    }
  }, []);

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
      versionCount: Number(row.version_count ?? 1),
      currentVersionNumber: Number(row.current_version_number ?? 1),
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

  const handleDownload = async (fileId, versionId) => {
    setDownloadingId(fileId);
    const r = await getLibraryFileDownloadUrl(
      String(projectId),
      fileId,
      versionId ? String(versionId) : undefined
    );
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
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
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
            <div
              className="flex h-full shrink-0 items-center gap-0.5 rounded-lg border border-slate-200 p-0.5"
              role="group"
              aria-label="Files view"
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant={filesView === "grid" ? "secondary" : "ghost"}
                    size="icon"
                    className="h-8 w-8 shrink-0 rounded-md"
                    aria-label="Grid view"
                    aria-pressed={filesView === "grid"}
                    onClick={() => setFilesViewMode("grid")}
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Grid view</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant={filesView === "list" ? "secondary" : "ghost"}
                    size="icon"
                    className="h-8 w-8 shrink-0 rounded-md"
                    aria-label="List view"
                    aria-pressed={filesView === "list"}
                    onClick={() => setFilesViewMode("list")}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">List view</TooltipContent>
              </Tooltip>
            </div>
            </div>
            </div>
          </div>

          {loading ? (
            <p className="text-sm text-muted-foreground">Loading files…</p>
          ) : (
            <div
              className={cn(
                "grid grid-cols-1",
                filesView === "grid" ? "gap-6 lg:grid-cols-2" : "gap-4"
              )}
            >
              {filteredFiles.length > 0 ? (
                filteredFiles.map((file) => {
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
                      <div className="grid grid-cols-[auto_1fr_auto] items-start gap-x-4">
                        <button
                          type="button"
                          className="col-start-1 row-start-1 shrink-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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

                        <div className="col-start-2 row-start-1 min-w-0">
                          <div className="mb-1 flex min-w-0 flex-nowrap items-center gap-1.5">
                            {file.fromDiscussion ? (
                              <FileDiscussionSourceIcon name={file.fromDiscussion} />
                            ) : null}
                            <button
                              type="button"
                              title={file.name}
                              className="min-w-0 flex-1 truncate text-left text-base font-semibold hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                              onClick={(event) => {
                                event.stopPropagation();
                                handleFilePrimaryAction(file);
                              }}
                            >
                              {formatLibraryCardFileName(file.name)}
                            </button>
                            <FileApprovalStatusIndicator
                              needsApproval={file.needsApproval}
                              approvalStatus={file.approvalStatus}
                              isFreelancer={isFreelancer}
                            />
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
                        </div>

                        <div className="col-start-3 row-start-1 flex shrink-0 items-center justify-end gap-1.5">
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
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="border border-slate-200 shrink-0"
                                data-library-file-action
                                aria-label={`More actions for ${file.name}`}
                                onClick={(event) => event.stopPropagation()}
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              className="w-auto min-w-44 border border-slate-200"
                              data-library-file-action
                              onClick={(event) => event.stopPropagation()}
                            >
                              {isFreelancer ? (
                                <DropdownMenuItem
                                  data-library-file-action
                                  className="whitespace-nowrap"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    setUploadVersionTarget({
                                      fileId: file.fileId,
                                      name: file.name,
                                      currentVersionNumber: file.currentVersionNumber,
                                      needsApproval: file.needsApproval,
                                    });
                                  }}
                                >
                                  <History className="h-4 w-4" />
                                  Upload new revision
                                </DropdownMenuItem>
                              ) : null}
                              <DropdownMenuItem
                                data-library-file-action
                                className="whitespace-nowrap"
                                disabled={downloadingId === file.fileId}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  void handleDownload(file.fileId);
                                }}
                              >
                                <Download className="h-4 w-4" />
                                Download file
                              </DropdownMenuItem>
                              {isFreelancer ? (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    data-library-file-action
                                    className="whitespace-nowrap text-destructive focus:text-destructive"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      openDeleteFile(file.fileId, file.name);
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                    Delete file
                                  </DropdownMenuItem>
                                </>
                              ) : null}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        <div className="col-span-2 col-start-2 row-start-2 flex min-w-0 items-baseline gap-2">
                          <p
                            className={cn(
                              "min-w-0 flex-1 text-sm text-muted-foreground",
                              file.versionCount > 1 && "pr-2",
                              file.description && file.description.length > 80 && "truncate"
                            )}
                          >
                            {file.description || "No comment on file."}
                          </p>
                          {file.description && file.description.length > 80 ? (
                            <button
                              type="button"
                              data-library-file-action
                              onClick={(event) => {
                                event.stopPropagation();
                                setDiscussionFileId(file.fileId);
                              }}
                              className="shrink-0 text-sm text-primary hover:underline focus:outline-none whitespace-nowrap"
                            >
                              Read More
                            </button>
                          ) : null}
                          {file.versionCount > 1 ? (
                            <span className="ml-auto shrink-0">
                              <FileRevisionIndicator count={file.versionCount} />
                            </span>
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
                    currentVersionNumber={file.currentVersionNumber}
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

      <UploadLibraryVersionDialog
        open={Boolean(uploadVersionTarget)}
        onOpenChange={(open) => {
          if (!open) setUploadVersionTarget(null);
        }}
        projectId={String(projectId)}
        fileId={uploadVersionTarget?.fileId ?? ""}
        fileName={uploadVersionTarget?.name ?? "File"}
        currentVersionNumber={uploadVersionTarget?.currentVersionNumber ?? 1}
        isFreelancer={isFreelancer}
        needsApproval={Boolean(uploadVersionTarget?.needsApproval)}
        maxFileBytes={libraryQuota?.maxFileBytes}
        maxFileLabel={libraryQuota?.maxFileLabel}
        onUploaded={refreshLibrary}
      />

      <LibraryFilePreviewDialog
        open={Boolean(previewFile)}
        onOpenChange={(open) => {
          if (!open) setPreviewFile(null);
        }}
        projectId={String(projectId)}
        file={previewFile}
        onDownload={(fileId, versionId) => void handleDownload(fileId, versionId)}
        onRenamed={handleFileRenamed}
      />
    </>
  );
}
