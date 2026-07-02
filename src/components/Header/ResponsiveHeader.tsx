"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import type { ISection } from "@/utils/interfaces";

const DesktopHeader = dynamic(() => import("./Header"));
const MobileHeader = dynamic(() => import("./Modal/HeaderModal"));
const DESKTOP_MEDIA_QUERY = "(min-width: 1280px)";

type HeaderViewport = "desktop" | "mobile" | null;

/** Loads only the header bundle needed by the viewport. Example: `<ResponsiveHeader content={sections} />`. */
export const ResponsiveHeader = ({ content }: { content: ISection[] }) => {
  const [viewport, setViewport] = useState<HeaderViewport>(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia(DESKTOP_MEDIA_QUERY);
    const updateViewport = () =>
      setViewport(mediaQuery.matches ? "desktop" : "mobile");

    updateViewport();
    mediaQuery.addEventListener("change", updateViewport);

    return () => mediaQuery.removeEventListener("change", updateViewport);
  }, []);

  if (viewport === "desktop") return <DesktopHeader content={content} />;
  if (viewport === "mobile") return <MobileHeader content={content} />;

  return <div className="h-20 w-full border-b-2 border-grey-200 bg-white" />;
};
