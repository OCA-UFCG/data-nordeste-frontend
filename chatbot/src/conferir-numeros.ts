/**
 * Confere se os números de uma resposta saíram de algum lugar: das saídas das
 * ferramentas da conversa, das perguntas ou do prompt (catálogo e textos do
 * site). O que sobra é número que o modelo escreveu de cabeça: é o erro que
 * mais restava no Haiku ("descuido ao comentar números que ele mesmo leu").
 *
 * A conferência é tolerante de propósito, para não acusar resposta certa:
 * aceita o número arredondado como foi escrito, a soma, a diferença e a razão
 * de dois números das saídas, a soma de três, o complemento para 100 e a
 * contagem de linhas de uma tabela. Não confere inteiros pequenos nem anos.
 * Medida nas rodadas gravadas em 13/11/2026: veja resultados/avaliacao.md.
 */

export type NumeroEscrito = {
  /** Como aparece na resposta, ex.: "71,7". */
  texto: string;
  valor: number;
  /** Casas decimais escritas: dão a tolerância do arredondamento. */
  casas: number;
  /** Multiplicador de "mil", "milhões", "bilhões" depois do número. */
  escala: number;
};

const ESCALAS: Array<[RegExp, number]> = [
  [/^\s*(mil|thousand)\b/iu, 1e3],
  [/^\s*(milh[ãõ][oe]s?|mi|millones|mill[óo]n|million)\b/iu, 1e6],
  [/^\s*(bilh[ãõ][oe]s?|bi|billion)\b/iu, 1e9],
];

/** Tira o que tem dígito mas não é número de dado: links, datas, períodos. */
function limpar(texto: string) {
  return (
    texto
      .replace(/\]\([^)]*\)/gu, "]")
      .replace(/https?:\/\/\S+/gu, " ")
      // datas e períodos: 19/10/2026, 2026-09-21, 2026-09, set/2026
      .replace(/\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/gu, " ")
      .replace(/\b\d{4}-\d{2}(-\d{2})?\b/gu, " ")
      .replace(/\b[a-zç]{3}\/\d{4}\b/giu, " ")
      // numeração de lista e ordinais: "1. ", "2)", "1º", "3ª"
      .replace(/^\s*\d+[.)]\s/gmu, " ")
      .replace(/\b\d+[ºª°](?!C)/gu, " ")
  );
}

/**
 * Os números escritos numa resposta. Em português e espanhol a vírgula é a
 * decimal e o ponto separa milhares; em inglês, o contrário.
 */
export function numerosEscritos(
  resposta: string,
  lingua: "pt" | "en" | "es" = "pt",
): NumeroEscrito[] {
  const texto = limpar(resposta);
  const re =
    lingua === "en"
      ? /(?<![\p{L}\d.,])(\d{1,3}(?:,\d{3})+|\d+)(?:\.(\d+))?(?![\d])/gu
      : /(?<![\p{L}\d.,])(\d{1,3}(?:\.\d{3})+|\d+)(?:,(\d+))?(?![\d])/gu;
  const vistos = new Set<string>();
  const out: NumeroEscrito[] = [];
  for (const m of texto.matchAll(re)) {
    const inteiro = m[1].replace(/[.,]/gu, "");
    const decimal = m[2] ?? "";
    const valor = Number(`${inteiro}${decimal ? `.${decimal}` : ""}`);
    if (!Number.isFinite(valor)) continue;
    const depois = texto.slice(m.index + m[0].length, m.index + m[0].length + 12);
    const escala = ESCALAS.find(([r]) => r.test(depois))?.[1] ?? 1;
    // Inteiros pequenos (contagens, meses) e anos não dá para conferir. Mas
    // "1 em cada 8" é uma razão e tem de sair das saídas: o Haiku escreveu
    // isso para Cajazeiras sem consultar a população total, e era 1 em 6
    // (rodada c11-v0, PX09).
    const antes = texto.slice(Math.max(0, m.index - 12), m.index);
    const razao = /\b(em|a) cada\s*$/iu.test(antes);
    if (!razao && !decimal && escala === 1 && (valor <= 12 || (valor >= 1900 && valor <= 2100)))
      continue;
    if (vistos.has(m[0] + escala)) continue;
    vistos.add(m[0] + escala);
    out.push({ texto: m[0], valor, casas: decimal.length, escala });
  }
  return out;
}

/** Todo número de um texto de fonte, lido das duas formas (vírgula ou ponto decimal). */
export function numerosDaFonte(texto: string): number[] {
  const out = new Set<number>();
  for (const m of texto.matchAll(/\d+(?:[.,]\d+)*/gu)) {
    const t = m[0];
    const en = Number(t.replace(/,/gu, ""));
    const pt = Number(t.replace(/\./gu, "").replace(",", "."));
    if (Number.isFinite(en)) out.add(en);
    if (Number.isFinite(pt)) out.add(pt);
  }
  return [...out];
}

/** Os números de uma saída na ordem em que aparecem (ponto decimal, como nas tabelas do SQL). */
function numerosEmOrdem(texto: string): number[] {
  const out: number[] = [];
  for (const m of texto.matchAll(/(?<![\p{L}\d-])\d+(?:\.\d+)?(?![\d\p{L}])/gu)) {
    const n = Number(m[0]);
    if (Number.isFinite(n)) out.push(n);
  }
  return out;
}

