import {
  IDH_ICON,
  IDH_SOURCE,
  IDH_TITLE,
} from "@/components/IdhDashboard/idhTheme";
import { PanelPage } from "@/components/Panel/layout/PanelPage";
import { IDH_VISOES } from "@/features/panels/idh/idhPanel";
import HubTemplate from "@/templates/HubTemplate";

// Mesmo arranjo da "Visão geral" do IdhDashboard, para a página não pular
// quando os dados chegam; os textos do Contentful viram blocos cinza.
const Bone = ({ className }: { className: string }) => (
  <div
    className={`animate-pulse rounded-lg bg-white shadow-sm motion-reduce:animate-none ${className}`}
  />
);

// Fora do fundo cinza do painel: blocos cinza, não brancos como os do painel.
const GreyBone = ({ className }: { className: string }) => (
  <div
    className={`animate-pulse rounded-lg bg-grey-200 motion-reduce:animate-none ${className}`}
  />
);

const IntroBones = () => (
  <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-3 px-4 pt-4 sm:px-6 lg:px-20">
    <GreyBone className="h-12 w-64" />
    <GreyBone className="h-20" />
  </div>
);

const TabsBones = () => (
  <div className="flex gap-4 border-b border-grey-400 px-6 py-3.5">
    {IDH_VISOES.map((visao) => (
      <GreyBone key={visao.key} className="h-6 w-28" />
    ))}
  </div>
);

const FiltersBones = () => (
  <>
    <Bone className="-mx-6 h-14 rounded-none lg:hidden" />
    <div className="hidden gap-3 lg:flex [&>*]:flex-1">
      <Bone className="h-11" />
      <Bone className="h-11" />
      <Bone className="h-11 max-w-48" />
    </div>
  </>
);

const CardsBones = () => (
  <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 xl:grid-cols-5">
    <Bone className="h-36" />
    <Bone className="hidden h-36 lg:block" />
    <Bone className="hidden h-36 lg:block" />
    <Bone className="hidden h-36 xl:block" />
    <Bone className="hidden h-36 xl:block" />
  </div>
);

export default function IdhDemoLoading() {
  return (
    <HubTemplate>
      <IntroBones />
      <PanelPage
        title={IDH_TITLE}
        icon={IDH_ICON}
        tone="orange"
        source={IDH_SOURCE}
        fullMobile
        top={<TabsBones />}
      >
        <div role="status" className="flex flex-col gap-6">
          <span className="sr-only">Carregando o painel de IDH…</span>
          <FiltersBones />
          <CardsBones />
          <Bone className="h-80 sm:h-96" />
          <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
            <Bone className="aspect-square" />
            <div className="flex flex-col gap-6">
              <Bone className="h-72" />
              <Bone className="h-72" />
            </div>
          </div>
        </div>
      </PanelPage>
    </HubTemplate>
  );
}
