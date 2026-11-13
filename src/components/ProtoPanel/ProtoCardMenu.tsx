"use client";

import { createContext, useContext, useRef } from "react";
import { CardMenu } from "@/components/ProtoPanel/menu/CardMenu";
import type { CardShare } from "@/components/ProtoPanel/menu/CardShareScreen";
import { svgImageSource } from "@/lib/chartImage";

// O que é igual em todos os cards do painel: o link com os filtros, o catálogo
// do macrotema e a fonte que vai na imagem baixada. A fonte é do painel (IDH,
// perfil), por isso vem no contexto e não aqui.
export type ProtoCardMenuContextValue = {
  share: CardShare;
  catalogHref: string | null;
  imageSource: string;
};

export const ProtoCardMenuContext =
  createContext<ProtoCardMenuContextValue | null>(null);

/**
 * Ref para o `<svg>` de um gráfico do card e a fonte de imagem do "Baixar
 * imagem" a partir dele.
 *
 * @example const chart = useSvgChart(); <svg ref={chart.ref} /> <ProtoCardMenu title={t} chart={chart} />
 */
export const useSvgChart = () => {
  const ref = useRef<SVGSVGElement | null>(null);

  return {
    ref,
    getSource: () => (ref.current ? svgImageSource(ref.current) : null),
  };
};

/**
 * Menu ⋯ de um card do painel. Com `chart`, oferece baixar a imagem;
 * os cards em HTML (ranking, barras de sexo e cor) só compartilham e abrem o
 * catálogo. `catalog={false}`: o dado não tem página no catálogo (Gini, no
 * protótipo).
 *
 * @example <ProtoCardMenu title="Índice de Gini" catalog={false} />
 */
export const ProtoCardMenu = ({
  title,
  chart,
  catalog = true,
}: {
  title: string;
  chart?: ReturnType<typeof useSvgChart>;
  catalog?: boolean;
}) => {
  const context = useContext(ProtoCardMenuContext);

  if (!context) return null;

  return (
    <CardMenu
      title={title}
      share={context.share}
      catalogHref={catalog ? context.catalogHref : null}
      image={
        chart
          ? { getSource: chart.getSource, source: context.imageSource }
          : undefined
      }
    />
  );
};
