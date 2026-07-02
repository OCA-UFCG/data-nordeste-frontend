import { renderHook, act } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { createRef } from "react";
import { useMergedExploreSearch } from "./useMergedExploreSearch";
import { setExploreSearchFocusOwner } from "@/features/explore/searchFocus";

describe("useMergedExploreSearch", () => {
  it("merges after the explore search reaches the sticky header", () => {
    const header = document.createElement("div");
    const anchor = document.createElement("div");
    const input = document.createElement("input");
    input.value = "traba";
    anchor.id = "explore-search-anchor";
    anchor.append(input);
    document.body.append(header, anchor);
    Object.defineProperty(header, "offsetHeight", { value: 84 });
    let anchorTop = 120;
    anchor.getBoundingClientRect = () => ({ top: anchorTop }) as DOMRect;
    const headerRef = createRef<HTMLDivElement>();
    headerRef.current = header;

    const { result } = renderHook(() =>
      useMergedExploreSearch(headerRef, true),
    );
    expect(result.current.active).toBe(false);

    act(() => {
      anchorTop = 80;
      window.dispatchEvent(new Event("scroll"));
    });
    expect(result.current).toEqual({ active: true, query: "traba" });

    setExploreSearchFocusOwner("explore");
    act(() => {
      anchorTop = 120;
      window.dispatchEvent(new Event("scroll"));
    });
    expect(input).toHaveFocus();

    setExploreSearchFocusOwner("header");
    act(() => {
      anchorTop = 80;
      window.dispatchEvent(new Event("scroll"));
      input.blur();
      anchorTop = 120;
      window.dispatchEvent(new Event("scroll"));
    });
    expect(input).not.toHaveFocus();
    anchor.remove();
    header.remove();
  });
});
