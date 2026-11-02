import { PanelPage } from "@/components/Panel/PanelPage";
import {
  PIB_ICON,
  PIB_SOURCE,
  PIB_TITLE,
} from "@/components/PibDashboard/pibTheme";
import HubTemplate from "@/templates/HubTemplate";

// Mesmo arranjo do PibDashboard, para a página não pular quando os dados chegam.
// Os textos do Contentful viram blocos cinza: o esqueleto aparece na hora, sem
// esperar o Contentful mesmo com o cache vazio.
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

// Fora do fundo cinza do painel: blocos cinza, não brancos como os do painel.
const IntroBone = ({ className }: { className: string }) => (
  <div
    className={`animate-pulse rounded-lg bg-grey-200 motion-reduce:animate-none ${className}`}
  />
);

const IntroBones = () => (
  <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-3 px-4 pt-4 sm:px-6 lg:px-20">
    <IntroBone className="h-12 w-64" />
    <IntroBone className="h-20" />
  </div>
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
      <IntroBones />
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
    </HubTemplate>
  );
}
