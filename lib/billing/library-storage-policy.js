import { hasPaidFreelancerSubscription } from "@/lib/billing/project-limits";

export const STORAGE_GIB = 1024 ** 3;
export const STORAGE_MIB = 1024 ** 2;

/** Total library bytes across all projects for the billing account (Starter). */
export const STARTER_LIBRARY_TOTAL_BYTES = 1 * STORAGE_GIB;

/** Total library bytes across all projects for the billing account (Growth). */
export const GROWTH_LIBRARY_TOTAL_BYTES = 50 * STORAGE_GIB;

/** Starter: max single library file. */
export const STARTER_LIBRARY_MAX_FILE_BYTES = 10 * STORAGE_MIB;

/**
 * Growth: per-file cap matches Supabase `project-library` bucket `file_size_limit`.
 */
export const GROWTH_LIBRARY_MAX_FILE_BYTES = 2 * STORAGE_GIB;

export const STARTER_LIBRARY_MAX_FILE_LABEL = "10 MB";
export const GROWTH_LIBRARY_MAX_FILE_LABEL = "2 GB";

/**
 * @param {{ plan_key?: string | null; status?: string | null } | null | undefined} subscription
 * @returns {{
 *   totalBytes: number;
 *   maxFileBytes: number;
 *   maxFileLabel: string;
 *   planKey: string | null;
 *   paid: boolean;
 * }}
 */
export function getLibraryStorageCaps(subscription) {
  const paid = hasPaidFreelancerSubscription(subscription);
  const plan = String(subscription?.plan_key ?? "").toLowerCase();

  if (!paid) {
    return {
      totalBytes: STARTER_LIBRARY_TOTAL_BYTES,
      maxFileBytes: STARTER_LIBRARY_MAX_FILE_BYTES,
      maxFileLabel: STARTER_LIBRARY_MAX_FILE_LABEL,
      planKey: plan || null,
      paid: false,
    };
  }

  if (plan === "growth") {
    return {
      totalBytes: GROWTH_LIBRARY_TOTAL_BYTES,
      maxFileBytes: GROWTH_LIBRARY_MAX_FILE_BYTES,
      maxFileLabel: GROWTH_LIBRARY_MAX_FILE_LABEL,
      planKey: "growth",
      paid: true,
    };
  }

  return {
    totalBytes: STARTER_LIBRARY_TOTAL_BYTES,
    maxFileBytes: STARTER_LIBRARY_MAX_FILE_BYTES,
    maxFileLabel: STARTER_LIBRARY_MAX_FILE_LABEL,
    planKey: plan === "starter" ? "starter" : "starter",
    paid: true,
  };
}

/**
 * @param {number} n
 * @returns {string}
 */
export function formatStorageShort(n) {
  const x = Number(n);
  if (!Number.isFinite(x) || x < 0) return "0 MB";
  if (x >= STORAGE_GIB) {
    const gb = x / STORAGE_GIB;
    const digits = gb >= 10 ? 0 : 1;
    return `${gb.toFixed(digits)} GB`;
  }
  if (x >= STORAGE_MIB) {
    const mb = x / STORAGE_MIB;
    return `${mb >= 10 ? mb.toFixed(0) : mb.toFixed(1)} MB`;
  }
  if (x >= 1024) return `${(x / 1024).toFixed(0)} KB`;
  return `${Math.round(x)} B`;
}
