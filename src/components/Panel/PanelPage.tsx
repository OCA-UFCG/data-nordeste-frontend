import { Info, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { PANEL_TONES, type PanelTone } from "@/components/Panel/PanelShell";

// O mobile mostra uma versão resumida do painel (sem mapa e rankings extras).
export const MobileSummaryAlert = () => (
  <div
    role="note"
    className="flex gap-3 rounded-lg border border-blue-500 bg-white p-4 text-blue-600 lg:hidden"
  >
    <Info aria-hidden className="mt-0.5 size-6 shrink-0" />
    <div className="flex flex-col gap-1">
      <p className="text-base font-medium leading-5 tracking-[-0.02em]">
        Atenção
      </p>
      <p className="text-sm leading-6">
        A versão mobile dos painéis é mais resumida. Para conferir todo o
        conteúdo, acesse a versão desktop.
      </p>
    </div>
  </div>
);

const PanelTitleBar = ({
  title,
  icon: TitleIcon,
  tone,
  info,
  compact,
}: {
  title: string;
  icon: LucideIcon;
  tone: PanelTone;
  info?: ReactNode;
  compact: boolean;
}) => (
  <div
    className={`flex items-center gap-4 px-4 py-3 text-grey-100 lg:rounded-t-lg lg:px-6 ${PANEL_TONES[tone].shell}`}
  >
    <span className="flex shrink-0 items-center justify-center p-2">
      <TitleIcon
        aria-hidden
        className={compact ? "size-8 lg:size-10" : "size-10"}
        strokeWidth={2}
      />
    </span>
    <h1
      className={`font-extrabold tracking-[-0.0075em] ${compact ? "text-2xl leading-8 lg:pb-2 lg:text-3xl lg:leading-9" : "pb-2 text-3xl leading-9"}`}
    >
      {title}
    </h1>
    {info}
  </div>
);

// Layout do Figma "Explorar dados (Mobile)": faixa do tema, alerta, conteúdo
// em fundo cinza. `top` fica em faixa branca acima do conteúdo (ex.: abas);
// `info` é o botão "Saiba mais" que o Power BI tem ao lado do título.
export const PanelPage = ({
  title,
  icon,
  tone,
  source,
  info,
  top,
  fullMobile = false,
  children,
}: {
  title: string;
  icon: LucideIcon;
  tone: PanelTone;
  source: string;
  info?: ReactNode;
  top?: ReactNode;

  // Celular com o painel inteiro: sem o alerta de versão resumida e com título
  // menor, para sobrar tela para os dados.
  fullMobile?: boolean;
  children: ReactNode;
}) => (
  <div className="mx-auto flex w-full max-w-[1440px] flex-col lg:px-20 lg:py-6">
    <PanelTitleBar
      title={title}
      icon={icon}
      tone={tone}
      info={info}
      compact={fullMobile}
    />
    <div className="flex flex-col gap-6 bg-grey-100 pb-9 lg:rounded-b-lg">
      {top ? (
        <div className="flex flex-col gap-6 bg-white pt-6 lg:pt-2">
          <div className="px-6 lg:hidden">
            <MobileSummaryAlert />
          </div>
          {top}
        </div>
      ) : null}
      <div className={`flex flex-col gap-6 px-6 ${top ? "" : "pt-6"}`}>
        {top || fullMobile ? null : <MobileSummaryAlert />}
        {children}
        <p className="text-sm leading-relaxed text-grey-900">{source}</p>
      </div>
    </div>
  </div>
);
