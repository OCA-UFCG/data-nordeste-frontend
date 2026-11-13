import { ProtoSkeleton } from "@/components/ProtoPanel/ProtoCard";
import { CARD_SHADOW, WRAP } from "@/components/ProtoPanel/protoStyles";
import HubTemplate from "@/templates/HubTemplate";

const CARD = `rounded-[8px] border border-grey-300 bg-white px-5 py-4 ${CARD_SHADOW}`;

// Mesma estrutura da página (capa, filtros, grade e dg2), para nada pular
// quando os dados chegam.
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
      <ProtoSkeleton className="h-10 w-[204px] max-[700px]:hidden" />
      <ProtoSkeleton className="h-10 w-[204px] max-[700px]:hidden" />
    </div>
  </div>
);

const PanelBones = () => (
  <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-4 px-20 pt-8 pb-10 max-[1100px]:px-8 max-[1100px]:pt-6 max-[700px]:px-4 max-[700px]:pt-5 max-[700px]:pb-8">
    <div className="grid grid-cols-[302px_minmax(0,1fr)] grid-rows-[auto_minmax(0,1fr)_auto] gap-4 [grid-template-areas:'bn_map'_'mun_map'_'sex_age'] max-[1000px]:flex max-[1000px]:flex-col">
      <div className={`${CARD} [grid-area:bn] h-[132px]`}>
        <ProtoSkeleton className="h-full" />
      </div>
      <div className={`${CARD} [grid-area:map] min-h-[460px]`}>
        <ProtoSkeleton className="h-full" />
      </div>
      <div className={`${CARD} [grid-area:mun] h-[300px]`}>
        <ProtoSkeleton className="h-full" />
      </div>
      <div className={`${CARD} [grid-area:sex] h-[330px]`}>
        <ProtoSkeleton className="h-full" />
      </div>
      <div className={`${CARD} [grid-area:age] h-[330px]`}>
        <ProtoSkeleton className="h-full" />
      </div>
    </div>
    <div className="grid grid-cols-2 gap-4 max-[1000px]:flex max-[1000px]:flex-col">
      <div className={`${CARD} h-[330px]`}>
        <ProtoSkeleton className="h-full" />
      </div>
      <div className={`${CARD} h-[330px]`}>
        <ProtoSkeleton className="h-full" />
      </div>
    </div>
  </div>
);

export default function PerfilDemograficoDemoLoading() {
  return (
    <HubTemplate>
      <div role="status" className="flex w-full flex-col">
        <span className="sr-only">
          Carregando o painel de Perfil Demográfico…
        </span>
        <CoverBones />
        <FilterBones />
        <PanelBones />
      </div>
    </HubTemplate>
  );
}
