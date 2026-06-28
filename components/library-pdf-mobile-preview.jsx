"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, RotateCcw, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const PDF_ZOOM_MIN = 0.5;
const PDF_ZOOM_MAX = 3;
const PDF_ZOOM_STEP = 0.25;
const PDF_ZOOM_RENDER_DEBOUNCE_MS = 120;

function clampPdfZoom(value) {
  return Math.min(PDF_ZOOM_MAX, Math.max(PDF_ZOOM_MIN, Math.round(value * 100) / 100));
}

/** pdfjs v6+ entry — configures the worker for Next/Turbopack bundling. */
async function loadPdfJs() {
  return import("pdfjs-dist/webpack.mjs");
}

async function loadPdfBytes(previewPath) {
  const absoluteUrl = new URL(previewPath, window.location.origin).href;
  const response = await fetch(absoluteUrl, { credentials: "include" });
  if (!response.ok) {
    throw new Error(`Preview fetch failed (${response.status})`);
  }
  return new Uint8Array(await response.arrayBuffer());
}

/**
 * Mobile PDF preview — fit-to-width at 100%, native-size render when zoomed.
 *
 * @param {{
 *   projectId: string;
 *   fileId: string;
 *   versionId?: string | null;
 *   fileName?: string;
 * }} props
 */
