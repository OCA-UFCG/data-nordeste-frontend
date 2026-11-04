import { FNE_SOURCE } from "@/components/FneDashboard/FneTexts";
import { FNE_ICON, FNE_TITLE } from "@/components/FneDashboard/fneTheme";
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
      <Bone className="h-11" />
      <Bone className="h-11" />
      <Bone className="h-11" />
      <Bone className="h-11" />
      <Bone className="h-11" />
      <Bone className="h-11 max-w-48" />
    </div>
  </>
);

export default function FneDemoLoading() {
  return (
    <HubTemplate>
      <IntroBones />
      <PanelPage
        title={FNE_TITLE}
        icon={FNE_ICON}
        tone="green"
        source={FNE_SOURCE}
        fullMobile
      >
        <div role="status" className="flex flex-col gap-6 lg:pt-6">
          <span className="sr-only">Carregando o painel do FNE…</span>
          <FiltersBones />
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
            <Bone className="h-32" />
            <Bone className="hidden h-32 lg:block" />
            <Bone className="hidden h-32 lg:block" />
            <Bone className="hidden h-32 lg:block" />
          </div>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
            <Bone className="aspect-[4/5] lg:row-span-2 lg:aspect-auto" />
            <Bone className="h-80" />
            <Bone className="h-80" />
          </div>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Bone className="h-96" />
            <Bone className="h-96" />
          </div>
        </div>
      </PanelPage>
    </HubTemplate>
  );
}
