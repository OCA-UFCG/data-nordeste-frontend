import type { DemografiaPanelData } from "@/features/panels/demografia/demografiaPanel";
import { formatPercent, formatPessoas } from "@/features/panels/format";

type AnaliseInput = Pick<
  DemografiaPanelData,
  "filters" | "serie" | "sexo" | "piramide" | "corRaca"
>;

const share = (part: number, total: number) =>
  formatPercent(total ? (100 * part) / total : 0, 1);

const populacaoFrase = ({ filters, serie }: AnaliseInput) => {
  const index = serie.findIndex((point) => point.label === String(filters.ano));

  if (index < 0) return null;
  const { value } = serie[index];
  const anterior = serie[index - 1];
  const base = `População residente em ${filters.ano}: ${formatPessoas(value)} pessoas`;

  if (!anterior?.value) return `${base}.`;
  const variacao = (100 * (value - anterior.value)) / anterior.value;
  const sentido = variacao >= 0 ? "a mais" : "a menos";

  return `${base}, ${formatPercent(Math.abs(variacao), 1)} ${sentido} que em ${anterior.label}.`;
};

const sexoFrase = ({ sexo }: AnaliseInput) => {
  const total = sexo.mulheres + sexo.homens;

  return total
    ? `Mulheres são ${share(sexo.mulheres, total)} da população e homens, ${share(sexo.homens, total)}.`
    : null;
};

const faixaFrase = ({ piramide }: AnaliseInput) => {
  const [maior] = [...piramide].sort(
    (a, b) => b.mulheres + b.homens - (a.mulheres + a.homens),
  );

  return maior ? `A faixa etária mais numerosa é a de ${maior.faixa}.` : null;
};

const corFrase = ({ corRaca }: AnaliseInput) => {
  const total = corRaca.reduce((sum, item) => sum + item.value, 0);
  const [maior] = corRaca;

  return maior && total
    ? `${maior.label} é a cor ou raça mais declarada (${share(maior.value, total)} de quem declarou).`
    : null;
};

// Frases do bloco "Análise descritiva", calculadas só com os números do painel.
export const describeDemografia = (data: AnaliseInput): string[] =>
  [populacaoFrase, sexoFrase, faixaFrase, corFrase]
    .map((frase) => frase(data))
    .filter((frase): frase is string => frase !== null);