export function LibraryPdfMobilePreview({ projectId, fileId, versionId, fileName }) {
  const [zoom, setZoom] = useState(1);
  const [loading, setLoading] = useState(true);
  const [rendering, setRendering] = useState(false);
  const [error, setError] = useState(/** @type {string | null} */ (null));

  const scrollRef = useRef(/** @type {HTMLDivElement | null} */ (null));
  const pagesRef = useRef(/** @type {HTMLDivElement | null} */ (null));
  const pdfDocRef = useRef(/** @type {import('pdfjs-dist').PDFDocumentProxy | null} */ (null));
  const loadTaskRef = useRef(/** @type {import('pdfjs-dist').PDFDocumentLoadingTask | null} */ (null));
  const renderTokenRef = useRef(0);
  const zoomRef = useRef(zoom);
  const pinchRef = useRef(
    /** @type {null | { distance: number; zoom: number }} */ (null)
  );
  const renderPagesRef = useRef(/** @type {() => Promise<void>} */ (async () => {}));

  const previewUrl = `/api/project-library/preview?projectId=${encodeURIComponent(projectId)}&fileId=${encodeURIComponent(fileId)}${
    versionId ? `&versionId=${encodeURIComponent(String(versionId))}` : ""
  }`;

  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  const renderPages = useCallback(async () => {
    const pdf = pdfDocRef.current;
    const scrollEl = scrollRef.current;
    const pagesEl = pagesRef.current;
    if (!pdf || !scrollEl || !pagesEl) return;

    const token = ++renderTokenRef.current;
    const currentZoom = zoomRef.current;
    const horizontalPadding = currentZoom > 1 ? 0 : 24;
    const containerWidth = Math.max(scrollEl.clientWidth - horizontalPadding, 240);
    const dpr = Math.min(window.devicePixelRatio || 1, 3);

    setRendering(true);
    pagesEl.replaceChildren([]);

    try {
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        if (token !== renderTokenRef.current) return;

        const baseViewport = page.getViewport({ scale: 1 });
        const fitScale = containerWidth / baseViewport.width;
        const viewport = page.getViewport({ scale: fitScale * currentZoom });
        const pageWidth = Math.floor(viewport.width);
        const pageHeight = Math.floor(viewport.height);

        const row = document.createElement("div");
        row.className = "flex shrink-0 justify-start";

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) continue;

        canvas.width = Math.floor(viewport.width * dpr);
        canvas.height = Math.floor(viewport.height * dpr);
        canvas.style.width = `${pageWidth}px`;
        canvas.style.height = `${pageHeight}px`;
        canvas.className = "block shrink-0 rounded-sm bg-white shadow-sm";
        canvas.setAttribute("role", "img");
        canvas.setAttribute(
          "aria-label",
          `${fileName || "PDF"} — page ${pageNum} of ${pdf.numPages}`
        );

        if (dpr !== 1) {
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        }

        await page.render({ canvasContext: ctx, viewport }).promise;
        if (token !== renderTokenRef.current) return;

        row.appendChild(canvas);
        pagesEl.appendChild(row);
      }
    } catch (e) {
      console.error("[pdf-preview] render:", e);
    } finally {
      if (token === renderTokenRef.current) {
        setRendering(false);
      }
    }
  }, [fileName]);

  useEffect(() => {
    renderPagesRef.current = renderPages;
  }, [renderPages]);

  useEffect(() => {
    let cancelled = false;
    const loadToken = ++renderTokenRef.current;

    async function load() {
      setLoading(true);
      setError(null);
      setZoom(1);
      pagesRef.current?.replaceChildren([]);
      const prevTask = loadTaskRef.current;
      loadTaskRef.current = null;
      pdfDocRef.current = null;
      if (prevTask) void prevTask.destroy();

      try {
        const [pdfjs, bytes] = await Promise.all([loadPdfJs(), loadPdfBytes(previewUrl)]);
        const task = pdfjs.getDocument({ data: bytes });
        loadTaskRef.current = task;
        const pdf = await task.promise;
        if (cancelled || loadToken !== renderTokenRef.current) {
          void task.destroy();
          if (loadTaskRef.current === task) loadTaskRef.current = null;
          return;
        }
        pdfDocRef.current = pdf;
        setLoading(false);
        requestAnimationFrame(() => {
          if (loadToken === renderTokenRef.current) void renderPagesRef.current();
        });
      } catch (e) {
        console.error("[pdf-preview] load:", e);
        if (!cancelled && loadToken === renderTokenRef.current) {
          setError("Could not load PDF preview");
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
      renderTokenRef.current++;
      pdfDocRef.current = null;
      const task = loadTaskRef.current;
      loadTaskRef.current = null;
      if (task) void task.destroy();
    };
  }, [previewUrl]);

  useEffect(() => {
    if (loading || error || !pdfDocRef.current) return;

    const timer = window.setTimeout(() => {
      void renderPages();
    }, PDF_ZOOM_RENDER_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [zoom, loading, error, renderPages]);

  useEffect(() => {
    const scrollEl = scrollRef.current;
    if (!scrollEl) return;

    const ro = new ResizeObserver(() => {
      if (pdfDocRef.current && !loading) void renderPages();
    });
    ro.observe(scrollEl);
    return () => ro.disconnect();
  }, [loading, renderPages]);

  const zoomIn = useCallback(() => {
    setZoom((z) => clampPdfZoom(z + PDF_ZOOM_STEP));
  }, []);

  const zoomOut = useCallback(() => {
    setZoom((z) => clampPdfZoom(z - PDF_ZOOM_STEP));
  }, []);

  const resetZoom = useCallback(() => {
    setZoom(1);
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = 0;
      scrollRef.current.scrollTop = 0;
    }
  }, []);

  const handleTouchStart = useCallback(
    (event) => {
      if (event.touches.length !== 2) {
        pinchRef.current = null;
        return;
      }
      const [a, b] = event.touches;
      const distance = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
      pinchRef.current = { distance, zoom };
    },
    [zoom]
  );

  const handleTouchMove = useCallback((event) => {
    const pinch = pinchRef.current;
    if (!pinch || event.touches.length !== 2) return;
    event.preventDefault();
    const [a, b] = event.touches;
    const distance = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
    if (!pinch.distance) return;
    const ratio = distance / pinch.distance;
    setZoom(clampPdfZoom(pinch.zoom * ratio));
  }, []);

  const handleTouchEnd = useCallback(() => {
    pinchRef.current = null;
  }, []);

  const isZoomed = zoom > 1;

  return (
    <div className="relative flex min-h-0 w-full flex-1 flex-col">
      <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-0.5 rounded-full border border-border/80 bg-background/95 p-1 shadow-md backdrop-blur-sm">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="h-8 w-8 rounded-full"
          aria-label="Zoom out"
          disabled={zoom <= PDF_ZOOM_MIN || loading || rendering}
          onClick={zoomOut}
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <span className="min-w-[3.25rem] select-none text-center text-xs font-medium tabular-nums text-muted-foreground">
          {Math.round(zoom * 100)}%
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="h-8 w-8 rounded-full"
          aria-label="Zoom in"
          disabled={zoom >= PDF_ZOOM_MAX || loading || rendering}
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
          disabled={zoom === 1 || loading || rendering}
          onClick={resetZoom}
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div
        ref={scrollRef}
        className={cn(
          "min-h-0 flex-1 overflow-auto overscroll-contain py-4",
          isZoomed ? "px-0" : "px-3",
          loading ? "flex items-center justify-center" : ""
        )}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
      >
        {loading ? (
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin" aria-hidden />
            <p className="text-sm">Loading PDF…</p>
          </div>
        ) : null}

        {!loading && error ? (
          <p className="px-4 py-12 text-center text-sm text-destructive">{error}</p>
        ) : null}

        {!loading && !error ? (
          <div
            ref={pagesRef}
            className={cn(
              "flex flex-col gap-4 pb-14",
              isZoomed ? "w-max min-w-0" : "mx-auto w-full"
            )}
          />
        ) : null}
      </div>
    </div>
  );
}
