import { describe, expect, it } from "vitest";
import { buildRobotsRules } from "./robotsRules";

const SITE_URL = "https://datanordeste.example";

const prodDisallowList = (): string[] => {
  const { rules } = buildRobotsRules("prod", SITE_URL);
  const rule = Array.isArray(rules) ? rules[0] : rules;

  return [rule.disallow ?? []].flat();
};

// Nenhuma regra usa curinga, então o casamento do robots.txt é por prefixo.
const isBlocked = (path: string) =>
  prodDisallowList().some((rule) => path.startsWith(rule));

describe("buildRobotsRules", () => {
  it("blocks every path on beta and gamma", () => {
    expect(buildRobotsRules("beta", SITE_URL)).toEqual({
      rules: { userAgent: "*", disallow: "/" },
      sitemap: `${SITE_URL}/sitemap.xml`,
    });
  });

  it.each([
    "/posts?page=2",
    "/posts?category=boletim&sort=date",
    "/explore?themes=economia",
    "/search?q=pib",
    "/search",
    "/atualizar-conteudo",
    "/api/report",
  ])("blocks %s in production", (path) => {
    expect(isBlocked(path)).toBe(true);
  });

  it.each([
    "/",
    "/posts",
    "/explore",
    "/catalog",
    "/catalog?page=3",
    "/catalog/123456",
    "/macrothemes/economia",
    "/data-panel/abc",
  ])("keeps %s crawlable in production", (path) => {
    expect(isBlocked(path)).toBe(false);
  });
});
