import { render } from "@testing-library/react";
import { createRef, type RefObject } from "react";
import { describe, expect, it, vi } from "vitest";
import { ProtoFilterBar } from "@/components/ProtoPanel/ProtoFilterBar";

const bar = (disabled: boolean, barRef = createRef<HTMLDivElement>()) => (
  <ProtoFilterBar
    summaryTitle="Pernambuco · 2021"
    renderFields={() => <span>campos</span>}
    isDefault
    onClear={() => undefined}
    top={80}
    stuck={false}
    barRef={barRef}
    disabled={disabled}
  />
);

// O conteúdo da barra (campos e botões) é o primeiro filho do container.
const content = (barRef: RefObject<HTMLDivElement | null>) =>
  barRef.current?.firstElementChild as HTMLElement;

describe("ProtoFilterBar", () => {
  it("fica inerte enquanto carrega e volta a responder, sem aviso do React", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const barRef = createRef<HTMLDivElement>();
    const { rerender } = render(bar(true, barRef));

    expect(content(barRef).hasAttribute("inert")).toBe(true);
    rerender(bar(false, barRef));

    expect(content(barRef).hasAttribute("inert")).toBe(false);
    expect(error).not.toHaveBeenCalled();
    error.mockRestore();
  });

  it("não fica inerte sem `disabled`", () => {
    const barRef = createRef<HTMLDivElement>();

    render(bar(false, barRef));

    expect(content(barRef).hasAttribute("inert")).toBe(false);
  });
});
