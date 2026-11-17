import { isValidElement, type ReactElement, type ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { IdhDashboard } from "@/components/IdhDashboard/IdhDashboard";
import IdhDemoPage from "@/app/demo/idh/page";

// Banco de dados do painel sem linhas: a página monta o painel vazio, sem
// tocar na rede. `vi.hoisted`: o vi.mock sobe para o topo do arquivo.
const dataDb = vi.hoisted(
  () =>
    new (class DataDbEmptyFake {
      query = async (): Promise<never[]> => [];
    })(),
);

vi.mock("@/lib/dataDb", () => ({ queryDataDb: dataDb.query }));

vi.mock("@/features/panels/idh/idhContent", () => ({
  loadIdhPanelContent: async () => null,
}));

vi.mock("@/templates/HubTemplate", () => ({
  default: ({ children }: { children: ReactNode }) => children,
}));

const findElement = (
  node: ReactNode,
  type: unknown,
): ReactElement | undefined => {
  if (Array.isArray(node)) {
    return node.map((child) => findElement(child, type)).find(Boolean);
  }
  if (!isValidElement<{ children?: ReactNode }>(node)) return undefined;
  if (node.type === type) return node;

  return findElement(node.props.children, type);
};

describe("IdhDemoPage", () => {
  // Regressão (revisão da PR #397): `key={filters.visao}` remontava o painel
  // no primeiro filtro depois de trocar de aba (a troca só usa replaceState) e
  // fechava a folha de filtros do celular. A aba acompanha a visão sozinha.
  it("renders the dashboard without a key tied to the view", async () => {
    const page = await IdhDemoPage({
      searchParams: Promise.resolve({ visao: "sexo", uf: "PE" }),
    });

    expect(findElement(page, IdhDashboard)?.key).toBeNull();
  });
});
