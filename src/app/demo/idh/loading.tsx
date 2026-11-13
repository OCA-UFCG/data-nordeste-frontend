import { ProtoSkeleton } from "@/components/ProtoPanel/ProtoCard";
import { CARD_SHADOW, WRAP } from "@/components/ProtoPanel/protoStyles";
import HubTemplate from "@/templates/HubTemplate";

const CARD = `rounded-[8px] border border-grey-300 bg-white px-5 py-4 ${CARD_SHADOW}`;

// Mesma estrutura da página (capa, filtros, coluna lateral e cards), para nada
// pular quando os dados chegam.
const CoverBones = () => (
  <div className="w-full bg-grey-1000">
    <div className={`${WRAP} flex flex-col gap-4 pt-6 pb-[58px]`}>
      <div className="h-10 w-72 rounded-[6px] bg-white/10" />
      <div className="h-11 w-80 rounded-[6px] bg-white/10" />
      <div className="h-12 w-[min(36rem,100%)] rounded-[6px] bg-white/10" />
      <div className="h-12 w-full rounded-[6px] bg-white/10" />
    </div>
  </div>
);

const FilterBones = () => (
  <div className="w-full border-b border-grey-300 bg-white">
    <div className={`${WRAP} flex min-h-[88px] items-end gap-4 py-3`}>
      <ProtoSkeleton className="h-10 w-[204px]" />
      <ProtoSkeleton className="h-10 w-[204px] max-[700px]:hidden" />
    </div>
  </div>
);

const PanelBones = () => (
  <div className="mx-auto grid w-full max-w-[1440px] grid-cols-[223px_minmax(0,1fr)] max-[900px]:grid-cols-[minmax(0,1fr)]">
    <div className="bg-grey-100 max-[900px]:hidden" />
    <div className="flex min-w-0 flex-col gap-4 pt-8 pr-20 pb-10 pl-7 max-[1100px]:pr-8 max-[1100px]:pl-6 max-[900px]:px-4">
      <div className="grid grid-cols-5 gap-4 max-[1099px]:grid-cols-3 max-[700px]:grid-cols-1">
        {Array.from({ length: 5 }, (_, index) => (
          <ProtoSkeleton
            key={index}
            className={`h-[118px] ${index > 2 ? "max-[1099px]:hidden" : ""} ${index > 0 ? "max-[700px]:hidden" : ""}`}
          />
        ))}
      </div>
      <div className={CARD}>
        <ProtoSkeleton className="h-[330px]" />
      </div>
      <div className="grid grid-cols-2 gap-6 max-[1000px]:grid-cols-1">
        <div className={CARD}>
          <ProtoSkeleton className="h-[460px]" />
        </div>
        <div className={CARD}>
          <ProtoSkeleton className="h-[460px]" />
        </div>
      </div>
    </div>
  </div>
);

export default function IdhDemoLoading() {
  return (
    <HubTemplate>
      <div role="status" className="flex w-full flex-col">
        <span className="sr-only">Carregando o painel de IDH…</span>
        <CoverBones />
        <FilterBones />
        <PanelBones />
      </div>
    </HubTemplate>
  );
}
