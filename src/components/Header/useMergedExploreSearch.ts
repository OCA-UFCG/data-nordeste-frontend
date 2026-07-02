"use client";

import { RefObject, useEffect, useRef, useState } from "react";
import { getExploreSearchFocusOwner } from "@/features/explore/searchFocus";

const EXPLORE_SEARCH_ANCHOR_ID = "explore-search-anchor";

type MergedExploreSearchState = {
  active: boolean;
  query: string;
};

function restoreExploreSearchFocus(anchor: HTMLElement): void {
  if (getExploreSearchFocusOwner() !== "explore") return;
  const input = anchor.querySelector<HTMLInputElement>("input");
  if (!input) return;

  input.focus({ preventScroll: true });
  input.setSelectionRange(input.value.length, input.value.length);
}

/** Detects when the explore search has scrolled behind the sticky header. Example: `useMergedExploreSearch(headerRef, true)`. */
export function useMergedExploreSearch(
  headerRef: RefObject<HTMLDivElement | null>,
  enabled: boolean,
): MergedExploreSearchState {
  const [mergedSearch, setMergedSearch] = useState({
    active: false,
    query: "",
  });
  const previouslyMergedRef = useRef(false);

  useEffect(() => {
    if (!enabled) return setMergedSearch({ active: false, query: "" });

    const updateMergedState = () => {
      const anchor = document.getElementById(EXPLORE_SEARCH_ANCHOR_ID);
      if (!anchor || !headerRef.current) return;
      const active =
        anchor.getBoundingClientRect().top <= headerRef.current.offsetHeight;
      if (previouslyMergedRef.current && !active) {
        restoreExploreSearchFocus(anchor);
      }
      previouslyMergedRef.current = active;
      setMergedSearch((current) => {
        if (current.active === active) return current;
        const query = active ? anchor.querySelector("input")?.value ?? "" : "";

        return { active, query };
      });
    };
    updateMergedState();
    window.addEventListener("scroll", updateMergedState, { passive: true });

    return () => window.removeEventListener("scroll", updateMergedState);
  }, [enabled, headerRef]);

  return mergedSearch;
}
