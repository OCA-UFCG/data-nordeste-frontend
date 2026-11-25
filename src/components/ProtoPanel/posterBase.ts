import type { ProtoIconName } from "@/components/ProtoPanel/ProtoIcon";
import {
  PROTO_TONES,
  type ProtoTone,
} from "@/components/ProtoPanel/protoStyles";
import type { MapPosterBase } from "@/features/panels/mapPosterBuild";

// Do que a page servidor sabe e o dashboard não: o macrotema (do Contentful) e
// a data "MM/AAAA". Opcionais: sem eles valem o macrotema padrão do painel e
// um cartaz sem "Atualizado em".
export type PosterPanelInfo = { macroTheme?: string; updatedAt?: string };

/**
 * O que o painel dá ao cartaz de download de todos os seus mapas: o nome
 * ("Painel de {macrotema}"), o ícone e a cor do tom, a data, o lugar e os
 * chips dos filtros. Vai no contexto do menu do card.
 *
 * @example buildPosterBase({ macroTheme: "Economia e Renda", icon: "usd", tone: "pib", updatedAt: "11/2026", place: "Nordeste", chips })
 */
export const buildPosterBase = ({
  macroTheme,
  icon,
  tone,
  ...rest
}: {
  macroTheme: string;
  icon: ProtoIconName;
  tone: ProtoTone;
  updatedAt?: string;
  place: string;
  chips: string[];
}): MapPosterBase => ({
  panelName: `Painel de ${macroTheme}`,
  icon,
  accent: PROTO_TONES[tone].accent,
  ...rest,
});
