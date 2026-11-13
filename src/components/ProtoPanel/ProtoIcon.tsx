import type { ReactNode } from "react";

// Ícones do protótipo dos painéis, com os mesmos traços: os da lucide são
// parecidos, mas não iguais (o protótipo é a referência visual do painel).
// Os nomes idh/idhad/gini/renda/rend vêm dos cards de IDH; `users` (perfil)
// usa o desenho do idh.
const PATHS_24: Record<string, ReactNode> = {
  idh: (
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </>
  ),
  users: (
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </>
  ),
  idhad: (
    <>
      <path d="M12 3v18" />
      <path d="M5 7h14" />
      <path d="M5 7l-3 7a3 3 0 0 0 6 0z" />
      <path d="M19 7l-3 7a3 3 0 0 0 6 0z" />
      <path d="M8 21h8" />
    </>
  ),
  gini: (
    <>
      <path d="M4 20V10" />
      <path d="M10 20V4" />
      <path d="M16 20v-7" />
      <path d="M22 20H2" />
    </>
  ),
  renda: (
    <>
      <rect x="2" y="6" width="20" height="13" rx="2" />
      <path d="M2 10h20" />
      <circle cx="17" cy="14.5" r="1.2" />
    </>
  ),
  rend: (
    <>
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
      <path d="M2 13h20" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 7.6v.4" />
    </>
  ),
  infoS: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8h.01M11 12h1v5h1" />
    </>
  ),
  up: <path d="M7 17L17 7M9 7h8v8" />,
  dots: (
    <>
      <circle cx="12" cy="5" r="1.4" />
      <circle cx="12" cy="12" r="1.4" />
      <circle cx="12" cy="19" r="1.4" />
    </>
  ),
  fullscreen: <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />,
  share: (
    <>
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" />
    </>
  ),
  download: <path d="M12 3v12M7 10l5 5 5-5M4 21h16" />,
  external: (
    <path d="M14 3h7v7M21 3l-9 9M19 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5" />
  ),
  back: <path d="M19 12H5M12 19l-7-7 7-7" />,
  forward: <path d="M5 12h14M13 6l6 6-6 6" />,
  warn: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v5M12 16.5v.5" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21s-7-6.2-7-11.2A7 7 0 0 1 19 9.8C19 14.8 12 21 12 21z" />
      <circle cx="12" cy="10" r="2.5" />
    </>
  ),
  filter: <path d="M3 5h18l-7 8v6l-4 2v-8L3 5z" />,
  clearFilter: (
    <>
      <path d="M3 4h12l-4.5 5.5V15l-3 1.5V9.5L3 4z" />
      <path d="M17 12l5 5M22 12l-5 5" />
    </>
  ),
  close: <path d="M6 6l12 12M18 6L6 18" />,
  chevronLeft: <path d="M15 18l-6-6 6-6" />,
  chevronRight: <path d="M9 18l6-6-6-6" />,
  chevronDown: <path d="M6 9l6 6 6-6" />,
};

// Controles do mapa em tela cheia, desenhados num quadro de 20.
const PATHS_20: Record<string, ReactNode> = {
  zoomIn: <path d="M10 4v12M4 10h12" />,
  zoomOut: <path d="M4 10h12" />,
  fit: <path d="M4 8V4h4M12 4h4v4M16 12v4h-4M8 16H4v-4" />,
};

export type ProtoIconName = keyof typeof PATHS_24 | keyof typeof PATHS_20;

/**
 * Ícone do protótipo. `size` em px; `stroke`, a espessura do traço.
 *
 * @example <ProtoIcon name="info" size={20} stroke={1.8} />
 */
export const ProtoIcon = ({
  name,
  size = 20,
  stroke = 2,
  className,
}: {
  name: ProtoIconName;
  size?: number;
  stroke?: number;
  className?: string;
}) => {
  const box = name in PATHS_20 ? 20 : 24;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${box} ${box}`}
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {PATHS_20[name] ?? PATHS_24[name]}
    </svg>
  );
};
