"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { getWebPushPublicKey, savePushSubscription } from "@/lib/actions/push-subscription";
import {
  ensurePushSubscription,
  formatPushSubscribeError,
} from "@/lib/client/ensure-push-subscription";
import { serializePushSubscription } from "@/lib/client/web-push";

export const PUSH_PROMPT_DISMISS_KEY = "mably:push-prompt:dismissed";

export function pushSupported() {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

function readPromptDismissed() {
  try {
    return window.localStorage.getItem(PUSH_PROMPT_DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}

/**
 * Registers SW, loads VAPID public key, syncs subscription when permission is granted.
 */
export function useWebPush() {
  const supported = pushSupported();
  const [ready, setReady] = useState(false);
  const [configured, setConfigured] = useState(false);
  const [publicKey, setPublicKey] = useState("");
  const [permission, setPermission] = useState(
    typeof Notification !== "undefined" ? Notification.permission : "default"
  );
  const [promptDismissed, setPromptDismissed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const syncSubscription = useCallback(
    async (vapidPublicKey, { quiet = false } = {}) => {
      if (!pushSupported() || !vapidPublicKey) return { ok: false };
      if (Notification.permission !== "granted") return { ok: false };

      try {
        const sub = await ensurePushSubscription(vapidPublicKey);
        const saved = await savePushSubscription({
          subscription: serializePushSubscription(sub),
          userAgent: navigator.userAgent,
        });
        if (!saved.ok) {
          const msg = saved.error ?? "Could not save subscription";
          setError(msg);
          if (!quiet) toast.error(msg);
          return { ok: false, error: msg };
        }
        setError("");
        return { ok: true };
      } catch (err) {
        const msg = formatPushSubscribeError(err);
        setError(msg);
        if (!quiet) toast.error(msg);
        return { ok: false, error: msg };
      }
    },
    []
  );

  useEffect(() => {
    if (!supported) {
      setReady(true);
      return;
    }

    let cancelled = false;
    setPromptDismissed(readPromptDismissed());

    void (async () => {
      const r = await getWebPushPublicKey();
      if (cancelled) return;

      const perm = Notification.permission;
      setPermission(perm);

      if (!r.ok || !r.configured || !r.publicKey) {
        setConfigured(false);
        setReady(true);
        return;
      }

      setConfigured(true);
      setPublicKey(r.publicKey);

      if (perm === "granted") {
        await syncSubscription(r.publicKey, { quiet: true });
      }

      setReady(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [supported, syncSubscription]);

  const enable = useCallback(async () => {
    if (!publicKey || busy) return permission;
    setBusy(true);
    setError("");
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      try {
        window.localStorage.removeItem(PUSH_PROMPT_DISMISS_KEY);
      } catch {
        /* ignore */
      }
      setPromptDismissed(false);
      if (result === "granted") {
        const synced = await syncSubscription(publicKey);
        if (synced.ok) {
          toast.success("Browser notifications enabled");
        }
      } else if (result === "denied") {
        const msg = "Notifications were blocked. Allow them in browser site settings.";
        setError(msg);
        toast.error(msg);
      }
      return result;
    } finally {
      setBusy(false);
    }
  }, [publicKey, busy, syncSubscription, permission]);

  const dismissPrompt = useCallback(() => {
    try {
      window.localStorage.setItem(PUSH_PROMPT_DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
    setPromptDismissed(true);
  }, []);

  const showAutoPrompt =
    ready && supported && configured && permission === "default" && !promptDismissed;

  const syncSubscriptionExposed = useCallback(
    async () => {
      if (!publicKey) return { ok: false, error: "Push not configured" };
      return syncSubscription(publicKey);
    },
    [publicKey, syncSubscription]
  );

  return {
    ready,
    supported,
    configured,
    permission,
    busy,
    error,
    enable,
    syncSubscription: syncSubscriptionExposed,
    dismissPrompt,
    showAutoPrompt,
  };
}
