import { Children, isValidElement, type ReactNode } from "react";
import { escapeXml } from "@/features/panels/chartImage";
import {
  protoIconNode,
  type ProtoIconName,
} from "@/components/ProtoPanel/ProtoIcon";

// Os ícones só usam <path>, <circle> e <rect> com atributos já em SVG (d, cx,
// cy, r, x, y, width, height, rx): dá para escrevê-los como texto andando pela
// árvore, sem `react-dom/server` no pacote do navegador.
const attributes = (props: Record<string, unknown>): string =>
  Object.entries(props)
    .filter(([key]) => key !== "children")
    .map(([key, value]) => ` ${key}="${escapeXml(String(value))}"`)
    .join("");

const markupOf = (node: ReactNode): string =>
  Children.toArray(node)
    .map((child) => {
      if (!isValidElement<Record<string, unknown>>(child)) return "";
      if (typeof child.type !== "string")
        return markupOf(child.props.children as ReactNode);

      return `<${child.type}${attributes(child.props)}/>`;
    })
    .join("");

/**
 * Traços de um ícone do protótipo como markup SVG (sem o `<svg>` em volta), no
 * viewBox 24 × 24. O traço (cor e espessura) fica a cargo de quem desenha.
 *
 * @example protoIconMarkup("close") // '<path d="M6 6l12 12M18 6L6 18"/>'
 */
export const protoIconMarkup = (name: ProtoIconName): string => {
  const markup = markupOf(protoIconNode(name));

  if (!markup) {
    throw new Error(
      `Icon "${name}" has no shapes; expected one of the names in ProtoIcon.`,
    );
  }

  return markup;
};
