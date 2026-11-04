import { HandCoins } from "lucide-react";
import type { FneVisao } from "@/features/panels/fne/fneFilters";

// Fora do módulo "use client": a página server também usa no estado de erro.
export const FNE_TITLE =
  "Fundo Constitucional de Financiamento do Nordeste (FNE)";
export const FNE_ICON = HandCoins;

// Cor das colunas e das fatias da pizza de porte nos dashboards do ArcGIS.
export const FNE_BAR_COLOR = "#00bd47";
export const FNE_BAR_CLASS = "bg-[#00bd47]";

export const FNE_PORTE_COLORS: Record<string, string> = {
  "Mini": "#bbe880",
  "Micro": "#72ffaa",
  "Pequeno": "#7355cf",
  "Pequeno-médio": "#769fff",
  "Médio": "#966400",
  "Médio I": "#3f6eff",
  "Médio II": "#f7bad3",
  "Grande": "#d29eff",
};

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
