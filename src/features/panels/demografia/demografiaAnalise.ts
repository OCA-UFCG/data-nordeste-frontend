import type { ChartPoint } from "@/features/panels/chartOptions";
import { getBucket } from "@/features/panels/choropleth";
import {
  DEMOGRAFIA_PORTES,
  type CorRacaAno,
} from "@/features/panels/demografia/demografiaPanel";
import { formatNumber, formatPercent } from "@/features/panels/format";

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
  const share = (item: ChartPoint) => formatPercent((100 * item.value) / total);
  const linhas = [
    `A população se autodeclara majoritariamente ${primeira.label} (${share(primeira)}), seguida por ${segunda.label} (${share(segunda)}).`,
    comparacao(corRaca, anterior),
  ];

  return linhas.filter((linha) => linha !== null);
};

/**
 * "Quantidade de municípios por porte" da Análise descritiva do Power BI; omite
 * o porte sem município.
 *
 * @example describePortes([{ label: "Campina Grande (PB)", value: 419379 }]) // ["➡ Grande porte (acima de 100 mil hab.): 1 município."]
 */
export const describePortes = (municipios: ChartPoint[]): string[] =>
  DEMOGRAFIA_PORTES.map((porte) => {
    const total = municipios.filter(
      (item) => getBucket(DEMOGRAFIA_PORTES, item.value) === porte,
    ).length;
    const nome = total === 1 ? "município" : "municípios";

    return total ? `➡ ${porte.texto}: ${formatNumber(total)} ${nome}.` : null;
  }).filter((linha) => linha !== null);
