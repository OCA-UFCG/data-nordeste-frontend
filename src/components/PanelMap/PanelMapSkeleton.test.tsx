import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PanelMapSkeleton } from "@/components/PanelMap/PanelMapSkeleton";
import { ProtoCard } from "@/components/ProtoPanel/ProtoCard";

describe("PanelMapSkeleton", () => {
  it("keeps the map box height while the map card loads", () => {
    const { getByLabelText } = render(
      <ProtoCard
        title="Mapa"
        subtitle="Nordeste"
        actions={null}
        kind="map"
        state="loading"
        onRetry={() => {}}
        skeleton={<PanelMapSkeleton boxClassName="h-[480px]" />}
      >
        <div />
      </ProtoCard>,
    );
    const [box, legend] = Array.from(getByLabelText("Carregando").children);

    expect(box).toHaveClass("h-[480px]", "w-full");
    expect(legend).toHaveClass("mt-3");
  });
});
