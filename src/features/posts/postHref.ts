import { getArcGisInternalEmbedHref } from "@/features/embeds/arcgis";
import type { IPublication } from "@/utils/interfaces";

export type PostDestination = { href: string; openInNewTab: boolean };

/**
 * Where a post card leads, or null when the Contentful entry has no link yet.
 * Example: `resolvePostHref({ type: "newsletter", link: "", sys: { id: "x" } })`
 * → `{ href: "/boletim/x", openInNewTab: false }`.
 */
export function resolvePostHref({
  type,
  link,
  sys,
}: Pick<IPublication, "type" | "link" | "sys">): PostDestination | null {
  // INTENTIONAL: newsletters with a sys.id route to the local /boletim/ PDF
  // viewer page. All other post types preserve the previous routing behavior
  // (ArcGIS embed detection, or external link fallback).
  if (type === "newsletter" && sys?.id) {
    return { href: `/boletim/${sys.id}`, openInNewTab: false };
  }

  // IMPORTANT: Contentful returns `link: null` for an entry saved without it,
  // and preview builds (beta/gamma) render drafts. Passing null to <Link>
  // aborted the prerender of "/" on 06/11/2026 for a draft "Monitor de seca".
  if (!link) {
    return null;
  }

  const embedHref = getArcGisInternalEmbedHref(link);

  return embedHref
    ? { href: embedHref, openInNewTab: false }
    : { href: link, openInNewTab: true };
}
