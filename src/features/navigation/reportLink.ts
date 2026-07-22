import type { ISection } from "@/utils/interfaces";

const REPORT_NAVIGATION_LINK: ISection = {
  appears: true,
  id: "reports",
  name: "Relatório",
  path: "/reports",
};

/** Adds the reports page after catalog navigation. Example: `withReportsNavigation(content)`. */
export function withReportsNavigation(content: ISection[]): ISection[] {
  if (content.some((item) => item.id === REPORT_NAVIGATION_LINK.id)) {
    return content;
  }

  const catalogIndex = content.findIndex((item) => item.id === "catalog");
  if (catalogIndex < 0) return [...content, REPORT_NAVIGATION_LINK];

  return insertReportLinkAfterCatalog(content, catalogIndex);
}

function insertReportLinkAfterCatalog(
  content: ISection[],
  catalogIndex: number,
): ISection[] {
  return [
    ...content.slice(0, catalogIndex + 1),
    REPORT_NAVIGATION_LINK,
    ...content.slice(catalogIndex + 1),
  ];
}
