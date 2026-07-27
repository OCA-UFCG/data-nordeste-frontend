import type { Metadata } from "next";
import type { ReactElement } from "react";
import { documentToReactComponents } from "@contentful/rich-text-react-renderer";
import { ReportBuilder } from "@/components/ReportBuilder/ReportBuilder";
import { buildMetadata } from "@/config/seo";
import { getReportPageData } from "@/features/reports/content";
import type { ContentfulRichTextField } from "@/utils/interfaces";
import HubTemplate from "@/templates/HubTemplate";

export const metadata: Metadata = buildMetadata({
  title: "Relatório automático",
  description:
    "Gere relatorios automaticos do Data Nordeste por municipio e macrotema.",
  path: "/reports",
});

export default async function ReportsPage(): Promise<ReactElement> {
  const { page, themes } = await getReportPageData();

  return (
    <HubTemplate>
      <ReportsHero
        bannerUrl={page?.banner?.url}
        description={page?.textoDoBanner}
      />
      <ReportBuilder
        themes={themes}
        municipalityText={page?.textoDoMunicipio}
        themeText={page?.textoDoTema}
      />
    </HubTemplate>
  );
}

function ReportsHero({
  bannerUrl,
  description,
}: {
  bannerUrl?: string;
  description?: ContentfulRichTextField;
}): ReactElement {
  return (
    <section className="relative h-[226px] w-full overflow-hidden sm:h-[220px]">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${bannerUrl ?? "/banner.png"})`,
        }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,#000_0%,rgba(0,0,0,0.78)_34%,rgba(0,0,0,0.12)_100%)]" />
      <div className="relative z-10 mx-auto flex h-full w-full max-w-[1440px] items-center px-4 sm:px-6 lg:px-10">
        <div className="flex max-w-[760px] flex-col gap-5">
          <h1 className="text-[34px] font-extrabold leading-[40px] text-grey-100 sm:text-[48px] sm:leading-[52px]">
            Relatório Automático
          </h1>
          {description ? (
            <div className="text-sm font-medium leading-6 text-grey-100 sm:text-lg">
              {documentToReactComponents(description.json)}
            </div>
          ) : (
            <p className="text-sm font-medium leading-6 text-grey-100 sm:text-lg">
              Explore os principais painéis de dados do Data Nordeste e tenha
              uma visão dinâmica, visual e interativa, facilitando a compreensão
              dos principais indicadores da região.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
