"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Download, Loader2, RotateCcw, ZoomIn, ZoomOut } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getLibraryFileDownloadUrl } from "@/lib/actions/project-library";
import { getLibraryFilePreviewMode } from "@/lib/library/file-preview";
import { cn } from "@/lib/utils";

const IMAGE_ZOOM_MIN = 0.5;
const IMAGE_ZOOM_MAX = 4;
const IMAGE_ZOOM_STEP = 0.25;
/** Scroll / trackpad: scale per pixel of deltaY (batched per animation frame). */
const IMAGE_WHEEL_ZOOM_SCALE = 0.0012;
const PREVIEW_MAX_HEIGHT = "min(78vh, 1200px)";
/** Leave room below the picture so native controls (timeline) are not clipped. */
const VIDEO_PREVIEW_MAX_HEIGHT = "calc(min(78vh, 1200px) - 3rem)";

function clampImageZoom(value) {
  return Math.min(IMAGE_ZOOM_MAX, Math.max(IMAGE_ZOOM_MIN, Math.round(value * 100) / 100));
}

/** @param {WheelEvent} event */
function isImageZoomWheelGesture(event) {
  return event.ctrlKey || event.metaKey;
}

function normalizeWheelDelta(event) {
  let { deltaX, deltaY } = event;
  if (event.deltaMode === 1) {
    deltaX *= 18;
    deltaY *= 18;
  } else if (event.deltaMode === 2) {
    deltaX *= 120;
    deltaY *= 120;
  }
  return { deltaX, deltaY };
}

/**
 * @param {{
 *   open: boolean;
 *   onOpenChange: (open: boolean) => void;
 *   projectId: string;
 *   file: null | {
 *     fileId: string;
 *     name: string;
 *     type: string;
 *     mimeType: string | null;
 *     uploadedBy?: string;
 *     uploadedByAvatar?: string | null;
 *     uploadedAt?: string;
 *     description?: string;
 *   };
 *   onDownload?: (fileId: string) => void;
 * }} props
 */
