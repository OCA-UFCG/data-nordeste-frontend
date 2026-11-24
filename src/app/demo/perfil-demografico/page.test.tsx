import { isValidElement, type ReactElement, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import PerfilDemograficoDemoPage from "@/app/demo/perfil-demografico/page";
import { DemografiaDashboard } from "@/components/DemografiaDashboard/DemografiaDashboard";

// Banco em que só a consulta dos censos falha; as outras devolvem zero linhas.
const dataDb = vi.hoisted(
  () =>
    new (class DataDbYearsDownFake {
      readonly panelQueries: string[] = [];

      query = async (sql: string): Promise<never[]> => {
        if (sql.includes("SELECT DISTINCT ano")) throw new Error("offline");
        this.panelQueries.push(sql);

        return [];
      };
    })(),
);

vi.mock("@/lib/dataDb", () => ({ queryDataDb: dataDb.query }));

vi.mock("@/features/panels/demografia/demografiaContent", () => ({
  loadDemografiaPanelContent: async () => null,
}));

vi.mock("@/templates/HubTemplate", () => ({
  default: ({ children }: { children: ReactNode }) => children,
}));

const findElement = (
  node: ReactNode,
  type: unknown,
): ReactElement<Record<string, unknown>> | undefined => {
  if (Array.isArray(node)) {
    return node.map((child) => findElement(child, type)).find(Boolean);
  }
  if (!isValidElement<{ children?: ReactNode }>(node)) return undefined;
  if (node.type === type) return node as ReactElement<Record<string, unknown>>;

  return findElement(node.props.children, type);
};

describe("PerfilDemograficoDemoPage", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  // Regressão (revisão da PR #411): sem os censos, a página consultava o ano 0
  // e mostrava o aviso de dados vazios com "Ver Nordeste · 0".
  it("shows the error state without querying the panel when the years fail", async () => {
    const page = await PerfilDemograficoDemoPage({
      searchParams: Promise.resolve({}),
    });

    expect(findElement(page, DemografiaDashboard)?.props.failed).toBe(true);
    expect(dataDb.panelQueries).toEqual([]);
  });
});
