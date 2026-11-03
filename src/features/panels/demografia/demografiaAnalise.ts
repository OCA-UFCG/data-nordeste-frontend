import type { ChartPoint } from "@/features/panels/chartOptions";
import { getBucket } from "@/features/panels/choropleth";
import {
  DEMOGRAFIA_PORTES,
  type CorRacaAno,
  type DemografiaPorte,
  type MunicipioPoint,
} from "@/features/panels/demografia/demografiaPanel";
import { formatNumber, formatPercent } from "@/features/panels/format";

/**
 * Participação de uma parte no total, com uma casa ("51,7%").
 *
 * @example formatShare(28_240_713, 54_658_515) // "51,7%"
 */
export const formatShare = (value: number, total: number): string =>
  formatPercent(total ? (100 * value) / total : 0);

const variacoes = (corRaca: ChartPoint[], anterior: ChartPoint[]) =>
  corRaca
    .map((item) => {
      const antes = anterior.find((prev) => prev.label === item.label)?.value;

      return antes
        ? { label: item.label, pct: (100 * (item.value - antes)) / antes }
        : null;
    })
    .filter((item) => item !== null)
    .sort((a, b) => b.pct - a.pct);

const comparacao = (corRaca: ChartPoint[], anterior: CorRacaAno | null) => {
  if (!anterior) return "Não há ano anterior para comparação.";
  const lista = variacoes(corRaca, anterior.corRaca);
  const alta = lista[0];
  const queda = lista[lista.length - 1];

  if (!alta || alta.pct <= 0) return null;
  const aumento = `Em comparação com ${anterior.ano}, houve um aumento de ${formatPercent(alta.pct)} na cor ou raça ${alta.label}.`;

  return queda.pct < 0
    ? `${aumento} Enquanto ${queda.label} apresentou uma redução de ${formatPercent(-queda.pct)}.`
    : aumento;
};

/**
 * "Distribuição por cor ou raça" da Análise descritiva do Power BI: as duas
 * maiores (sobre quem declarou) e a maior alta e queda desde o censo anterior.
 *
 * @example describeCorRaca(corRaca, { ano: 2010, corRaca: anterior }) // ["A população se autodeclara majoritariamente Parda (59,6%), seguida por Branca (26,7%).", "Em comparação com 2010, ..."]
 */
export const describeCorRaca = (
  corRaca: ChartPoint[],
  anterior: CorRacaAno | null,
): string[] => {
  const total = corRaca.reduce((sum, item) => sum + item.value, 0);
  const [primeira, segunda] = [...corRaca].sort((a, b) => b.value - a.value);

  if (!total || !segunda) return [];
  const share = (item: ChartPoint) => formatShare(item.value, total);
  const linhas = [
    `A população se autodeclara majoritariamente ${primeira.label} (${share(primeira)}), seguida por ${segunda.label} (${share(segunda)}).`,
    comparacao(corRaca, anterior),
  ];

  return linhas.filter((linha) => linha !== null);
};

export type PorteGrupo = { porte: DemografiaPorte; codes: string[] };

/**
 * Os municípios da lista separados por porte, na ordem da legenda.
 *
 * @example municipiosPorPorte(lista)[2].codes.length // 64 (Grande, Nordeste 2022)
 */
export const municipiosPorPorte = (
  municipios: MunicipioPoint[],
): PorteGrupo[] =>
  DEMOGRAFIA_PORTES.map((porte) => ({
    porte,
    codes: municipios
      .filter((item) => getBucket(DEMOGRAFIA_PORTES, item.value) === porte)
      .map((item) => item.code),
  }));

/**
 * "Quantidade de municípios por porte" da Análise descritiva do Power BI; omite
 * o porte sem município.
 *
 * @example describePortes([{ code: "2504009", label: "Campina Grande (PB)", value: 419379 }]) // ["➡ Grande porte (acima de 100 mil hab.): 1 município."]
 */
export const describePortes = (municipios: MunicipioPoint[]): string[] =>
  municipiosPorPorte(municipios)
    .filter(({ codes }) => codes.length)
    .map(({ porte, codes }) => {
      const nome = codes.length === 1 ? "município" : "municípios";

      return `➡ ${porte.texto}: ${formatNumber(codes.length)} ${nome}.`;
    });
