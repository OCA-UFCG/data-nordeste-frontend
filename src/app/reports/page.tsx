import type { Metadata } from "next";
import type { ReactElement } from "react";
import { ReportBuilder } from "@/components/ReportBuilder/ReportBuilder";
import { buildMetadata } from "@/config/seo";
import { getReportThemes } from "@/features/reports/content";
import HubTemplate from "@/templates/HubTemplate";

export const metadata: Metadata = buildMetadata({
  title: "Relatorio automatico",
  description:
    "Gere relatorios automaticos do Data Nordeste por municipio e macrotema.",
  path: "/reports",
});

/** Displays the automatic report builder. Example: `/reports`. */
export default async function ReportsPage(): Promise<ReactElement> {
  const themes = await getReportThemes();

  return (
    <HubTemplate>
      <ReportsHero />
      <ReportBuilder themes={themes} />
    </HubTemplate>
  );
}

function ReportsHero(): ReactElement {
  return (
    <section className="relative h-[226px] w-full overflow-hidden sm:h-[220px]">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/banner.png')" }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,#000_0%,rgba(0,0,0,0.78)_34%,rgba(0,0,0,0.12)_100%)]" />
      <div className="relative z-10 mx-auto flex h-full w-full max-w-[1440px] items-center px-4 sm:px-6 lg:px-20">
        <div className="flex max-w-[760px] flex-col gap-5">
          <h1 className="text-[34px] font-extrabold leading-[40px] text-grey-100 sm:text-[48px] sm:leading-[52px]">
            Relatório Automático
          </h1>
          <p className="text-sm font-medium leading-6 text-grey-100 sm:text-lg">
            Explore os principais painéis de dados do Data Nordeste e tenha uma
            visão dinâmica, visual e interativa, facilitando a compreensão dos
            principais indicadores da região.
          </p>
        </div>
      </div>
    </section>
  );
}
