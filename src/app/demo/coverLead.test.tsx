import { isValidElement, type ReactElement, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AridezDemoPage from "@/app/demo/aridez/page";
import IdhDemoPage from "@/app/demo/idh/page";
import PerfilDemograficoDemoPage from "@/app/demo/perfil-demografico/page";
import PibDemoPage from "@/app/demo/pib/page";
import { ARIDEZ_LEAD } from "@/components/AridezDashboard/aridezTexts";
import { PERFIL_LEAD } from "@/components/DemografiaDashboard/perfilTexts";
import { IDH_LEAD } from "@/components/IdhDashboard/idhTheme";
import { PibPageFrame } from "@/components/PibDashboard/PibPageFrame";
import { PIB_LEAD } from "@/components/PibDashboard/pibTexts";
import { ProtoCover } from "@/components/ProtoPanel/ProtoCover";
import type { PanelContent } from "@/features/panels/panelContent";

// Banco fora do ar: a capa não depende dele.
vi.mock("@/lib/dataDb", () => ({
  queryDataDb: async () => {
    throw new Error("offline");
  },
}));

// Contentful controlado pelo teste; null é o Contentful fora do ar.
const contentful = vi.hoisted(() => {
  const state = {
    content: null as PanelContent | null,
    load: async () => state.content,
  };

  return state;
});

vi.mock("@/features/panels/pib/pibContent", () => ({
  loadPibPanelContent: contentful.load,
}));
vi.mock("@/features/panels/idh/idhContent", () => ({
  loadIdhPanelContent: contentful.load,
}));
vi.mock("@/features/panels/demografia/demografiaContent", () => ({
  loadDemografiaPanelContent: contentful.load,
}));
vi.mock("@/features/panels/aridez/aridezContent", () => ({
  loadAridezPanelContent: contentful.load,
}));
vi.mock("@/templates/HubTemplate", () => ({
  default: ({ children }: { children: ReactNode }) => children,
}));

type PibPageFrameProps = Parameters<typeof PibPageFrame>[0];

const findElement = (
  node: ReactNode,
  type: unknown,
): ReactElement<Record<string, unknown>> | undefined => {
  if (Array.isArray(node)) {
    return node.map((child) => findElement(child, type)).find(Boolean);
  }
  if (!isValidElement<{ children?: ReactNode }>(node)) return undefined;
  if (node.type === type) return node as ReactElement<Record<string, unknown>>;

  // O PIB põe a capa dentro da moldura que divide com o loading.
  if (node.type === PibPageFrame) {
    return findElement(PibPageFrame(node.props as PibPageFrameProps), type);
  }

  return findElement(node.props.children, type);
};

const PAGES = [
  ["pib", PibDemoPage, PIB_LEAD],
  ["idh", IdhDemoPage, IDH_LEAD],
  ["perfil-demografico", PerfilDemograficoDemoPage, PERFIL_LEAD],
  ["aridez", AridezDemoPage, ARIDEZ_LEAD],
] as const;

describe.each(PAGES)("/demo/%s cover", (_, Page, fallback) => {
  const cover = async () =>
    findElement(await Page({ searchParams: Promise.resolve({}) }), ProtoCover)
      ?.props;

  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    contentful.content = null;
  });

  it("uses the Contentful text and update date, and the fallback without them", async () => {
    expect((await cover())?.lead).toBe(fallback);

    contentful.content = {
      panel: {
        abovePanelDescription: "Texto do Contentful",
        date: "2025-05-14",
      },
      relatedItems: [],
    } as unknown as PanelContent;
    const props = await cover();

    expect(props?.lead).toBe("Texto do Contentful");
    expect(props?.updatedAt).toBe("2025-05-14");
  });

  it("falls back when the Contentful text is empty", async () => {
    contentful.content = {
      panel: { abovePanelDescription: "" },
      relatedItems: [],
    } as unknown as PanelContent;

    expect((await cover())?.lead).toBe(fallback);
  });
});