// Dois valores de uma saída só se combinam se estiverem perto um do outro
// (linhas vizinhas de uma tabela); numa série longa, a diferença entre dois
// pontos quaisquer aceitaria quase qualquer número.
const JANELA = 30;

/** Somas e diferenças de valores vizinhos de uma saída de ferramenta. */
function contasEntreVizinhos(texto: string, bate: (v: number) => boolean) {
  const ns = numerosEmOrdem(texto);
  if (ns.length > 2000) return false;
  for (let i = 0; i < ns.length; i++) {
    for (let j = i + 1; j < ns.length && j - i <= JANELA; j++)
      if (bate(ns[i] - ns[j]) || bate(ns[i] + ns[j])) return true;
    // Soma de 3 ou 4 linhas seguidas (classes de um índice), de 1 a 3 colunas.
    for (const passo of [1, 2, 3]) {
      let soma = ns[i];
      for (let k = 1; k <= 3 && i + k * passo < ns.length; k++) {
        soma += ns[i + k * passo];
        if (k >= 2 && bate(soma)) return true;
      }
    }
  }
  return false;
}

/** Quantas linhas de dado tem cada tabela "a | b" de uma saída de ferramenta. */
function linhasDasTabelas(saida: string): number[] {
  const out: number[] = [];
  let n = 0;
  for (const linha of saida.split("\n")) {
    if (linha.includes(" | ")) n += 1;
    else {
      if (n > 1) out.push(n - 1);
      n = 0;
    }
  }
  if (n > 1) out.push(n - 1);
  return out;
}

export type Fontes = {
  /** Saídas (e entradas) das ferramentas da conversa até aqui. */
  ferramentas: string[];
  /** Perguntas da conversa e prompt do sistema: valem, mas não se combinam. */
  outras: string[];
};

/**
 * Os números da resposta que não vêm de nenhuma fonte. Lista vazia = tudo
 * conferido.
 *
 * Um número vale se está numa fonte (arredondado como foi escrito, ou o
 * complemento dele para 100), se é conta simples entre números da própria
 * resposta que estão nas fontes (soma, diferença, razão ou variação percentual
 * de dois, soma de três), ou se é soma ou diferença de valores vizinhos de uma
 * saída. Combinar todos os números das saídas entre si aceitaria quase
 * qualquer coisa (medido: pegava só 35% dos números trocados de propósito).
 */
export function numerosSemFonte(
  resposta: string,
  fontes: Fontes,
  lingua: "pt" | "en" | "es" = "pt",
): string[] {
  const escritos = numerosEscritos(resposta, lingua);
  if (!escritos.length) return [];

  const dasFerramentas = new Set<number>();
  for (const t of fontes.ferramentas) {
    for (const n of numerosDaFonte(t)) dasFerramentas.add(n);
    for (const n of linhasDasTabelas(t)) dasFerramentas.add(n);
  }
  const outras = new Set<number>();
  for (const t of fontes.outras) for (const n of numerosDaFonte(t)) outras.add(n);
  const listaFerramentas = [...dasFerramentas];
  const listaOutras = [...outras];

  const tolDe = (e: NumeroEscrito) =>
    // Meio dígito da última casa escrita, com folga para 44,95 → 44,9 ou 45,0.
    0.5 * 10 ** -e.casas * e.escala * 1.02 + 1e-9;
  const direto = (e: NumeroEscrito) => {
    const alvo = e.valor * e.escala;
    const tol = tolDe(e);
    const bate = (v: number) => Math.abs(Math.abs(v) - alvo) <= tol;
    return (
      listaFerramentas.some((s) => bate(s) || bate(s * 100) || bate(100 - s)) ||
      listaOutras.some(bate)
    );
  };

  const conferidos: number[] = [100];
  const pendentes: NumeroEscrito[] = [];
  for (const e of escritos)
    if (direto(e)) conferidos.push(e.valor * e.escala);
    else pendentes.push(e);

  const sem: string[] = [];
  for (const e of pendentes) {
    const alvo = e.valor * e.escala;
    const tol = tolDe(e);
    const bate = (v: number) =>
      Number.isFinite(v) && Math.abs(Math.abs(v) - alvo) <= tol;
    let achou = false;
    for (let i = 0; i < conferidos.length && !achou; i++) {
      const a = conferidos[i];
      for (let j = i + 1; j < conferidos.length && !achou; j++) {
        const b = conferidos[j];
        achou =
          bate(a + b) ||
          bate(a - b) ||
          bate((a / b) * 100) ||
          bate((b / a) * 100) ||
          bate(a / b) ||
          bate(b / a) ||
          bate(((a - b) / b) * 100) ||
          bate(((b - a) / a) * 100);
        for (let k = j + 1; k < conferidos.length && !achou; k++)
          achou = bate(a + b + conferidos[k]);
      }
    }
    if (!achou && e.escala === 1)
      achou = fontes.ferramentas.some((t) => contasEntreVizinhos(t, bate));
    if (!achou) sem.push(e.texto);
  }
  return sem;
}
