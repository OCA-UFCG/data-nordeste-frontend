import type { ReactNode } from "react";

// Ícones do protótipo dos painéis, com os mesmos traços: os da lucide são
// parecidos, mas não iguais (o protótipo é a referência visual do painel).
// Os nomes idh/idhad/gini/renda/rend vêm dos cards de IDH; `users` (perfil)
// usa o desenho do idh. `usd` é o cifrão do PIB; a carteira do PIB per capita
// é o mesmo desenho de `renda`. `aridez` (a folha da capa), `area` e `pct`
// vêm do painel de aridez; `text` é o ícone do "Veja mais".
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
  usd: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M14.8 9.2c-.4-.9-1.4-1.4-2.8-1.4-1.6 0-2.8.8-2.8 2 0 3 5.8 1.3 5.8 4.2 0 1.2-1.2 2-2.9 2-1.5 0-2.6-.6-3-1.6M12 6.5v1.3M12 16.2v1.3" />
    </>
  ),
  aridez: (
    <>
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.5 19 2c1 2 2 4.5 2 8 0 5.5-4.8 10-10 10z" />
      <path d="M2 21c0-3 1.9-5.4 5-6 3-.5 6-2 7-5" />
    </>
  ),
  area: (
    <>
      <path d="M3 8V3h5M16 3h5v5M21 16v5h-5M8 21H3v-5" />
      <rect x="8" y="8" width="8" height="8" rx="1" />
    </>
  ),
  pct: (
    <>
      <path d="M19 5L5 19" />
      <circle cx="6.5" cy="6.5" r="2.5" />
      <circle cx="17.5" cy="17.5" r="2.5" />
    </>
  ),
  text: <path d="M4 6h16M4 10h16M4 14h10M4 18h7" />,
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 7.6v.4" />
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

export type ProtoIconName = keyof typeof PATHS_24;

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
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {PATHS_24[name]}
    </svg>
  );
};
