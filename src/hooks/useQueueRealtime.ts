"use client";

import { useEffect, useRef } from "react";
import { getSupabaseAnonClient } from "@/lib/db/supabase-client";

export function useQueueRealtime(
  onUpdate: () => void,
  options?: { enabled?: boolean; pollIntervalMs?: number; key?: string }
) {
  const enabled = options?.enabled ?? true;
  const pollIntervalMs = options?.pollIntervalMs ?? 4500;
  const key = options?.key ?? "default";
  const callbackRef = useRef(onUpdate);
  callbackRef.current = onUpdate;

  useEffect(() => {
    if (!enabled) return;

    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        callbackRef.current();
      }
    }, pollIntervalMs);

    const supabase = getSupabaseAnonClient();
    const channel = supabase
      ? supabase
          .channel(`queue-realtime-${key}`)
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "queue_states" },
            () => {
              callbackRef.current();
            }
          )
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "appointments" },
            () => {
              callbackRef.current();
            }
          )
          .subscribe()
      : null;

    return () => {
      window.clearInterval(timer);
      if (supabase && channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [enabled, pollIntervalMs, key]);
}
