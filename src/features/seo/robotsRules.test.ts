import { describe, expect, it } from "vitest";
import { buildRobotsRules } from "./robotsRules";

const SITE_URL = "https://datanordeste.example";

const prodDisallowList = (): string[] => {
  const { rules } = buildRobotsRules("prod", SITE_URL);
  const rule = Array.isArray(rules) ? rules[0] : rules;

  return [rule.disallow ?? []].flat();
};

// Casamento do robots.txt: prefixo, ou igualdade exata quando a regra termina em "$".
const isBlocked = (path: string) =>
  prodDisallowList().some((rule) =>
    rule.endsWith("$") ? path === rule.slice(0, -1) : path.startsWith(rule),
  );

describe("buildRobotsRules", () => {
  it.each(["beta", "gamma", undefined])(
    "blocks every path when appEnv is %s",
    (env) => {
      expect(buildRobotsRules(env, SITE_URL)).toEqual({
        rules: { userAgent: "*", disallow: "/" },
        sitemap: `${SITE_URL}/sitemap.xml`,
      });
    },
  );

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
    "/search-index.json",
    "/catalog",
    "/catalog?page=3",
    "/catalog/123456",
    "/macrothemes/economia",
    "/data-panel/abc",
  ])("keeps %s crawlable in production", (path) => {
    expect(isBlocked(path)).toBe(false);
  });
});
