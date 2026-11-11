"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

const HEARTBEAT_MS = 60_000;
const MIN_GAP_MS = 30_000;

/** Marks the signed-in user as online while a Mably tab is visible. Renders nothing. */
export function PresenceHeartbeat() {
  useEffect(() => {
    const supabase = createClient();
    let lastSentAt = 0;

    const beat = () => {
      if (document.visibilityState !== "visible") return;
      const now = Date.now();
      if (now - lastSentAt < MIN_GAP_MS) return;
      lastSentAt = now;
      void supabase.rpc("touch_user_presence").then(({ error }) => {
        if (error) lastSentAt = 0;
      });
    };

    beat();
    const timer = window.setInterval(beat, HEARTBEAT_MS);
    document.addEventListener("visibilitychange", beat);
    window.addEventListener("focus", beat);

    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", beat);
      window.removeEventListener("focus", beat);
    };
  }, []);

  return null;
}
