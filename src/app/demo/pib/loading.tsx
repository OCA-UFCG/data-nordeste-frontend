import { PanelPage } from "@/components/Panel/PanelPage";
import { PanelTextsFrame } from "@/components/Panel/PanelTextsFrame";
import {
  PIB_ICON,
  PIB_PANEL_TEXTS,
  PIB_SOURCE,
  PIB_TITLE,
} from "@/components/PibDashboard/pibTheme";
import HubTemplate from "@/templates/HubTemplate";

// Mesmo arranjo do PibDashboard, para a página não pular quando os dados chegam.
// A navegação do HubTemplate vem do unstable_cache: o esqueleto não lê o Contentful.
const Bone = ({ className }: { className: string }) => (
  <div
    className={`animate-pulse rounded-lg bg-white shadow-sm motion-reduce:animate-none ${className}`}
  />
);

const FiltersBones = () => (
  <>
    <Bone className="-mx-6 h-14 rounded-none lg:hidden" />
    <div className="hidden gap-3 lg:flex [&>*]:flex-1">
      <Bone className="h-11" />
      <Bone className="h-11" />
      <Bone className="h-11" />
      <Bone className="h-11 max-w-48" />
    </div>
  </>
);

const MapColumnBones = () => (
  <div className="flex flex-col gap-6">
    <div className="grid grid-cols-2 gap-3 lg:gap-6">
      <Bone className="h-36" />
      <Bone className="h-36" />
    </div>
    <Bone className="aspect-square xl:aspect-auto xl:flex-1" />
  </div>
);

const ChartsColumnBones = () => (
  <div className="flex flex-col gap-6">
    <Bone className="h-96" />
    <div className="grid gap-6 xl:grid-cols-2">
      <Bone className="h-80" />
      <Bone className="hidden h-80 lg:block" />
    </div>
  </div>
);

export default function PibDemoLoading() {
  return (
    <HubTemplate>
      <PanelTextsFrame panel={PIB_PANEL_TEXTS}>
        <PanelPage
          title={PIB_TITLE}
          icon={PIB_ICON}
          tone="orange"
          source={PIB_SOURCE}
          fullMobile
        >
          <div role="status" className="flex flex-col gap-6">
            <span className="sr-only">Carregando o painel de PIB…</span>
            <FiltersBones />
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
              <MapColumnBones />
              <ChartsColumnBones />
            </div>
          </div>
        </PanelPage>
      </PanelTextsFrame>
    </HubTemplate>
  );
}
