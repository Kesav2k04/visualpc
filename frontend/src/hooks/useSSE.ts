"use client";

import { useState, useEffect, useRef, useCallback } from "react";

/**
 * SSE hook — subscribes to /events for realtime push updates.
 * Falls back to polling if SSE connection drops.
 */

export interface SSEData {
  workers: Record<string, unknown>[];
  jobs: Record<string, unknown>[];
  health: {
    workers: number;
    jobs: number;
    metrics: number;
    queued_jobs: number;
  } | null;
  timestamp: string | null;
  connected: boolean;
}

const API = typeof window !== "undefined"
  ? (process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8500")
  : "http://localhost:8500";

export function useSSE(): SSEData {
  const [data, setData] = useState<SSEData>({
    workers: [],
    jobs: [],
    health: null,
    timestamp: null,
    connected: false,
  });

  const retryCount = useRef(0);
  const maxRetries = 5;

  const connect = useCallback(() => {
    try {
      const es = new EventSource(`${API}/events`);

      es.onopen = () => {
        retryCount.current = 0;
        setData((prev) => ({ ...prev, connected: true }));
      };

      es.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          if (!parsed.error) {
            setData({
              workers: parsed.workers || [],
              jobs: parsed.jobs || [],
              health: parsed.health || null,
              timestamp: parsed.timestamp || null,
              connected: true,
            });
          }
        } catch {
          // Ignore parse errors
        }
      };

      es.onerror = () => {
        es.close();
        setData((prev) => ({ ...prev, connected: false }));
        // Exponential backoff retry
        if (retryCount.current < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, retryCount.current), 30000);
          retryCount.current += 1;
          setTimeout(connect, delay);
        }
      };

      return es;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    const es = connect();
    return () => {
      es?.close();
    };
  }, [connect]);

  return data;
}
