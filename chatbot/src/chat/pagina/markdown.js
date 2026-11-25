/**
 * Markdown das respostas, configurado para texto que vem do modelo: a página
 * põe o resultado em innerHTML, então nada do texto pode virar código.
 *   - HTML cru aparece como texto;
 *   - link só com endereço http(s) ou relativo; outro esquema vira texto puro;
 *   - imagem vira o texto alternativo: os gráficos e mapas são desenhados à
 *     parte, e uma imagem de fora carregaria sozinha, sem clique.
 *
 *   import { marked } from "./marked.js";
 *   configurarMarkdown(marked);
 *   destino.innerHTML = marked.parse("Veja [o painel](https://…)");
 */
export function configurarMarkdown(marked) {
  marked.use({
    gfm: true,
    renderer: {
      html({ text }) {
        return escaparHtml(text);
      },
      link(token) {
        // false: o marked desenha o link do jeito normal.
        return enderecoSeguro(token.href) ? false : this.parser.parseInline(token.tokens);
      },
      image({ text }) {
        return escaparHtml(text);
      },
    },
  });
}

export function escaparHtml(s) {
  const trocas = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

  return String(s ?? "").replace(/[&<>"']/g, (c) => trocas[c]);
}

function enderecoSeguro(href) {
  const limpo = String(href ?? "").trim();
  if (/^https?:\/\//i.test(limpo)) return true;

  // Relativo (/data-panel/pib, #ancora): sem esquema antes da primeira barra.
  return !/^[^/?#]*:/.test(limpo);
}
