import type { ISection } from "@/utils/interfaces";

const EXPERIMENTAL_NAVIGATION_LINK: ISection = {
  appears: true,
  id: "experimental",
  name: "Experimental",
  path: "/demo",
};

// IMPORTANT: /demo só existe onde DEMOS_HABILITADAS=1 (src/app/demo/layout.tsx),
// lida em runtime no servidor. O header é client component e não a enxerga; por
// isso o botão segue NEXT_PUBLIC_APP_ENV, que é "beta" no build do gamma e do
// beta e "prod" em produção. Ligar as demos num ambiente = as duas coisas juntas.
/** Adds "Experimental" after "Relatório" on gamma and beta builds. Example: `withExperimentalNavigation(withReportsNavigation(content))`. */
export function withExperimentalNavigation(content: ISection[]): ISection[] {
  if (process.env.NEXT_PUBLIC_APP_ENV !== "beta") return content;
  if (content.some((item) => item.id === EXPERIMENTAL_NAVIGATION_LINK.id)) {
    return content;
  }

  const reportsIndex = content.findIndex((item) => item.id === "reports");

  return [
    ...content.slice(0, reportsIndex + 1),
    EXPERIMENTAL_NAVIGATION_LINK,
    ...content.slice(reportsIndex + 1),
  ];
}
