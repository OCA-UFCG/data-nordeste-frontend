import { ArrowDownRight, ArrowRight, ArrowUpRight } from "lucide-react";
import type { KpiItem } from "@/components/Panel/KpiCards";
import { PANEL_TONES, type PanelTone } from "@/components/Panel/PanelShell";

// ponytail: largura média estimada de um caractere do valor (Inter em negrito,
// com folga); medir o texto no canvas se a fonte mudar.
const VALUE_CHAR_WIDTH_EM = 0.62;

// A fonte encolhe com a largura do card (cqw) só o bastante para o valor caber
// numa linha; valores curtos (o IDH) seguem em 2rem.
const fitValueFontSize = (value: string) =>
  `min(2rem, ${(100 / (Math.max(value.length, 1) * VALUE_CHAR_WIDTH_EM)).toFixed(2)}cqw)`;

export type CardChange = { ratio: number; text: string };

const ChangeIcon = ({ ratio }: { ratio: number }) => {
  const className = "mr-0.5 inline size-3.5 align-[-2px]";

  if (ratio > 0) return <ArrowUpRight aria-hidden className={className} />;
  if (ratio < 0) return <ArrowDownRight aria-hidden className={className} />;

  return <ArrowRight aria-hidden className={className} />;
};

// Variação discreta, em texto neutro: a seta e o sinal dão a direção, sem
// usar verde e vermelho (cores de status) para dizer se é bom ou ruim.
// `null` guarda a linha vazia, para o card não mudar de altura entre anos.
const ChangeLine = ({ change }: { change: CardChange | null }) => {
  if (!change) {
    return (
      <span aria-hidden className="mt-1 text-[0.8125rem] leading-5">
        &nbsp;
      </span>
    );
  }

  return (
    <span className="mt-1 text-balance text-[0.8125rem] leading-5 text-grey-800">
      <ChangeIcon ratio={change.ratio} />
      {change.text}
    </span>
  );
};

/**
 * O valor mais longo de um grupo de cards lado a lado. Passado como `fitTo` a
 * cada card, todos ganham a mesma fonte: a maior em que esse valor cabe (os
 * cards da linha têm a mesma largura, e a fonte é relativa a ela).
 *
 * @example longestValue(["R$ 1,24 Tri", "R$ 21,56 Mil"]) // "R$ 21,56 Mil"
 */
export const longestValue = (values: string[]): string =>
  values.reduce(
    (longest, value) => (value.length > longest.length ? value : longest),
    "",
  );

const CardValue = ({
  value,
  fitTo,
  caption,
  change,
  compact,
}: {
  value: string;
  fitTo: string;
  caption?: string;
  change?: CardChange | null;
  compact: boolean;
}) => (
  <div
    className={`@container flex flex-col items-center pb-6 pt-3 text-center ${compact ? "px-2" : "px-4"}`}
  >
    <span
      className="font-bold leading-tight text-green-800"
      style={{ fontSize: fitValueFontSize(fitTo) }}
    >
      {value}
    </span>
    {caption ? (
      <span className="mt-1 text-sm text-grey-800">{caption}</span>
    ) : null}
    {change !== undefined ? <ChangeLine change={change} /> : null}
  </div>
);

// `caption`: legenda curta abaixo do valor (ex.: "em 2023"); `change`: a
// variação em relação ao ano anterior (omitida nos painéis que não a mostram);
// `fitTo`: o valor mais longo do grupo (ver longestValue).
export const HighlightCard = ({
  icon: CardIcon,
  label,
  value,
  tone,
  caption,
  change,
  fitTo = value,
  compact = false,
}: KpiItem & {
  tone: PanelTone;
  caption?: string;
  change?: CardChange | null;
  fitTo?: string;
  compact?: boolean;
}) => (
  <div className="flex min-w-0 flex-col overflow-hidden rounded-lg border border-grey-200 bg-white shadow-sm">
    <div
      className={`flex min-h-16 items-center justify-center gap-4 px-4 py-3 text-white ${PANEL_TONES[tone].card}`}
    >
      <CardIcon aria-hidden className="size-8 shrink-0" strokeWidth={1.75} />
      <span className="text-sm font-medium">{label}</span>
    </div>
    <CardValue
      value={value}
      fitTo={fitTo}
      caption={caption}
      change={change}
      compact={compact}
    />
  </div>
);

export const withCommonFit = <Item extends KpiItem>(
  items: Item[],
): (Item & { fitTo: string })[] => {
  const fitTo = longestValue(items.map((item) => item.value));

  return items.map((item) => ({ ...item, fitTo }));
};
