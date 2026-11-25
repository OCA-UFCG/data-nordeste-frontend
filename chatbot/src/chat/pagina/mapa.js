/**
 * Mapa de municípios de uma resposta: cada município pintado pelo valor da
 * consulta. Os valores vêm de /api/mapa, que
 * refaz no servidor a mesma consulta que o modelo fez; o mapa nunca mostra um
 * número que não saiu do tabelão.
 *
 * Uma grandeza só, então uma cor só, do claro ao escuro, em 5 faixas (a
 * legenda diz os limites). Contorno branco entre os municípios, dica ao passar
 * o mouse e "Ver os dados" em tabela. Os contornos são os simplificados da
 * visão geral do site: servem para ver o padrão, não a divisa exata.
 */
import { rotuloLegivel } from "./grafico.js";

// Verde do Data Nordeste em 5 passos de luminosidade (o mais claro ainda se separa do fundo branco).
const RAMPA = ["#e3f1e6", "#a9d8b6", "#5fb57c", "#018f39", "#06511f"];
const SEM_VALOR = "#dcdad6";
const SVG = "http://www.w3.org/2000/svg";

function s(tag, attrs, pai) {
  const n = document.createElementNS(SVG, tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  pai?.append(n);
  return n;
}

function formatar(v, unidade) {
  const u = (unidade ?? "").trim();
  const n = v.toLocaleString("pt-BR", {
    maximumFractionDigits: Math.abs(v) < 10 ? 2 : 1,
  });
  return u.startsWith("%") ? `${n}%` : n;
}

/** Limites "redondos" de 5 faixas entre o menor e o maior valor. */
function faixas(min, max) {
  if (min === max) return [min];
  const bruto = (max - min) / 5;
  const mag = 10 ** Math.floor(Math.log10(bruto));
  const passo = [1, 2, 2.5, 5, 10].map((k) => k * mag).find((p) => p >= bruto);
  const ini = Math.floor(min / passo) * passo;
  const cortes = [];
  for (let i = 1; i < 5; i++) cortes.push(Number((ini + i * passo).toFixed(10)));
  return cortes;
}

/**
 * Desenha o mapa em `destino`. `ref` diz ao servidor qual passo da conversa
 * refazer: { conversa, turno, passo }.
 */
export async function desenharMapa(destino, entrada, ref) {
  const caixa = document.createElement("figure");
  caixa.className = "grafico grafico-mapa";
  const titulo = document.createElement("figcaption");
  titulo.textContent = entrada?.titulo ?? "";
  if (entrada?.unidade) {
    const u = document.createElement("span");
    u.textContent = ` (${entrada.unidade})`;
    titulo.append(u);
  }
  const area = document.createElement("div");
  area.className = "mapa-area";
  area.textContent = "Desenhando o mapa…";
  caixa.append(titulo, area);
  destino.append(caixa);

  let dados;
  try {
    const q = new URLSearchParams({
      conversa: ref.conversa,
      turno: String(ref.turno),
      passo: ref.passo,
    });
    const resp = await fetch(`api/mapa?${q}`);
    dados = await resp.json();
    if (!resp.ok) throw new Error(dados.erro ?? `erro ${resp.status}`);
  } catch {
    caixa.remove();
    return false;
  }
  const itens = dados.itens ?? [];
  if (itens.length < 2) {
    caixa.remove();
    return false;
  }

  // Faixas e cor de cada município.
  const categorias = dados.categorias;
  const comValor = itens.filter((i) => i.valor !== null);
  const valores = comValor.map((i) => i.valor);
  const min = Math.min(...valores);
  const max = Math.max(...valores);
  const cortes = categorias ? [] : faixas(min, max);
  const faixaDe = (v) =>
    categorias
      ? Math.max(0, Math.min(4, Math.round(v) - 1))
      : cortes.filter((c) => v >= c).length;
  const rotuloDaFaixa = (k) => {
    if (categorias) return categorias[k];
    if (!cortes.length) return formatar(min, entrada?.unidade);
    if (k === 0) return `até ${formatar(cortes[0], entrada?.unidade)}`;
    if (k === cortes.length) {
      const ultimo = formatar(cortes[k - 1], entrada?.unidade);

      // Faixa de um valor só (60 municípios com 100% da área em seca, 25/11/2026):
      // "100% ou mais" não existe para porcentagem da área.
      return formatar(max, entrada?.unidade) === ultimo ? ultimo : `${ultimo} ou mais`;
    }
    return `${formatar(cortes[k - 1], entrada?.unidade)} a ${formatar(cortes[k], entrada?.unidade)}`;
  };
  const texto = (i) =>
    i.valor === null
      ? "sem dado"
      : categorias
        ? (categorias[Math.round(i.valor) - 1] ?? "")
        : formatar(i.valor, entrada?.unidade);

  // Projeção simples: longitude encolhida pelo cosseno da latitude do meio.
  let x0 = Infinity;
  let x1 = -Infinity;
  let y0 = Infinity;
  let y1 = -Infinity;
  for (const i of itens)
    for (const anel of i.aneis)
      for (const [lon, lat] of anel) {
        if (lon < x0) x0 = lon;
        if (lon > x1) x1 = lon;
        if (lat < y0) y0 = lat;
        if (lat > y1) y1 = lat;
      }
  const k = Math.cos((((y0 + y1) / 2) * Math.PI) / 180);
  const larguraGeo = (x1 - x0) * k || 1;
  const alturaGeo = y1 - y0 || 1;

  area.textContent = "";
  const dica = document.createElement("div");
  dica.className = "grafico-dica";
  dica.hidden = true;
  area.append(dica);

  const desenhar = () => {
    area.querySelector("svg")?.remove();
    const L = Math.max(area.clientWidth, 260);
    const escala = Math.min(L / larguraGeo, 420 / alturaGeo);
    const W = larguraGeo * escala;
    const H = alturaGeo * escala;
    const svg = s("svg", {
      width: L,
      height: H,
      viewBox: `${-(L - W) / 2} 0 ${L} ${H}`,
      role: "img",
    });
    svg.setAttribute("aria-label", entrada?.titulo ?? "Mapa");
    area.prepend(svg);
    for (const i of itens) {
      const d = i.aneis
        .map(
          (anel) =>
            anel
              .map(
                ([lon, lat], n) =>
                  `${n ? "L" : "M"}${((lon - x0) * k * escala).toFixed(1)},${((y1 - lat) * escala).toFixed(1)}`,
              )
              .join("") + "Z",
        )
        .join("");
      const forma = s(
        "path",
        {
          d,
          fill: i.valor === null ? SEM_VALOR : RAMPA[faixaDe(i.valor)],
          class: "mapa-forma",
        },
        svg,
      );
      forma.addEventListener("pointermove", (e) => {
        const r = area.getBoundingClientRect();
        dica.hidden = false;
        dica.innerHTML = "<span></span><strong></strong>";
        dica.firstChild.textContent = i.nome;
        dica.lastChild.textContent = texto(i);
        dica.style.left = `${Math.min(Math.max(e.clientX - r.left, 60), r.width - 60)}px`;
        dica.style.top = `${e.clientY - r.top}px`;
      });
      forma.addEventListener("pointerleave", () => {
        dica.hidden = true;
      });
    }
  };
  desenhar();
  let largura = area.clientWidth;
  new ResizeObserver(() => {
    if (Math.abs(area.clientWidth - largura) < 8) return;
    largura = area.clientWidth;
    desenhar();
  }).observe(area);

  // Legenda: as 5 faixas, do menor ao maior, com quantos municípios em cada.
  const legenda = document.createElement("ul");
  legenda.className = "mapa-legenda";
  const usadas = categorias ? 5 : cortes.length + 1;
  for (let f = 0; f < usadas; f++) {
    const n = comValor.filter((i) => faixaDe(i.valor) === f).length;
    const li = document.createElement("li");
    const cor = document.createElement("i");
    cor.style.background = RAMPA[f];
    const nome = document.createElement("span");
    nome.textContent = rotuloDaFaixa(f);
    const qtd = document.createElement("small");
    qtd.textContent = String(n);
    qtd.title = `${n} ${n === 1 ? "município" : "municípios"}`;
    li.append(cor, nome, qtd);
    legenda.append(li);
  }
  const semDado = itens.length - comValor.length;
  if (semDado) {
    const li = document.createElement("li");
    const cor = document.createElement("i");
    cor.style.background = SEM_VALOR;
    const nome = document.createElement("span");
    nome.textContent = "Sem dado";
    const qtd = document.createElement("small");
    qtd.textContent = String(semDado);
    li.append(cor, nome, qtd);
    legenda.append(li);
  }
  caixa.append(legenda);

  const det = document.createElement("details");
  det.className = "grafico-dados";
  det.innerHTML = "<summary>Ver os dados</summary>";
  const tabela = document.createElement("table");
  for (const i of [...itens].sort((a, b) => (b.valor ?? -1) - (a.valor ?? -1))) {
    const tr = tabela.insertRow();
    tr.insertCell().textContent = rotuloLegivel(i.nome);
    tr.insertCell().textContent = texto(i);
  }
  det.append(tabela);
  caixa.append(det);
  return true;
}
