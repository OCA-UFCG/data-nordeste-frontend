import { afterEach, describe, expect, it, vi } from "vitest";
import { withReportsNavigation } from "@/features/navigation/reportLink";
import type { ISection } from "@/utils/interfaces";
import { isReportFeatureEnabled } from "./availability";

const CATALOG: ISection = {
  appears: true,
  id: "catalog",
  name: "Catálogo",
  path: "/catalog",
};

afterEach(() => vi.unstubAllEnvs());

describe("report feature availability", () => {
  it("keeps the report out of prod, nav link included", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_ENV", "prod");

    expect(isReportFeatureEnabled()).toBe(false);
    expect(withReportsNavigation([CATALOG])).toEqual([CATALOG]);
  });

  it("serves the report in beta and gamma", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_ENV", "beta");

    expect(isReportFeatureEnabled()).toBe(true);
    expect(withReportsNavigation([CATALOG]).map(({ id }) => id)).toEqual([
      "catalog",
      "reports",
    ]);
  });
});
