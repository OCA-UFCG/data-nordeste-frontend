import type { FeatureCollection } from "geojson";
import type { ProtoIconName } from "@/components/ProtoPanel/ProtoIcon";

// Uma faixa da legenda em linha do cartaz: bolinha na cor e o rótulo do .qgz
// (ex.: "R$ 50 – 100 Bi"). Sem contagem de feições.
export type MapPosterLegendItem = { color: string; label: string };

// Mini-mapa de recorte no canto do mapa (`Recorte: Nordeste`). `context` são
// todos os estados em cinza; `highlight` é a parte recortada (área, estado ou
// município), em destaque com a cor do painel.
export type MapPosterInset = {
  label: string;
  context: FeatureCollection;
  highlight: FeatureCollection;
};

/**
 * Tudo o que o cartaz de download do mapa mostra além da imagem do mapa. Cada
 * painel monta o seu. `panelName` é "Painel de {macroTheme}", no topo, ao lado
 * do ícone; o desenho (SVG, rasterizado em PNG) fica em
 * `features/panels/mapPoster.ts`.
 *
 * @example { panelName: "Painel de Economia e Renda", icon: "usd", accent: "#e5640f", title: "Mapa do PIB - Nordeste", subtitle: "PIB por município - 2021", chips: ["Ano: 2021", "Área: Nordeste", "Estado: Todos", "Município: Todos"], legend: [{ color: "#fdd0a2", label: "R$ 50 – 100 Bi" }], inset: null, source: "Fonte: IBGE · Data Nordeste", updatedAt: "11/2026" }
 */
export type MapPosterData = {
  panelName: string;
  icon: ProtoIconName;

  // Cor de destaque do painel (`PROTO_TONES`): ícone, chips e recorte.
  accent: string;
  title: string;
  subtitle: string;

  // "Ano: 2021", "Área: Nordeste", "Estado: Todos", "Município: Todos".
  chips: string[];
  legend: MapPosterLegendItem[];
  inset: MapPosterInset | null;

  // "Fonte: IBGE · Data Nordeste" (já sem o crédito do basemap).
  source: string;

  // "MM/AAAA"; ausente quando o painel não tem data.
  updatedAt?: string;
};
