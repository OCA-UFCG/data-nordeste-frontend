"use client";

import type { CSSProperties, ReactNode } from "react";
import { IdhIcon } from "@/components/IdhDashboard/IdhIcon";
import { BUTTON, CARD_SHADOW } from "@/components/IdhDashboard/idhStyles";

export type IdhCardState = "ok" | "loading" | "error";

// Altura do esqueleto de cada tipo de card, a mesma do protótipo.
const SKELETON_HEIGHT = { line: 250, map: 380, rank: 380, grp: 90 } as const;

export type IdhCardKind = keyof typeof SKELETON_HEIGHT;

// WARNING: o protótipo traz "Atualizado em 11/2026" fixo. O banco não informa
// quando a PNAD foi carregada; troque por essa data quando houver uma fonte.
export const IDH_DATA_UPDATED_AT = "11/2026";

export const IdhSkeleton = ({
  className,
  style,
}: {
  className: string;
  style?: CSSProperties;
}) => (
  <div
    style={style}
    className={`animate-shimmer rounded-[6px] bg-[linear-gradient(90deg,#efefef_25%,#f7f6f7_50%,#efefef_75%)] bg-[length:200%_100%] motion-reduce:animate-none ${className}`}
  />
);

const CardSkeleton = ({ kind }: { kind: IdhCardKind }) => (
  <div
    aria-busy="true"
    aria-label="Carregando"
    className="flex flex-col gap-3 pt-1"
  >
    <IdhSkeleton className="h-3.5 w-[45%]" />
    <IdhSkeleton className="w-full" style={{ height: SKELETON_HEIGHT[kind] }} />
  </div>
);

/**
 * Estado de aviso ou de erro de um card (`.empty` do protótipo): ícone, texto
 * e uma ação.
 *
 * @example <IdhCardNotice tone="error" action={{ label: "Tentar de novo", onClick: retry }}>Não foi possível…</IdhCardNotice>
 */
export const IdhCardNotice = ({
  tone,
  action,
  children,
}: {
  tone: "warn" | "error";
  action?: { label: string; onClick: () => void };
  children: ReactNode;
}) => (
  <div
    role={tone === "error" ? "alert" : "status"}
    className="flex min-h-[200px] flex-col items-center justify-center gap-3.5 px-4 py-7 text-center"
  >
    <span
      className={`grid size-11 place-items-center rounded-full border ${tone === "error" ? "border-[#efb8bd] bg-[#ffe1e3] text-[#bf1621]" : "border-[#ebcb78] bg-[#fff7e0] text-[#8a6200]"}`}
    >
      <IdhIcon name="warn" size={24} />
    </span>
    <p className="max-w-[56ch] text-[15px] leading-[22px]">{children}</p>
    {action ? (
      <button type="button" onClick={action.onClick} className={BUTTON}>
        {action.label}
      </button>
    ) : null}
  </div>
);

// Título e subtítulo têm versão curta no celular (`.d-t` / `.m-t`).
const Responsive = ({ wide, narrow }: { wide: string; narrow?: string }) =>
  narrow ? (
    <>
      <span className="max-[700px]:hidden">{wide}</span>
      <span className="hidden max-[700px]:inline">{narrow}</span>
    </>
  ) : (
    wide
  );

export type IdhCardProps = {
  title: string;
  mobileTitle?: string;
  subtitle: string;
  mobileSubtitle?: string;
  actions: ReactNode;
  state: IdhCardState;
  kind: IdhCardKind;
  onRetry: () => void;
  bodyClassName?: string;
  children: ReactNode;
};

const CardBody = ({
  state,
  kind,
  onRetry,
  children,
}: Pick<IdhCardProps, "state" | "kind" | "onRetry" | "children">) => {
  if (state === "loading") return <CardSkeleton kind={kind} />;
  if (state === "error") {
    return (
      <IdhCardNotice
        tone="error"
        action={{ label: "Tentar de novo", onClick: onRetry }}
      >
        Não foi possível carregar os dados deste gráfico.
      </IdhCardNotice>
    );
  }

  return children;
};

/**
 * Card de gráfico do painel ("Caixa do gráfico" do protótipo): cabeçalho com
 * ações, corpo com os estados carregando e erro, e o rodapé com a fonte.
 *
 * @example <IdhCard title="Mapa do IDH por estado" subtitle="…" actions={…} state="ok" kind="map" onRetry={retry}>…</IdhCard>
 */
export const IdhCard = (props: IdhCardProps) => (
  <article
    className={`flex min-w-0 flex-col rounded-[8px] border border-grey-300 bg-white px-5 py-4 ${CARD_SHADOW} max-[700px]:p-4`}
  >
    <div className="mb-3 flex items-start justify-between gap-2">
      <div className="min-w-0">
        <h3 className="text-base leading-[22px] font-semibold text-grey-1100">
          <Responsive wide={props.title} narrow={props.mobileTitle} />
        </h3>
        <p className="mt-0.5 text-xs leading-4 text-grey-800">
          <Responsive wide={props.subtitle} narrow={props.mobileSubtitle} />
        </p>
      </div>
      <div className="-mt-1 -mr-2 flex flex-none gap-0.5">{props.actions}</div>
    </div>
    <div className={`min-w-0 flex-1 ${props.bodyClassName ?? ""}`}>
      <CardBody state={props.state} kind={props.kind} onRetry={props.onRetry}>
        {props.children}
      </CardBody>
    </div>
    <div className="mt-3.5 flex justify-between gap-3 text-[11px] leading-4 text-grey-1100">
      <span>Fonte: PNAD/IBGE · Data Nordeste</span>
      <span className="text-grey-800">Atualizado em {IDH_DATA_UPDATED_AT}</span>
    </div>
  </article>
);
