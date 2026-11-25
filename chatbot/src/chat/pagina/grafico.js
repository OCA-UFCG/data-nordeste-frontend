/**
 * Gráfico de uma resposta, desenhado com o resultado de uma consulta_sql que
 * veio com o parâmetro `grafico`: a mesma tabela que o modelo leu, então o
 * gráfico nunca mostra um número que não saiu do tabelão.
 *
 * Série histórica: linha de 2 px com área a 10%, ponto e valor no fim, e
 * cruz com dica ao passar o mouse. Ranking: barras horizontais de 16 px a
 * partir do zero, com o valor na ponta. Uma série só, então sem legenda: o
 * título diz o que é. Sempre com "Ver os dados" em tabela.
 */

const COR = "#018f39"; // verde do Data Nordeste
const MESES = [
  "jan",
  "fev",
  "mar",
  "abr",
  "mai",
  "jun",
  "jul",
  "ago",
  "set",
  "out",
  "nov",
  "dez",
];

/** Linhas da saída da ferramenta: "rotulo | valor", depois o rodapé. */
export function lerTabela(saida) {
  const linhas = String(saida ?? "").split("\n");
  if (!/^rotulo \| valor$/.test(linhas[0] ?? "")) return [];
  const pontos = [];
  for (const linha of linhas.slice(1)) {
    const corte = linha.lastIndexOf(" | ");
    if (corte < 0) break;
    const valor = Number(linha.slice(corte + 3));
    if (!Number.isFinite(valor)) break;
    pontos.push({ rotulo: linha.slice(0, corte), valor });
  }
  return pontos;
}

export function rotuloLegivel(r) {
  let m = /^(\d{4})-(\d{2})$/.exec(r);
  if (m) return `${MESES[Number(m[2]) - 1]}/${m[1]}`;
  m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(r);
  if (m) return `${m[3]}/${m[2]}/${m[1]}`;
  return r;
}

function formatador(unidade) {
  const u = (unidade ?? "").trim();
  const porcento = u.startsWith("%");
  const reais = /^R\$/.test(u);
  const compacto = (v) => {
    const a = Math.abs(v);
    const f = (x, s) =>
      `${x.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} ${s}`;
    if (a >= 1e9) return f(v / 1e9, "bi");
    if (a >= 1e6) return f(v / 1e6, "mi");
    if (a >= 1e4) return f(v / 1e3, "mil");
    return v.toLocaleString("pt-BR", { maximumFractionDigits: a < 10 ? 2 : 1 });
  };
  // Valores com 1 casa fixa, como no texto (41,0%); o eixo fica sem casas.
  const umaCasa = (v) =>
    v.toLocaleString("pt-BR", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    });
  return {
    valor: (v) =>
      reais ? `R$ ${compacto(v)}` : porcento ? `${umaCasa(v)}%` : compacto(v),
    eixo: (v) => `${compacto(v)}${porcento ? "%" : ""}`,
  };
}

/** Marcas de eixo "redondas" entre min e max (inclui o zero se couber). */
function marcas(min, max, quantas = 4) {
  if (min === max) max = min + 1;
  const passoBruto = (max - min) / quantas;
  const mag = 10 ** Math.floor(Math.log10(passoBruto));
  const passo = [1, 2, 2.5, 5, 10]
    .map((k) => k * mag)
    .find((p) => p >= passoBruto);
  const ini = Math.floor(min / passo) * passo;
  const fim = Math.ceil(max / passo) * passo;
  const out = [];
  for (let v = ini; v <= fim + passo / 2; v += passo)
    out.push(Number(v.toFixed(10)));
  return out;
}

