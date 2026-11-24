import { ProtoSkeleton } from "@/components/ProtoPanel/ProtoCard";

/**
 * Esqueleto de um card com `PanelMap`: a caixa na altura do mapa pronto e a
 * faixa das pílulas da legenda, para o card não mudar de altura ao carregar
 * (o esqueleto padrão do `ProtoCard` tem 380 px).
 *
 * @example <ProtoCard kind="map" skeleton={<PanelMapSkeleton boxClassName={MAP_BOX_CLASS} />} … />
 */
export const PanelMapSkeleton = ({
  boxClassName,
}: {
  boxClassName: string;
}) => (
  <>
    <ProtoSkeleton className={`w-full ${boxClassName}`} />
    <ProtoSkeleton className="mt-3 h-7 w-[60%] max-[700px]:h-16" />
  </>
);
