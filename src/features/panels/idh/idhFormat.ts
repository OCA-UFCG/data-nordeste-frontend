import { formatNumber, formatReais } from "@/features/panels/format";

// Branco escurece (#dcdbdc no Power BI): com 1,4:1 sobre o branco, a barra e o
// arco mal apareciam; este passa de 3:1 e segue bem mais claro que o Negro.
export const IDH_LINE_COLORS = { idh: "#7c46e1", idhAjustado: "#a993f2" };
export const IDH_GROUP_COLORS: Record<string, string> = {
  Homem: "#97b42e",
  Mulher: "#8c66ec",
  Branco: "#8a8587",
  Negro: "#3e3c3d",
};
export const NO_DATA = "Sem dados";

// Cards seguem o Figma ("0,70"); gráficos mantêm 3 casas para a série anual
// não repetir o mesmo rótulo em anos vizinhos.
export const formatIdhCard = (value: number) => formatNumber(value, 2);
export const formatIdh = (value: number) => formatNumber(value, 3);
export const formatRenda = (value: number) => formatReais(value);

export const yearLabels = (points: { ano: number }[]) =>
  points.map((point) => String(point.ano));
