"use client";

import { createContext, useContext, useRef } from "react";
import { CardMenu } from "@/components/IdhDashboard/menu/CardMenu";
import type { CardShare } from "@/components/IdhDashboard/menu/CardShareScreen";
import { svgImageSource } from "@/lib/chartImage";

// O que é igual em todos os cards do painel: o link com os filtros, o catálogo
// do macrotema e a fonte que vai na imagem baixada.
export type IdhCardMenuContextValue = {
  share: CardShare;
  catalogHref: string | null;
};

export const IdhCardMenuContext = createContext<IdhCardMenuContextValue | null>(
  null,
);

// Fonte que vai na imagem baixada, como no rodapé dos cards.
export const IDH_CARD_SOURCE = "Fonte: PNAD/IBGE · Data Nordeste";

/**
 * Ref para o `<svg>` de um gráfico do card e a fonte de imagem do "Baixar
 * imagem" a partir dele.
 *
 * @example const chart = useSvgChart(); <svg ref={chart.ref} /> <IdhCardMenu title={t} chart={chart} />
 */
export const useSvgChart = () => {
  const ref = useRef<SVGSVGElement | null>(null);

  return {
    ref,
    getSource: () => (ref.current ? svgImageSource(ref.current) : null),
  };
};

/**
 * Menu ⋯ de um card do painel de IDH. Com `chart`, oferece baixar a imagem;
 * os cards em HTML (ranking, barras de sexo e cor) só compartilham e abrem o
 * catálogo. `catalog={false}`: o dado não tem página no catálogo (Gini, no
 * protótipo).
 *
 * @example <IdhCardMenu title="Índice de Gini" catalog={false} />
 */
export const IdhCardMenu = ({
  title,
  chart,
  catalog = true,
}: {
  title: string;
  chart?: ReturnType<typeof useSvgChart>;
  catalog?: boolean;
}) => {
  const context = useContext(IdhCardMenuContext);

  if (!context) return null;

  return (
    <CardMenu
      title={title}
      share={context.share}
      catalogHref={catalog ? context.catalogHref : null}
      image={
        chart
          ? { getSource: chart.getSource, source: IDH_CARD_SOURCE }
          : undefined
      }
    />
  );
};
