"use client";

import { useEffect, useRef, useState } from "react";

const PHONE_QUERY = "(max-width: 700px)";
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const RING_CLASS = "animate-proto-ring";

// Dá tempo de a rolagem suave trazer o campo antes do foco e do anel.
const SCROLL_SETTLE_MS = 250;

// Tirar a classe e forçar o reflow reinicia a animação a cada clique. A classe
// sai no fim da animação, e não por um timer, para não depender do React
// manter o `className` do campo. Com movimento reduzido, o CSS desliga o anel.
const ringField = (field: HTMLElement) => {
  field.classList.remove(RING_CLASS);
  void field.offsetWidth;
  field.classList.add(RING_CLASS);
  field.addEventListener(
    "animationend",
    () => field.classList.remove(RING_CLASS),
    { once: true },
  );
};

const matches = (query: string) => window.matchMedia(query).matches;

/**
 * O campo de Ano da barra de filtros visto a partir dos cards: `pickYear`
 * leva até ele (no celular, abre a folha de filtros) e `flashYear` faz o anel
 * piscar nele para mostrar que o ano mudou.
 *
 * @example const year = usePibYearField(); <ProtoTerritorialFilters yearRef={year.yearRef} sheetOpen={year.sheetOpen} onSheetOpenChange={year.setSheetOpen} … />
 */
export const usePibYearField = () => {
  const yearRef = useRef<HTMLButtonElement | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const focusTimer = useRef<number>(undefined);

  useEffect(() => () => window.clearTimeout(focusTimer.current), []);

  const flashYear = () => {
    if (!yearRef.current || matches(PHONE_QUERY)) return;
    ringField(yearRef.current);
  };

  const pickYear = () => {
    const field = yearRef.current;

    if (matches(PHONE_QUERY)) return setSheetOpen(true);
    if (!field) return;
    const reduced = matches(REDUCED_MOTION_QUERY);

    // INTENTIONAL: "nearest", não "center": a barra é sticky e o campo já
    // está na tela; centralizá-lo rolaria a página para cima à toa.
    field.scrollIntoView({
      block: "nearest",
      behavior: reduced ? "auto" : "smooth",
    });
    window.clearTimeout(focusTimer.current);
    focusTimer.current = window.setTimeout(
      () => {
        field.focus({ preventScroll: true });
        ringField(field);
      },
      reduced ? 0 : SCROLL_SETTLE_MS,
    );
  };

  return { yearRef, sheetOpen, setSheetOpen, flashYear, pickYear };
};
