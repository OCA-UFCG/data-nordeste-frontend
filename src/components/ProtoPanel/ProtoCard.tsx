"use client";

import type { CSSProperties, ReactNode } from "react";
import { ProtoIcon } from "@/components/ProtoPanel/ProtoIcon";
import {
  BUTTON,
  BUTTON_GHOST,
  CARD_SHADOW,
} from "@/components/ProtoPanel/protoStyles";

export type ProtoCardState = "ok" | "loading" | "error";

// Altura do esqueleto de cada tipo de card, a mesma do protótipo.
const SKELETON_HEIGHT = { line: 250, map: 380, rank: 380, grp: 90 } as const;

export type ProtoCardKind = keyof typeof SKELETON_HEIGHT;

export const ProtoSkeleton = ({
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

const CardSkeleton = ({ kind }: { kind: ProtoCardKind }) => (
  <div
    aria-busy="true"
    aria-label="Carregando"
    className="flex flex-col gap-3 pt-1"
  >
    <ProtoSkeleton className="h-3.5 w-[45%]" />
    <ProtoSkeleton
      className="w-full"
      style={{ height: SKELETON_HEIGHT[kind] }}
    />
  </div>
);

type NoticeAction = { label: string; onClick: () => void };

const NoticeButton = ({
  action,
  className,
}: {
  action: NoticeAction;
  className: string;
}) => (
  <button type="button" onClick={action.onClick} className={className}>
    {action.label}
  </button>
);

/**
 * Estado de aviso ou de erro de um card (`.empty` do protótipo): ícone, texto
 * e uma ação.
 *
 * `secondaryAction`: um segundo botão, de contorno, ao lado do primeiro.
 *
 * @example <ProtoCardNotice tone="warn" action={{ label: "Ver Nordeste · 2022", onClick: reset }} secondaryAction={{ label: "Limpar filtros", onClick: clear }}>…</ProtoCardNotice>
 */
export const ProtoCardNotice = ({
  tone,
  action,
  secondaryAction,
  children,
}: {
  tone: "warn" | "error";
  action?: NoticeAction;
  secondaryAction?: NoticeAction;
  children: ReactNode;
}) => (
  <div
    role={tone === "error" ? "alert" : "status"}
    className="flex min-h-[200px] flex-col items-center justify-center gap-3.5 px-4 py-7 text-center"
  >
    <span
      className={`grid size-11 place-items-center rounded-full border ${tone === "error" ? "border-[#efb8bd] bg-[#ffe1e3] text-[#bf1621]" : "border-[#ebcb78] bg-[#fff7e0] text-[#8a6200]"}`}
    >
      <ProtoIcon name="warn" size={24} />
    </span>
    <p className="max-w-[56ch] text-[15px] leading-[22px]">{children}</p>
    {secondaryAction ? (
      <div className="flex flex-wrap items-center justify-center gap-2">
        {action ? <NoticeButton action={action} className={BUTTON} /> : null}
        <NoticeButton action={secondaryAction} className={BUTTON_GHOST} />
      </div>
    ) : action ? (
      <NoticeButton action={action} className={BUTTON} />
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

// Rodapé com a fonte; sem `footer`, o card não mostra rodapé.
export type ProtoCardFooter = { source: string; updatedAt?: string };

export type ProtoCardProps = {
  title: string;
  mobileTitle?: string;
  subtitle: string;
  mobileSubtitle?: string;
  actions: ReactNode;
  state: ProtoCardState;
  kind: ProtoCardKind;
  onRetry: () => void;
  bodyClassName?: string;
  footer?: ProtoCardFooter;
  children: ReactNode;
};

const CardBody = ({
  state,
  kind,
  onRetry,
  children,
}: Pick<ProtoCardProps, "state" | "kind" | "onRetry" | "children">) => {
  if (state === "loading") return <CardSkeleton kind={kind} />;
  if (state === "error") {
    return (
      <ProtoCardNotice
        tone="error"
        action={{ label: "Tentar de novo", onClick: onRetry }}
      >
        Não foi possível carregar os dados deste gráfico.
      </ProtoCardNotice>
    );
  }

  return children;
};

const CardFooter = ({ footer }: { footer: ProtoCardFooter }) => (
  <div className="mt-3.5 flex justify-between gap-3 text-[11px] leading-4 text-grey-1100">
    <span>{footer.source}</span>
    {footer.updatedAt ? (
      <span className="text-grey-800">Atualizado em {footer.updatedAt}</span>
    ) : null}
  </div>
);

/**
 * Card de gráfico do painel ("Caixa do gráfico" do protótipo): cabeçalho com
 * ações, corpo com os estados carregando e erro, e o rodapé com a fonte
 * (quando `footer` é dado).
 *
 * @example <ProtoCard title="Mapa do IDH por estado" subtitle="…" actions={…} state="ok" kind="map" onRetry={retry} footer={{ source: "Fonte: …" }}>…</ProtoCard>
 */
export const ProtoCard = (props: ProtoCardProps) => (
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
    {props.footer ? <CardFooter footer={props.footer} /> : null}
  </article>
);