export function LibraryFilePreviewDialog({
  open,
  onOpenChange,
  projectId,
  file,
  onDownload,
}) {
  const [url, setUrl] = useState(/** @type {string | null} */ (null));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(/** @type {string | null} */ (null));
  const [imageZoom, setImageZoom] = useState(1);
  const [imagePan, setImagePan] = useState({ x: 0, y: 0 });
  const [isPanDragging, setIsPanDragging] = useState(false);
  const wheelAccumRef = useRef({ zoom: 0, panX: 0, panY: 0 });
  const wheelFrameRef = useRef(/** @type {number | null} */ (null));
  const pointerDragRef = useRef(
    /** @type {null | { pointerId: number; startX: number; startY: number; panX: number; panY: number }} */ (
      null
    )
  );

  const mode = file ? getLibraryFilePreviewMode(file.type, file.mimeType) : null;
  const isImagePreview = mode === "image";
  const isVideoPreview = mode === "video";

  const loadUrl = useCallback(async () => {
    if (!file?.fileId || !projectId) return;
    setLoading(true);
    setError(null);
    setUrl(null);
    const res = await getLibraryFileDownloadUrl(String(projectId), String(file.fileId));
    setLoading(false);
    if (!res.ok || !res.url) {
      setError(res.error || "Could not load preview");
      return;
    }
    setUrl(res.url);
  }, [file?.fileId, projectId]);

  useEffect(() => {
    if (!open || !file) {
      setUrl(null);
      setError(null);
      setLoading(false);
      setImageZoom(1);
      setImagePan({ x: 0, y: 0 });
      setIsPanDragging(false);
      pointerDragRef.current = null;
      wheelAccumRef.current = { zoom: 0, panX: 0, panY: 0 };
      if (wheelFrameRef.current != null) {
        cancelAnimationFrame(wheelFrameRef.current);
        wheelFrameRef.current = null;
      }
      return;
    }
    setImageZoom(1);
    setImagePan({ x: 0, y: 0 });
    setIsPanDragging(false);
    pointerDragRef.current = null;
    wheelAccumRef.current = { zoom: 0, panX: 0, panY: 0 };
    void loadUrl();
  }, [open, file, loadUrl]);

  const zoomIn = useCallback(() => {
    setImageZoom((z) => clampImageZoom(z + IMAGE_ZOOM_STEP));
  }, []);

  const zoomOut = useCallback(() => {
    setImageZoom((z) => clampImageZoom(z - IMAGE_ZOOM_STEP));
  }, []);

  const resetZoom = useCallback(() => {
    setImageZoom(1);
    setImagePan({ x: 0, y: 0 });
  }, []);

  useEffect(() => {
    if (imageZoom <= 1) {
      setImagePan({ x: 0, y: 0 });
    }
  }, [imageZoom]);

  const flushWheelFrame = useCallback(() => {
    wheelFrameRef.current = null;
    const { zoom, panX, panY } = wheelAccumRef.current;
    wheelAccumRef.current = { zoom: 0, panX: 0, panY: 0 };

    if (panX || panY) {
      setImagePan((p) => ({ x: p.x - panX, y: p.y - panY }));
    }

    if (!zoom) return;
    const zoomDelta = -zoom * IMAGE_WHEEL_ZOOM_SCALE;
    if (Math.abs(zoomDelta) < 0.004) return;
    setImageZoom((z) => clampImageZoom(z + zoomDelta));
  }, []);

  const scheduleWheelFlush = useCallback(() => {
    if (wheelFrameRef.current == null) {
      wheelFrameRef.current = requestAnimationFrame(flushWheelFrame);
    }
  }, [flushWheelFrame]);

  const handleImageWheel = useCallback(
    (event) => {
      if (!isImagePreview) return;
      event.preventDefault();

      const { deltaX, deltaY } = normalizeWheelDelta(event);
      const pinchOrCtrlZoom = isImageZoomWheelGesture(event);
      const panWithScroll = imageZoom > 1 && !pinchOrCtrlZoom;

      if (panWithScroll) {
        wheelAccumRef.current.panX += deltaX;
        wheelAccumRef.current.panY += deltaY;
      } else {
        wheelAccumRef.current.zoom += deltaY;
      }

      scheduleWheelFlush();
    },
    [imageZoom, isImagePreview, scheduleWheelFlush]
  );

  const handlePanPointerDown = useCallback(
    (event) => {
      if (imageZoom <= 1) return;
      event.preventDefault();
      pointerDragRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        panX: imagePan.x,
        panY: imagePan.y,
      };
      setIsPanDragging(true);
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    [imagePan.x, imagePan.y, imageZoom]
  );

  const handlePanPointerMove = useCallback((event) => {
    const drag = pointerDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    setImagePan({
      x: drag.panX + event.clientX - drag.startX,
      y: drag.panY + event.clientY - drag.startY,
    });
  }, []);

  const endPanPointer = useCallback((event) => {
    const drag = pointerDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    pointerDragRef.current = null;
    setIsPanDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (wheelFrameRef.current != null) {
        cancelAnimationFrame(wheelFrameRef.current);
      }
      wheelAccumRef.current = { zoom: 0, panX: 0, panY: 0 };
      wheelFrameRef.current = null;
      pointerDragRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!open || !isImagePreview) return;

    const onKeyDown = (event) => {
      if (event.key === "+" || event.key === "=") {
        event.preventDefault();
        zoomIn();
      } else if (event.key === "-" || event.key === "_") {
        event.preventDefault();
        zoomOut();
      } else if (event.key === "0") {
        event.preventDefault();
        resetZoom();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, isImagePreview, zoomIn, zoomOut, resetZoom]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "flex h-[min(92vh,900px)] max-h-[min(92vh,900px)] w-[min(96vw,1600px)] !max-w-[min(96vw,1600px)] flex-col gap-4 overflow-hidden p-4 sm:!max-w-[min(96vw,1600px)] sm:p-6"
        )}
        showCloseButton
      >
        <DialogHeader className="shrink-0 gap-3 pr-10 text-left">
          <DialogTitle className="text-lg font-semibold leading-snug sm:text-xl">
            {file?.name ?? "File preview"}
          </DialogTitle>

          {file ? (
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <Avatar className="h-5 w-5">
                <AvatarImage
                  src={file.uploadedByAvatar || undefined}
                  alt={file.uploadedBy || "Member"}
                />
                <AvatarFallback className="text-xs">
                  {(file.uploadedBy || "M").charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-muted-foreground">
                {file.uploadedBy || "Member"}
              </span>
              <span className="text-sm text-muted-foreground">•</span>
              <span className="text-sm text-muted-foreground">{file.uploadedAt}</span>
            </div>
          ) : null}

          {file?.description ? (
            <p className="text-sm leading-relaxed text-muted-foreground">{file.description}</p>
          ) : null}
        </DialogHeader>

        <div
          className={cn(
            "relative flex min-h-0 w-full flex-1 flex-col rounded-lg border border-border/80 bg-muted/30",
            isImagePreview && "overflow-hidden",
            isVideoPreview && "overflow-auto",
            !isImagePreview && !isVideoPreview && "items-center justify-center overflow-hidden"
          )}
          onWheel={isImagePreview ? handleImageWheel : undefined}
        >
          {loading ? (
            <div className="flex flex-col items-center gap-3 py-24 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin" aria-hidden />
              <p className="text-sm">Loading preview…</p>
            </div>
          ) : null}

          {!loading && error ? (
            <p className="px-6 py-16 text-center text-sm text-destructive">{error}</p>
          ) : null}

          {!loading && !error && url && isImagePreview ? (
            <>
              <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-0.5 rounded-full border border-border/80 bg-background/95 p-1 shadow-md backdrop-blur-sm">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="h-8 w-8 rounded-full"
                  aria-label="Zoom out"
                  disabled={imageZoom <= IMAGE_ZOOM_MIN}
                  onClick={zoomOut}
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="min-w-[3.25rem] select-none text-center text-xs font-medium tabular-nums text-muted-foreground">
                  {Math.round(imageZoom * 100)}%
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="h-8 w-8 rounded-full"
                  aria-label="Zoom in"
                  disabled={imageZoom >= IMAGE_ZOOM_MAX}
                  onClick={zoomIn}
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="h-8 w-8 rounded-full"
                  aria-label="Reset zoom"
                  disabled={imageZoom === 1}
                  onClick={resetZoom}
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </Button>
              </div>

              <div
                className={cn(
                  "flex min-h-full min-w-full touch-none select-none items-center justify-center p-6",
                  imageZoom > 1 && (isPanDragging ? "cursor-grabbing" : "cursor-grab")
                )}
                onPointerDown={handlePanPointerDown}
                onPointerMove={handlePanPointerMove}
                onPointerUp={endPanPointer}
                onPointerCancel={endPanPointer}
              >
                <img
                  src={url}
                  alt={file?.name ?? "Preview"}
                  draggable={false}
                  className={cn(
                    "max-w-none origin-center object-contain will-change-transform",
                    !isPanDragging && "transition-transform duration-300 ease-out"
                  )}
                  style={{
                    transform: `translate(${imagePan.x}px, ${imagePan.y}px) scale(${imageZoom})`,
                    maxHeight: PREVIEW_MAX_HEIGHT,
                  }}
                />
              </div>
            </>
          ) : null}

          {!loading && !error && url && mode === "pdf" ? (
            <iframe
              title={file?.name ?? "PDF preview"}
              src={url}
              className="h-full min-h-0 w-full flex-1 bg-white"
            />
          ) : null}

          {!loading && !error && url && isVideoPreview ? (
            <div className="flex w-full min-h-0 flex-1 items-center justify-center p-4 pb-8">
              <video
                src={url}
                controls
                playsInline
                preload="metadata"
                className="h-auto w-full max-w-full bg-black object-contain"
                style={{ maxHeight: VIDEO_PREVIEW_MAX_HEIGHT }}
              >
                <track kind="captions" />
              </video>
            </div>
          ) : null}

          {!loading && !error && url && mode === "audio" ? (
            <div className="flex w-full max-w-2xl flex-col items-center gap-4 px-8 py-16">
              <p className="text-center text-sm text-muted-foreground">Audio preview</p>
              <audio src={url} controls className="w-full">
                <track kind="captions" />
              </audio>
            </div>
          ) : null}
        </div>

        {file ? (
          <div className="flex shrink-0 justify-end border-t border-border/60 pt-3">
            <Button
              type="button"
              variant="outline"
              className="gap-2"
              onClick={() => onDownload?.(file.fileId)}
            >
              <Download className="h-4 w-4" />
              Download
            </Button>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
