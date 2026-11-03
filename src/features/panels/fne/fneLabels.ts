import type { ChoroplethBucket } from "@/features/panels/choropleth";
import type { FneVisao } from "@/features/panels/fne/fneFilters";
import { formatReaisCompact } from "@/features/panels/format";

// DO NOT CHANGE: `prefix` vira nome de coluna (<prefix>_qtd, <prefix>_valor) no SQL.
export const FNE_SETORES = [
  { prefix: "agri", label: "Agricultura" },
  { prefix: "agro", label: "Agroindústria" },
  { prefix: "cs", label: "Comércio e serviços" },
  { prefix: "ind", label: "Indústria" },
  { prefix: "infra", label: "Infraestrutura" },
  { prefix: "pec", label: "Pecuária" },
  { prefix: "pf", label: "Pessoa física" },
  { prefix: "tour", label: "Turismo" },
] as const;

// Ordem crescente de porte do beneficiário, como nas normas do FNE.
const PORTE_LABELS: Record<string, string> = {
  "MINI": "Mini",
  "MICRO": "Micro",
  "PEQUENO": "Pequeno",
  "PEQUENO-MEDIO": "Pequeno-médio",
  "MEDIO": "Médio",
  "MEDIO I": "Médio I",
  "MEDIO II": "Médio II",
  "GRANDE": "Grande",
};

export const FNE_PORTE_ORDER = Object.keys(PORTE_LABELS);

export const labelPorte = (porte: string): string =>
  PORTE_LABELS[porte] ?? porte;

// Rótulos de setor que a base grava sem acento.
const SETOR_LABELS: Record<string, string> = {
  "Agroindustria": "Agroindústria",
  "Comercio e Serviços": "Comércio e serviços",
  "Industria": "Indústria",
  "Pecuaria": "Pecuária",
  "Pessoa Fisica": "Pessoa física",
};

export const labelSetor = (setor: string): string =>
  SETOR_LABELS[setor] ?? setor;

export const SEMIARIDO_LABELS: Record<string, string> = {
  Sim: "Semiárido",
  Não: "Fora do Semiárido",
};

export const NO_RIDE = "Fora de RIDE";

const integer = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });

export const formatQuantidade = (value: number): string =>
  integer.format(value);

export const formatValor = (value: number): string => formatReaisCompact(value);

export const FNE_FORMATTERS: Record<FneVisao, (value: number) => string> = {
  quantidade: formatQuantidade,
  valor: formatValor,
};

const NONE_COLOR = "#efefef";
const GREENS = ["#c7e9c0", "#74c476", "#31a354", "#006d2c", "#00441b"];

// Mesmos cortes das camadas do ArcGIS; só a paleta virou uma escala de verdes.
const buckets = (limits: number[], labels: string[]): ChoroplethBucket[] => [
  { max: 1, label: "Sem contratações", color: NONE_COLOR },
  ...labels.map((label, index) => ({
    max: limits[index] ?? Infinity,
    label,
    color: GREENS[index],
  })),
];

export const FNE_MAP_BUCKETS: Record<FneVisao, readonly ChoroplethBucket[]> = {
  quantidade: buckets(
    [301, 601, 901, 1501],
    ["1 a 300", "301 a 600", "601 a 900", "901 a 1.500", "Acima de 1.500"],
  ),
  valor: buckets(
    [5e6, 5e7, 2e8, 3.5e8],
    [
      "Até R$ 5 mi",
      "R$ 5 a 50 mi",
      "R$ 50 a 200 mi",
      "R$ 200 a 350 mi",
      "Acima de R$ 350 mi",
    ],
  ),
};
