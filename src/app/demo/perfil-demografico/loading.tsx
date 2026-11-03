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
          <div className="grid grid-cols-1 gap-6 lg:max-[1399px]:grid-cols-2 min-[1400px]:grid-cols-[minmax(0,4.4fr)_minmax(0,4.4fr)_minmax(0,3.2fr)]">
            <Bone className="h-32 min-[1400px]:col-start-2 min-[1400px]:row-start-1" />
            <Bone className="h-32 min-[1400px]:col-start-3 min-[1400px]:row-start-1" />
            <Bone className="aspect-[4/5] min-[1400px]:col-start-1 min-[1400px]:row-span-2 min-[1400px]:row-start-1 min-[1400px]:aspect-auto" />
            <Bone className="h-96 min-[1400px]:col-start-2 min-[1400px]:row-start-2" />
            <Bone className="h-96 lg:max-[1399px]:col-span-2 min-[1400px]:col-start-3 min-[1400px]:row-start-2" />
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
