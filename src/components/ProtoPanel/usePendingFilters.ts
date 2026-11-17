"use client";

import { useState } from "react";

/**
 * Guarda os filtros pedidos enquanto o servidor não responde. A seleção
 * (estado destacado, ano, selects) já mostra o pedido, e cada card sabe se o
 * dado dele vai mudar. Filtrar parte da seleção, não de `data.filters`: assim
 * escolher o ano logo depois do estado não descarta o estado ainda pendente.
 *
 * @example const { pending, selection, request } = usePendingFilters(data.filters, applyFilters, isPending);
 */
export const usePendingFilters = <Filters>(
  current: Filters,
  applyFilters: (filters: Filters) => void,
  isPending: boolean,
) => {
  const [requested, setRequested] = useState<Filters | null>(null);
  const pending = isPending ? requested : null;
  const request = (next: Filters) => {
    setRequested(next);
    applyFilters(next);
  };

  return { pending, selection: pending ?? current, request };
};
