"use client";

/**
 * Upload raw bytes to Supabase `project-library` (same path pattern as library files / voice notes).
 *
 * @param {{
 *   blob: Blob;
 *   objectPath: string;
 *   accessToken: string;
 *   onProgress?: (s: { percent: number }) => void;
 *   getXhr?: (xhr: XMLHttpRequest) => void;
 * }} args
 * @returns {Promise<{ ok: true } | { ok: false; error: string }>}
 */
export function uploadProjectLibraryBlobWithProgress({
  blob,
  objectPath,
  accessToken,
  onProgress,
  getXhr,
}) {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    getXhr?.(xhr);

    const baseUrl = String(process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/+$/, "");
    const anonKey = String(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim();
    if (!baseUrl || !anonKey || !accessToken) {
      resolve({ ok: false, error: "Supabase client configuration is missing." });
      return;
    }

    const encodedPath = objectPath
      .split("/")
      .map((p) => encodeURIComponent(p))
      .join("/");

    xhr.open("POST", `${baseUrl}/storage/v1/object/project-library/${encodedPath}`);
    xhr.responseType = "json";
    xhr.setRequestHeader("apikey", anonKey);
    xhr.setRequestHeader("authorization", `Bearer ${accessToken}`);
    xhr.setRequestHeader("x-upsert", "false");
    xhr.setRequestHeader("content-type", blob.type || "application/octet-stream");

    let maxRealPercent = 0;
    let uploadBodyDone = false;
    let requestDone = false;
    let rafId = 0;
    const t0 = performance.now();
    const size = Math.max(blob.size, 1);
    const estDurationMs = Math.max(800, Math.min(90_000, (size / (64 * 1024)) * 800));

    const emitSending = () => {
      if (!onProgress || uploadBodyDone || requestDone) return;
      const elapsed = performance.now() - t0;
      const t = Math.min(1, elapsed / estDurationMs);
      const simulated = Math.min(93, Math.round((1 - (1 - t) ** 2) * 93));
      const percent = Math.min(99, Math.max(simulated, maxRealPercent));
      onProgress({ percent });
    };

    const stopPulse = () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = 0;
      }
    };

    const pulse = () => {
      emitSending();
      if (!uploadBodyDone && !requestDone) {
        rafId = requestAnimationFrame(pulse);
      }
    };

    xhr.upload.onprogress = (e) => {
      if (!onProgress || uploadBodyDone) return;
      const baseTotal = e.lengthComputable && e.total > 0 ? e.total : size;
      const denom = Math.max(baseTotal, e.loaded, 1);
      const p = Math.min(99, Math.round((e.loaded / denom) * 100));
      maxRealPercent = Math.max(maxRealPercent, p);
      emitSending();
    };

    xhr.upload.onloadstart = () => {
      emitSending();
    };

    xhr.upload.onload = () => {
      uploadBodyDone = true;
      stopPulse();
      onProgress?.({ percent: 100 });
    };

    const finish = (result) => {
      requestDone = true;
      uploadBodyDone = true;
      stopPulse();
      resolve(result);
    };

    xhr.addEventListener("load", () => {
      let body = xhr.response;
      if (typeof body === "string") {
        try {
          body = JSON.parse(body);
        } catch {
          body = { ok: false, error: "Invalid response from Supabase Storage" };
        }
      }
      if (xhr.status >= 200 && xhr.status < 300) {
        finish({ ok: true });
        return;
      }
      if (body && typeof body === "object" && "message" in body) {
        finish({ ok: false, error: String(body.message || "Upload failed") });
        return;
      }
      finish({ ok: false, error: `Upload failed (${xhr.status})` });
    });

    xhr.addEventListener("error", () => {
      finish({ ok: false, error: "Network error. Check your connection and try again." });
    });

    xhr.addEventListener("abort", () => {
      finish({ ok: false, error: "Upload cancelled." });
    });

    rafId = requestAnimationFrame(pulse);
    xhr.send(blob);
  });
}
