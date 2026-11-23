import { ProtoSkeleton } from "@/components/ProtoPanel/ProtoCard";
import { CARD_SHADOW, WRAP } from "@/components/ProtoPanel/protoStyles";
import HubTemplate from "@/templates/HubTemplate";

const CARD = `rounded-[8px] border border-grey-300 bg-white px-5 py-4 ${CARD_SHADOW}`;

// Mesma estrutura da página (capa, filtros, números, mapa e a grade das classes
// com os municípios), para nada pular quando os dados chegam. O filtro por
// estado pode levar alguns segundos na primeira consulta.
const CoverBones = () => (
  <div className="w-full border-b border-grey-300 bg-grey-100">
    <div
      className={`${WRAP} flex flex-col gap-4 pt-6 pb-[58px] max-[700px]:pt-4 max-[700px]:pb-6`}
    >
      <ProtoSkeleton className="h-10 w-72 max-w-full" />
      <ProtoSkeleton className="h-11 w-80 max-w-full" />
      <ProtoSkeleton className="h-12 w-[min(36rem,100%)]" />
    </div>
  </div>
);

const FilterBones = () => (
  <div className="w-full border-b border-grey-300 bg-white">
    <div className={`${WRAP} flex min-h-[88px] items-end gap-4 py-3`}>
      <ProtoSkeleton className="h-10 w-[140px]" />
      <ProtoSkeleton className="h-10 w-[204px] max-[700px]:hidden" />
      <ProtoSkeleton className="h-10 w-[204px] max-[700px]:hidden" />
      <ProtoSkeleton className="h-10 w-[204px] max-[700px]:hidden" />
    </div>
  </div>
);

const CardBone = ({ className }: { className: string }) => (
  <div className={`${CARD} ${className}`}>
    <ProtoSkeleton className="h-full" />
  </div>
);

const PanelBones = () => (
  <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-4 px-20 pt-8 pb-10 max-[1100px]:px-8 max-[1100px]:pt-6 max-[700px]:px-4 max-[700px]:pt-5 max-[700px]:pb-8">
    <CardBone className="h-16" />
    <div className="grid grid-cols-2 gap-4 max-[700px]:grid-cols-1">
      <CardBone className="h-[132px]" />
      <CardBone className="h-[132px] max-[700px]:hidden" />
    </div>
    <CardBone className="h-[520px] max-[700px]:h-[420px]" />
    <div className="grid grid-cols-2 gap-6 max-[1000px]:grid-cols-1 max-[1000px]:gap-4">
      <CardBone className="h-[600px] max-[1000px]:h-[380px]" />
      <CardBone className="h-[600px]" />
    </div>
  </div>
);

export default function AridezDemoLoading() {
  return (
    <HubTemplate>
      <div role="status" className="flex w-full flex-col">
        <span className="sr-only">
          Carregando o painel de Índice de Aridez…
        </span>
        <CoverBones />
        <FilterBones />
        <PanelBones />
      </div>
    </HubTemplate>
  );
}
