import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PanelMapEngineFake } from "@/components/PanelMap/panelMapEngineFake";
import { useMapRecorte } from "@/components/PanelMap/useMapRecorte";
import {
  EMPTY_RECORTE,
  type MapLevel,
  type MapRecorte,
} from "@/features/panelMap/mapRecorte";

type HookProps = { recorte: MapRecorte; deepest: MapLevel };

function renderMapRecorte(recorte: MapRecorte, deepest: MapLevel = "estado") {
  const engine = new PanelMapEngineFake();
  const onRecorteChange = vi.fn<(recorte: MapRecorte) => void>();
  const hook = renderHook(
    (props: HookProps) => useMapRecorte({ engine, onRecorteChange, ...props }),
    { initialProps: { recorte, deepest } },
  );

  return { engine, onRecorteChange, hook };
}

describe("useMapRecorte", () => {
  it("ignora o fim de um movimento programático", () => {
    const { engine, onRecorteChange } = renderMapRecorte(EMPTY_RECORTE);

    engine.emitMoveEnd({ zoom: 7, centerUf: "PE", programmatic: true });

    expect(onRecorteChange).not.toHaveBeenCalled();
  });

  it("ignora o fim de um enquadramento (fitTo)", () => {
    const { engine, onRecorteChange } = renderMapRecorte(EMPTY_RECORTE);

    engine.emitMoveEnd({ zoom: 7, centerUf: "PE", fit: true, fittedZoom: 7 });

    expect(onRecorteChange).not.toHaveBeenCalled();
  });

  it("zoom 7 sobre PE sem filtro escolhe PE uma vez", () => {
    const { engine, onRecorteChange } = renderMapRecorte(EMPTY_RECORTE);

    engine.emitMoveEnd({ zoom: 7, centerUf: "PE" });

    expect(onRecorteChange).toHaveBeenCalledTimes(1);
    expect(onRecorteChange).toHaveBeenCalledWith({ uf: ["PE"], mun: [] });
  });

  it("não chama quando o movimento resolve o recorte que já está aplicado", () => {
    const { engine, onRecorteChange } = renderMapRecorte({
      uf: ["PE"],
      mun: [],
    });

    engine.emitMoveEnd({ zoom: 7, centerUf: "PE" });

    expect(onRecorteChange).not.toHaveBeenCalled();
  });

  // O motor só manda códigos da feição do indicador (já filtrada pela área):
  // centro fora da área ou no mar chega sem UF, e o recorte não muda.
  it("um centro sem feição do indicador não emite recorte", () => {
    const { engine, onRecorteChange } = renderMapRecorte(
      { uf: ["PE"], mun: [] },
      "municipio",
    );

    engine.emitMoveEnd({ zoom: 9, fittedZoom: 7 });
    engine.emitMoveEnd({ zoom: 7, fittedZoom: 7 });

    expect(onRecorteChange).not.toHaveBeenCalled();
  });

  it("desce até o município quando o painel permite", () => {
    const { engine, onRecorteChange } = renderMapRecorte(
      EMPTY_RECORTE,
      "municipio",
    );

    engine.emitMoveEnd({ zoom: 9, centerUf: "PE", centerMun: "2611606" });

    expect(onRecorteChange).toHaveBeenCalledWith({
      uf: ["PE"],
      mun: ["2611606"],
    });
  });

  it("ancora no zoom do recorte que o próprio usuário escolheu (regra 2)", () => {
    const { engine, onRecorteChange, hook } = renderMapRecorte(EMPTY_RECORTE);

    // Último fit em 5; o usuário aproxima até 7 sobre PE e PE vira o filtro.
    engine.emitMoveEnd({ zoom: 5, fit: true, fittedZoom: 5 });
    engine.emitMoveEnd({ zoom: 7, centerUf: "PE", fittedZoom: 5 });
    hook.rerender({ recorte: { uf: ["PE"], mun: [] }, deepest: "estado" });

    // Afastar até 6 (abaixo de 7 − 0,5) limpa, mesmo acima do fit antigo.
    engine.emitMoveEnd({ zoom: 6, centerUf: "PE", fittedZoom: 5 });

    expect(onRecorteChange).toHaveBeenLastCalledWith(EMPTY_RECORTE);
  });

  it("um fit novo troca a âncora pelo zoom em que ele terminou", () => {
    const { engine, onRecorteChange, hook } = renderMapRecorte(EMPTY_RECORTE);

    // O usuário escolhe PE em 7; depois a barra enquadra PE (um estado
    // grande) em 6.
    engine.emitMoveEnd({ zoom: 7, centerUf: "PE", fittedZoom: 5 });
    hook.rerender({ recorte: { uf: ["PE"], mun: [] }, deepest: "estado" });
    engine.emitMoveEnd({ zoom: 6, fit: true, fittedZoom: 6 });

    // 6,2 não está abaixo de 6 − 0,5: PE fica (com a âncora velha, 7, limparia).
    engine.emitMoveEnd({ zoom: 6.2, centerUf: "PE", fittedZoom: 6 });

    expect(onRecorteChange).toHaveBeenCalledTimes(1);
  });

  it("usa o recorte e o callback mais recentes", () => {
    const { engine, onRecorteChange, hook } = renderMapRecorte(EMPTY_RECORTE);

    hook.rerender({ recorte: { uf: ["PE"], mun: [] }, deepest: "estado" });
    engine.emitMoveEnd({ zoom: 7, centerUf: "PE" });

    expect(onRecorteChange).not.toHaveBeenCalled();
  });

  it("redimensionar o mapa não apaga a âncora do zoom", () => {
    const { engine, onRecorteChange, hook } = renderMapRecorte(EMPTY_RECORTE);

    engine.emitMoveEnd({ zoom: 7, centerUf: "PE", fittedZoom: 5 });
    hook.rerender({ recorte: { uf: ["PE"], mun: [] }, deepest: "estado" });

    // Resize do container: programático, sem fit, com o fittedZoom antigo.
    engine.emitMoveEnd({ zoom: 7, programmatic: true, fittedZoom: 5 });
    engine.emitMoveEnd({ zoom: 6, centerUf: "PE", fittedZoom: 5 });

    expect(onRecorteChange).toHaveBeenLastCalledWith(EMPTY_RECORTE);
  });
});
