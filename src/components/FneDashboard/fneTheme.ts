import { HandCoins } from "lucide-react";
import type { FneVisao } from "@/features/panels/fne/fneFilters";

// Fora do módulo "use client": a página server também usa no estado de erro.
export const FNE_TITLE =
  "Fundo Constitucional de Financiamento do Nordeste (FNE)";
export const FNE_ICON = HandCoins;

export type FneChart =
  | "setores"
  | "portes"
  | "tipologias"
  | "portesPopulacionais"
  | "estados"
  | "semiarido"
  | "rides";

// Títulos dos gráficos do ArcGIS, com "porte" desambiguado (beneficiário × população).
export const FNE_CHART_TITLES: Record<FneVisao, Record<FneChart, string>> = {
  quantidade: {
    setores: "Quantidade acumulada de contratações por tipo de setor",
    portes: "Quantidade de contratações por porte do beneficiário",
    tipologias: "Quantidade de contratações por tipologia da PNDR",
    portesPopulacionais:
      "Quantidade de contratações por porte populacional do município",
    estados: "Quantidade de contratações por estado",
    semiarido: "Quantidade de contratações no Semiárido",
    rides: "Quantidade de contratações por RIDE",
  },
  valor: {
    setores: "Valor acumulado, em reais, de contratações por tipo de setor",
    portes: "Valor, em reais, de contratações por porte do beneficiário",
    tipologias: "Valor, em reais, de contratações por tipologia da PNDR",
    portesPopulacionais:
      "Valor, em reais, de contratações por porte populacional do município",
    estados: "Valor, em reais, de contratações por estado",
    semiarido: "Valor, em reais, de contratações no Semiárido",
    rides: "Valor, em reais, de contratações por RIDE",
  },
};
