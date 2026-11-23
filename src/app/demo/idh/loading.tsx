import { ProtoSkeleton } from "@/components/ProtoPanel/ProtoCard";
import { CARD_SHADOW, WRAP } from "@/components/ProtoPanel/protoStyles";
import HubTemplate from "@/templates/HubTemplate";

const CARD = `rounded-[8px] border border-grey-300 bg-white px-5 py-4 ${CARD_SHADOW} max-[700px]:p-4`;

// Mesma estrutura da página (capa clara, abas, filtros e cards), para nada
// pular quando os dados chegam.
const CoverBones = () => (
  <div className="w-full border-b border-grey-300 bg-grey-100">
    <div
      className={`${WRAP} flex flex-col gap-4 pt-6 pb-[58px] max-[700px]:pt-4 max-[700px]:pb-6`}
    >
      <ProtoSkeleton className="h-10 w-72 max-w-full" />
      <ProtoSkeleton className="h-11 w-80 max-w-full" />
      <ProtoSkeleton className="h-12 w-[min(36rem,100%)]" />
      <ProtoSkeleton className="h-12 w-full" />
    </div>
  </div>
);

const TabsBones = () => (
  <div className="w-full border-b border-grey-300 bg-white">
    <div className={`${WRAP} flex h-12 items-center gap-4`}>
      {Array.from({ length: 3 }, (_, index) => (
        <ProtoSkeleton key={index} className="h-5 w-28" />
      ))}
    </div>
  </div>
);

const FilterBones = () => (
  <div className="w-full border-b border-grey-300 bg-white">
    <div
      className={`${WRAP} flex min-h-[88px] items-end gap-4 py-3 max-[900px]:gap-3 max-[700px]:min-h-14 max-[700px]:items-center max-[700px]:py-2`}
    >
      <ProtoSkeleton className="h-10 w-24 flex-none" />
      <ProtoSkeleton className="h-10 min-w-0 flex-1 max-[700px]:hidden" />
      <ProtoSkeleton className="h-10 min-w-0 flex-1 max-[700px]:hidden" />
      <ProtoSkeleton className="h-10 w-10 flex-none max-[700px]:ml-auto" />
    </div>
  </div>
);

// Cinco indicadores; três no carrossel do tablet e um no celular.
const BigNumberBones = () => (
  <div className="grid grid-cols-5 gap-4 max-[1099px]:grid-cols-3 max-[1099px]:gap-3 max-[700px]:grid-cols-1">
    {Array.from({ length: 5 }, (_, index) => (
      <ProtoSkeleton
        key={index}
        className={`h-[118px] ${index > 2 ? "max-[1099px]:hidden" : ""} ${index > 0 ? "max-[700px]:hidden" : ""}`}
      />
    ))}
  </div>
);

const PanelBones = () => (
  <div
    className={`${WRAP} flex flex-col gap-4 pt-8 pb-10 max-[1100px]:pt-6 max-[700px]:pt-5 max-[700px]:pb-8`}
  >
    <BigNumberBones />
    <div className={CARD}>
      <ProtoSkeleton className="h-[330px]" />
    </div>
    <div className="grid grid-cols-2 gap-6 max-[1000px]:grid-cols-1 max-[1000px]:gap-4">
      <div className={CARD}>
        <ProtoSkeleton className="h-[460px]" />
      </div>
      <div className={CARD}>
        <ProtoSkeleton className="h-[460px]" />
      </div>
    </div>
  </div>
);

export default function IdhDemoLoading() {
  return (
    <HubTemplate>
      <div role="status" aria-busy="true" className="flex w-full flex-col">
        <span className="sr-only">Carregando o painel de IDH…</span>
        <CoverBones />
        <TabsBones />
        <FilterBones />
        <PanelBones />
      </div>
    </HubTemplate>
  );
}
