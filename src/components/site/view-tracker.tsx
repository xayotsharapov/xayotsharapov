"use client";
import { useEffect, useRef } from "react";

/** Fires one view ping per page load. The server decides whether it counts. */
export function ViewTracker({ postId }: { postId: string }) {
  const sent = useRef(false);
  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    fetch("/api/views", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ postId }),
      keepalive: true,
    }).catch(() => {});
  }, [postId]);
  return null;
}
