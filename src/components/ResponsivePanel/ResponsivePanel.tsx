"use client";
import { useSyncExternalStore, type ReactNode } from "react";

// Same breakpoint as Tailwind's `sm`, which hides the mobile version below.
const DESKTOP_QUERY = "(min-width: 640px)";

const subscribeToDesktopQuery = (onChange: () => void) => {
  const query = window.matchMedia(DESKTOP_QUERY);
  query.addEventListener("change", onChange);

  return () => query.removeEventListener("change", onChange);
};

const isDesktopViewport = () => window.matchMedia(DESKTOP_QUERY).matches;

/**
 * Renders the mobile version server-side (CSS-hidden from `sm` up) and mounts the
 * desktop version only once the viewport is confirmed wide.
 * PERF: a CSS-hidden Power BI iframe still downloads on phones (browsers load
 * `display:none` iframes eagerly), so the desktop child is not rendered there at all.
 * Example: `<ResponsivePanel mobile={<PibMobilePanel />} desktop={<PowerBIContainer />} />`.
 */
const ResponsivePanel = ({
  mobile,
  desktop,
}: {
  mobile: ReactNode;
  desktop: ReactNode;
}) => {
  const isDesktop = useSyncExternalStore(
    subscribeToDesktopQuery,
    isDesktopViewport,
    () => false,
  );

  return (
    <>
      <div className="w-full sm:hidden">{mobile}</div>
      {isDesktop && <div className="hidden w-full sm:block">{desktop}</div>}
    </>
  );
};

export default ResponsivePanel;
