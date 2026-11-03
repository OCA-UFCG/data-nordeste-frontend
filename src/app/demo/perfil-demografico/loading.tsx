import {
  DEMOGRAFIA_ICON,
  DEMOGRAFIA_SOURCE,
  DEMOGRAFIA_TITLE,
} from "@/components/DemografiaDashboard/demografiaTheme";
import { PanelPage } from "@/components/Panel/layout/PanelPage";
import HubTemplate from "@/templates/HubTemplate";

const Bone = ({ className }: { className: string }) => (
  <div
    className={`animate-pulse rounded-lg bg-white shadow-sm motion-reduce:animate-none ${className}`}
  />
);

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

const FiltersBones = () => (
  <>
    <Bone className="-mx-6 h-14 rounded-none lg:hidden" />
    <div className="hidden gap-3 lg:flex [&>*]:flex-1">
      <Bone className="h-11 max-w-32" />
      <Bone className="h-11" />
      <Bone className="h-11" />
      <Bone className="h-11" />
      <Bone className="h-11 max-w-48" />
    </div>
  </>
);

export default function PerfilDemograficoDemoLoading() {
  return (
    <HubTemplate>
      <IntroBones />
      <PanelPage
        title={DEMOGRAFIA_TITLE}
        icon={DEMOGRAFIA_ICON}
        tone="pink"
        source={DEMOGRAFIA_SOURCE}
        fullMobile
      >
        <div role="status" className="flex flex-col gap-6">
          <span className="sr-only">
            Carregando o painel de Perfil Demográfico…
          </span>
          <FiltersBones />
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-[minmax(0,4.5fr)_minmax(0,3.75fr)_minmax(0,3.75fr)]">
            <Bone className="h-32 xl:col-start-2 xl:row-start-1" />
            <Bone className="h-32 xl:col-start-3 xl:row-start-1" />
            <Bone className="aspect-[4/5] xl:col-start-1 xl:row-span-2 xl:row-start-1 xl:aspect-auto" />
            <Bone className="h-96 xl:col-start-2 xl:row-start-2" />
            <Bone className="h-96 lg:col-span-2 xl:col-span-1 xl:col-start-3 xl:row-start-2" />
          </div>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Bone className="h-80" />
            <Bone className="h-80" />
          </div>
        </div>
      </PanelPage>
    </HubTemplate>
  );
}
