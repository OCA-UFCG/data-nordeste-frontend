"use client";
import { useRef, useState } from "react";
import type { PibPanel, PibPanelSelection } from "@/features/panels/pibPanel";
import { toPibSelectionQuery } from "@/features/panels/pibSelection";

export type PibPanelState = {
  panel: PibPanel;
  isLoading: boolean;
  hasError: boolean;
  select: (selection: PibPanelSelection) => void;
};

/**
 * Holds the panel for the current filters and refetches it through
 * `/api/paineis/pib` when they change. The server-rendered panel is the start.
 * Example: `const { panel, select } = usePibPanel(initialPanel)`.
 */
export function usePibPanel(initialPanel: PibPanel): PibPanelState {
  const [panel, setPanel] = useState(initialPanel);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const pending = useRef<AbortController | null>(null);

  const select = (selection: PibPanelSelection) => {
    // A slower answer for an older filter must not overwrite a newer one.
    pending.current?.abort();
    const controller = new AbortController();
    pending.current = controller;
    setIsLoading(true);
    loadPibPanel(selection, controller.signal)
      .then((nextPanel) => {
        setPanel(nextPanel);
        setHasError(false);
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) setHasError(Boolean(error));
      })
      .finally(() => {
        if (pending.current === controller) setIsLoading(false);
      });
  };

  return { panel, isLoading, hasError, select };
}

async function loadPibPanel(
  selection: PibPanelSelection,
  signal: AbortSignal,
): Promise<PibPanel> {
  const query = toPibSelectionQuery(selection);
  const response = await fetch(`/api/paineis/pib?${query}`, { signal });

  if (!response.ok) {
    throw new Error(
      `PIB panel proxy failed for "${query}" with status ${response.status}; expected 200 with panel JSON.`,
    );
  }

  return (await response.json()) as PibPanel;
}
