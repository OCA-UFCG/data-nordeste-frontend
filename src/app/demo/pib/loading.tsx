import { getCatalogHref } from "@/components/Panel/texts/PanelTexts";
import { PibDashboard } from "@/components/PibDashboard/PibDashboard";
import { PibPageFrame } from "@/components/PibDashboard/PibPageFrame";
import { PIB_LEAD } from "@/components/PibDashboard/pibTexts";
import { PIB_MACROTHEME } from "@/components/PibDashboard/pibTheme";
import { emptyPibPanel, PIB_YEAR_RANGE } from "@/features/panels/pib/pibPanel";
import { defaultTerritorialFilters } from "@/features/panels/territorialFilters";
import HubTemplate from "@/templates/HubTemplate";

// A própria página, com os cards em esqueleto: sem banco nem Contentful aqui,
// então valem os textos e os filtros padrão.
export default function PibDemoLoading() {
  return (
    <HubTemplate>
      <p role="status" className="sr-only">
        Carregando o painel de PIB…
      </p>
      <PibPageFrame macroTheme={PIB_MACROTHEME} lead={PIB_LEAD}>
        <PibDashboard
          data={emptyPibPanel(defaultTerritorialFilters(PIB_YEAR_RANGE))}
          loading
          catalogHref={getCatalogHref(PIB_MACROTHEME)}
        />
      </PibPageFrame>
    </HubTemplate>
  );
}
