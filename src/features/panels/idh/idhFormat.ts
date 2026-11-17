import { formatNumber, formatReais } from "@/features/panels/format";

// Cards seguem o Figma ("0,70"); gráficos mantêm 3 casas para a série anual
// não repetir o mesmo rótulo em anos vizinhos.
export const formatIdhCard = (value: number) => formatNumber(value, 2);
export const formatIdh = (value: number) => formatNumber(value, 3);
export const formatRenda = (value: number) => formatReais(value);
