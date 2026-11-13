import type { CSSProperties } from "react";

// Classes do protótipo dos painéis ("Painéis Data Nordeste · Protótipo
// navegável"), em Tailwind. Cores que o tema já tem usam o token: grey-1100 é o
// texto, grey-800 o texto de apoio, grey-300 a linha, grey-200 a linha suave e
// grey-100 o fundo cinza. O verde de ação é o green-800 do tema, não o #018f39
// do protótipo: o tema o escureceu para 4,5:1 com texto branco (WCAG 1.4.3).
// A cor de destaque é uma variável CSS: cada painel define o seu tom em
// `protoToneStyle` no elemento raiz (portais incluídos, porque saem da árvore).
export type ProtoTone = "idh" | "perfil" | "pib";

export type ProtoToneColors = {
  accent: string;
  accentStrong: string;
  accentSoft: string;
  accentLine: string;
};

export const PROTO_TONES: Record<ProtoTone, ProtoToneColors> = {
  idh: {
    accent: "#7c46e1",
    accentStrong: "#6d34cd",
    accentSoft: "#f6f4fe",
    accentLine: "#ded9fb",
  },
  perfil: {
    accent: "#d6537f",
    accentStrong: "#a8264f",
    accentSoft: "#fdeef3",
    accentLine: "#f3c3d4",
  },
  pib: {
    accent: "#e5640f",
    accentStrong: "#c2570c",
    accentSoft: "#fff1e4",
    accentLine: "#fbd8b5",
  },
};

/**
 * Variáveis CSS do tom de um painel. Vai como `style` no elemento raiz; quem
 * está num portal (folha, balão, diálogo) recebe o mesmo estilo, porque o
 * portal sai da árvore de elementos do painel.
 *
 * @example <section style={protoToneStyle("perfil")}>…</section>
 */
export const protoToneStyle = (tone: ProtoTone): CSSProperties => {
  const colors = PROTO_TONES[tone];
  const style: Record<string, string> = {
    "--proto-accent": colors.accent,
    "--proto-accent-strong": colors.accentStrong,
    "--proto-accent-soft": colors.accentSoft,
    "--proto-accent-line": colors.accentLine,
  };

  return style as CSSProperties;
};

// Fonte dos gráficos em SVG: vai como atributo para a imagem baixada levar a
// mesma letra da tela.
export const PROTO_CHART_FONT =
  "Inter, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif";

// Tinta dos mapas e dos rótulos: cinzas neutros, iguais em todos os painéis.
export const PROTO_INK = "#292829";
export const PROTO_INK_STRONG = "#1b1a1c";

export const FOCUS_RING =
  "focus-visible:outline-[2.5px] focus-visible:outline-offset-2 focus-visible:outline-(--proto-accent)";

// `.wrap`: 80 px de margem, 32 px até 1100 px e 16 px no celular.
export const WRAP =
  "mx-auto w-full max-w-[1440px] px-20 max-[1100px]:px-8 max-[700px]:px-4";

const BUTTON_BASE = `inline-flex min-h-10 items-center justify-center gap-2.5 rounded-[6px] border px-4 py-2 text-sm leading-6 font-medium no-underline disabled:cursor-not-allowed disabled:border-grey-300 disabled:bg-grey-100 disabled:text-grey-500 ${FOCUS_RING}`;

export const BUTTON = `${BUTTON_BASE} border-green-800 bg-green-800 text-white hover:not-disabled:border-green-900 hover:not-disabled:bg-green-900`;

export const BUTTON_GHOST = `${BUTTON_BASE} border-grey-300 bg-white text-green-900 hover:not-disabled:bg-grey-100`;

// `.ib`: botões de 32 px do cabeçalho dos cards (tela cheia, ⓘ, ⋯).
export const ICON_BUTTON = `grid size-8 place-items-center rounded-[6px] text-grey-800 hover:bg-grey-200 hover:text-grey-1100 aria-expanded:bg-grey-200 aria-expanded:text-grey-1100 disabled:pointer-events-none disabled:opacity-50 ${FOCUS_RING}`;

// `body` do protótipo: 15 px, altura de linha 1,5 e a cor do texto. O site usa
// 16 px; cada bloco do painel define o seu para o que herda sair igual.
export const PROTO_TEXT = "text-[15px] leading-normal text-grey-1100";

export const CARD_SHADOW = "shadow-[0_2px_4px_-2px_rgba(0,0,0,0.1)]";

// `.lab`: rótulos das telas do menu e dos filtros.
export const SMALL_LABEL = "text-xs leading-4 font-semibold";
