"use client";

import { useEffect, useRef, useState, type MutableRefObject } from "react";
import type { ExploreResults, ExploreTab } from "./contract";

type ExploreRefreshOptions = {
  paramsKey: string;
  sequence: number;
  sequenceRef: MutableRefObject<number>;
  signal: AbortSignal;
  onResult: (results: ExploreResults) => void;
  onError: () => void;
  onFinish: () => void;
};

async function requestExploreResults(
  paramsKey: string,
  signal: AbortSignal,
): Promise<ExploreResults> {
  const suffix = paramsKey ? `?${paramsKey}` : "";
  const response = await fetch(`/api/explore${suffix}`, { signal });
  if (!response.ok) {
    throw new Error(
      `Explore API returned status ${response.status}; expected 200.`,
    );
  }

  return response.json() as Promise<ExploreResults>;
}

function logExploreRequestError(paramsKey: string, error: unknown): void {
  console.error(
    JSON.stringify({
      event: "explore_results_request_failed",
      query: paramsKey,
      error: error instanceof Error ? error.message : String(error),
    }),
  );
}

async function refreshExploreResults(options: ExploreRefreshOptions) {
  try {
    const results = await requestExploreResults(
      options.paramsKey,
      options.signal,
    );
    if (options.sequence === options.sequenceRef.current) {
      options.onResult(results);
    }
  } catch (error) {
    if (
      options.signal.aborted ||
      options.sequence !== options.sequenceRef.current
    )
      return;
    logExploreRequestError(options.paramsKey, error);
    options.onError();
  } finally {
    if (options.sequence === options.sequenceRef.current) options.onFinish();
  }
}

function scheduleExploreRefresh(options: ExploreRefreshOptions): () => void {
  const timer = window.setTimeout(() => {
    void refreshExploreResults(options);
  }, 120);

  return () => {
    window.clearTimeout(timer);
  };
}

/** Owns debounced, cancelable explore requests. Example: `useExploreResults(initial, key, tab, onResult)`. */
export function useExploreResults(
  initialResults: ExploreResults,
  paramsKey: string,
  activeTab: ExploreTab,
  onResult: (results: ExploreResults, activeTab: ExploreTab) => void,
) {
  const [results, setResults] = useState(initialResults);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [retryToken, setRetryToken] = useState(0);
  const initialRender = useRef(true);
  const requestSequence = useRef(0);

  useEffect(() => {
    if (initialRender.current) {
      initialRender.current = false;

      return;
    }

    const controller = new AbortController();
    const sequence = ++requestSequence.current;
    setLoading(true);
    setError(false);
    const cancelTimer = scheduleExploreRefresh({
      paramsKey,
      sequence,
      sequenceRef: requestSequence,
      signal: controller.signal,
      onResult: (next) => {
        setResults(next);
        onResult(next, activeTab);
      },
      onError: () => setError(true),
      onFinish: () => setLoading(false),
    });

    return () => {
      cancelTimer();
      controller.abort();
    };
  }, [activeTab, onResult, paramsKey, retryToken]);

  return {
    error,
    loading,
    results,
    retry: () => setRetryToken((value) => value + 1),
  };
}
