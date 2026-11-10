import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  MACROTHEME_ICON_BY_ID,
  MACROTHEME_ROUTE_BY_NAME,
  THEMES_NAVIGATION_ORDER,
} from "./constants";

const SPRITE_SVG = readFileSync(join(process.cwd(), "public/sprite.svg"), {
  encoding: "utf-8",
});

// IMPORTANT: a new macrotheme touches four places (route map, icon map,
// navigation order, sprite). A missing one fails silently — the icon falls
// back to "list" or the theme sorts last — so these checks keep them aligned.
const contentfulIdsFromRoutes = Object.values(MACROTHEME_ROUTE_BY_NAME).map(
  (routeSlug) => routeSlug.replace(/-/g, "_"),
);

describe("macrotheme constants", () => {
  it.each(contentfulIdsFromRoutes)("maps %s to an icon", (contentfulId) => {
    expect(MACROTHEME_ICON_BY_ID[contentfulId]).toBeDefined();
  });

  it.each(contentfulIdsFromRoutes)(
    "places %s in the navigation order",
    (contentfulId) => {
      expect(THEMES_NAVIGATION_ORDER).toContain(contentfulId);
    },
  );

  it.each(Object.values(MACROTHEME_ICON_BY_ID))(
    "finds the %s symbol in public/sprite.svg",
    (iconId) => {
      expect(SPRITE_SVG).toContain(`<symbol id="${iconId}"`);
    },
  );
});