const SVG = "http://www.w3.org/2000/svg";
function s(tag, attrs, pai) {
  const n = document.createElementNS(SVG, tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  pai?.append(n);
  return n;
}

function tabelaDeDados(pontos, fmt) {
  const det = document.createElement("details");
  det.className = "grafico-dados";
  det.innerHTML = "<summary>Ver os dados</summary>";
  const t = document.createElement("table");
  for (const p of pontos) {
    const tr = t.insertRow();
    tr.insertCell().textContent = rotuloLegivel(p.rotulo);
    tr.insertCell().textContent = fmt.valor(p.valor);
  }
  det.append(t);
  return det;
}

function desenharSerie(caixa, pontos, fmt) {
  const area = document.createElement("div");
  area.className = "grafico-area";
  const dica = document.createElement("div");
  dica.className = "grafico-dica";
  dica.hidden = true;
  caixa.append(area);
  area.append(dica);

  const desenhar = () => {
    area.querySelector("svg")?.remove();
    const L = Math.max(area.clientWidth, 280);
    const A = 200;
    const m = { t: 12, r: 64, b: 26, l: 52 };
    const valores = pontos.map((p) => p.valor);
    const ticks = marcas(Math.min(0, ...valores), Math.max(0, ...valores));
    const y0 = ticks[0];
    const y1 = ticks.at(-1);
    const x = (i) =>
      m.l +
      (pontos.length === 1 ? 0 : (i / (pontos.length - 1)) * (L - m.l - m.r));
    const y = (v) => m.t + (1 - (v - y0) / (y1 - y0)) * (A - m.t - m.b);
    const svg = s("svg", { width: L, height: A, role: "img" });
    svg.setAttribute("aria-label", caixa.dataset.titulo ?? "");
    area.prepend(svg);

    for (const t of ticks) {
      s(
        "line",
        {
          x1: m.l,
          x2: L - m.r,
          y1: y(t),
          y2: y(t),
          class: t === 0 ? "base" : "grade",
        },
        svg,
      );
      s(
        "text",
        { x: m.l - 8, y: y(t) + 4, "text-anchor": "end", class: "eixo" },
        svg,
      ).textContent = fmt.eixo(t);
    }
    // Rótulos do eixo x: o primeiro, o último e alguns no meio, sem encostar.
    const cabem = Math.max(2, Math.floor((L - m.l - m.r) / 70));
    const salto = Math.ceil(pontos.length / cabem);
    pontos.forEach((p, i) => {
      if (i % salto && i !== pontos.length - 1) return;
      if (i !== pontos.length - 1 && pontos.length - 1 - i < salto * 0.6)
        return;
      s(
        "text",
        {
          x: x(i),
          y: A - 6,
          "text-anchor":
            i === 0 ? "start" : i === pontos.length - 1 ? "end" : "middle",
          class: "eixo",
        },
        svg,
      ).textContent = rotuloLegivel(p.rotulo);
    });

    const caminho = pontos
      .map((p, i) => `${i ? "L" : "M"}${x(i)},${y(p.valor)}`)
      .join("");
    const base = y(Math.max(y0, Math.min(0, y1)));
    s(
      "path",
      {
        d: `${caminho}L${x(pontos.length - 1)},${base}L${x(0)},${base}Z`,
        fill: COR,
        "fill-opacity": 0.1,
      },
      svg,
    );
    s(
      "path",
      {
        d: caminho,
        fill: "none",
        stroke: COR,
        "stroke-width": 2,
        "stroke-linejoin": "round",
        "stroke-linecap": "round",
      },
      svg,
    );
    const ult = pontos.length - 1;
    s(
      "circle",
      {
        cx: x(ult),
        cy: y(pontos[ult].valor),
        r: 4,
        fill: COR,
        stroke: "#fff",
        "stroke-width": 2,
      },
      svg,
    );
    s(
      "text",
      { x: x(ult) + 8, y: y(pontos[ult].valor) + 4, class: "valor-fim" },
      svg,
    ).textContent = fmt.valor(pontos[ult].valor);

    const cruz = s(
      "line",
      { y1: m.t, y2: A - m.b, class: "cruz", visibility: "hidden" },
      svg,
    );
    const ponto = s(
      "circle",
      {
        r: 5,
        fill: COR,
        stroke: "#fff",
        "stroke-width": 2,
        visibility: "hidden",
      },
      svg,
    );
    const alvo = s(
      "rect",
      { x: m.l, y: 0, width: L - m.l - m.r, height: A, fill: "transparent" },
      svg,
    );
    const mostrar = (cx) => {
      const i = Math.round(
        ((cx - m.l) / Math.max(1, L - m.l - m.r)) * (pontos.length - 1),
      );
      const k = Math.max(0, Math.min(ult, i));
      const px = x(k);
      const py = y(pontos[k].valor);
      for (const n of [cruz, ponto]) n.setAttribute("visibility", "visible");
      cruz.setAttribute("x1", px);
      cruz.setAttribute("x2", px);
      ponto.setAttribute("cx", px);
      ponto.setAttribute("cy", py);
      dica.hidden = false;
      dica.innerHTML = `<span>${rotuloLegivel(pontos[k].rotulo)}</span><strong>${fmt.valor(pontos[k].valor)}</strong>`;
      dica.style.left = `${Math.min(px, L - dica.offsetWidth / 2 - 4)}px`;
      dica.style.top = `${py}px`;
    };
    const esconder = () => {
      for (const n of [cruz, ponto]) n.setAttribute("visibility", "hidden");
      dica.hidden = true;
    };
    alvo.addEventListener("pointermove", (e) => mostrar(e.offsetX));
    alvo.addEventListener("pointerleave", esconder);
  };
  desenhar();
  new ResizeObserver(() => desenhar()).observe(area);
}

function desenharRanking(caixa, pontos, fmt) {
  const max = Math.max(...pontos.map((p) => p.valor));
  const lista = document.createElement("ol");
  lista.className = "ranking";
  for (const p of pontos) {
    const li = document.createElement("li");
    li.title = `${rotuloLegivel(p.rotulo)}: ${fmt.valor(p.valor)}`;
    const nome = document.createElement("span");
    nome.className = "ranking-nome";
    nome.textContent = rotuloLegivel(p.rotulo);
    const trilho = document.createElement("span");
    trilho.className = "ranking-trilho";
    const barra = document.createElement("span");
    barra.className = "ranking-barra";
    // Todas na mesma escala; os 72 px finais ficam para o valor na ponta.
    const fracao = max > 0 ? Math.max(0.005, p.valor / max) : 0;
    barra.style.width = `calc((100% - 72px) * ${fracao})`;
    barra.style.background = COR;
    const valor = document.createElement("span");
    valor.className = "ranking-valor";
    valor.textContent = fmt.valor(p.valor);
    trilho.append(barra, valor);
    li.append(nome, trilho);
    lista.append(li);
  }
  caixa.append(lista);
}

/**
 * Desenha o gráfico em `destino`. Devolve false (e não desenha nada) quando
 * não há o que mostrar: menos de 2 pontos, ou ranking com valor negativo.
 */
export function desenharGrafico(destino, entrada, saida) {
  const pontos = lerTabela(saida);
  const tipo = entrada?.tipo === "ranking" ? "ranking" : "serie";
  if (pontos.length < 2) return false;
  if (tipo === "ranking" && pontos.some((p) => p.valor < 0)) return false;
  const fmt = formatador(entrada?.unidade);
  const caixa = document.createElement("figure");
  caixa.className = `grafico grafico-${tipo}`;
  caixa.dataset.titulo = entrada?.titulo ?? "";
  const titulo = document.createElement("figcaption");
  titulo.textContent = entrada?.titulo ?? "";
  if (entrada?.unidade) {
    const u = document.createElement("span");
    u.textContent = ` (${entrada.unidade})`;
    titulo.append(u);
  }
  caixa.append(titulo);
  destino.append(caixa);
  if (tipo === "ranking") desenharRanking(caixa, pontos, fmt);
  else desenharSerie(caixa, pontos, fmt);
  caixa.append(tabelaDeDados(pontos, fmt));
  return true;
}
