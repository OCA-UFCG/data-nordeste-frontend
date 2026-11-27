import { ehNumero, type Linhas } from "./banco.ts";

/**
 * O resumo de uma série ou de um ranking, calculado aqui (copiado do chat do
 * SEDES). O modelo copia estes números em vez de achar de olho o maior, o
 * menor e a tendência numa lista: era onde o Haiku errava ("o único aumento da
 * série", "sem tendência").
 */
// Casas pelo tamanho do número: com 1 casa fixa (como no SEDES, onde quase
// tudo é %), o IDHM 0,682 virava 0,7.
const num1 = (v: number) => {
  const casas = Math.abs(v) >= 100 ? 1 : Math.abs(v) >= 1 ? 2 : 3;

  return String(Math.round(v * 10 ** casas) / 10 ** casas).replace(".", ",");
};

// No ranking e no mapa não vai a média simples dos itens: no datane o estado e
// o recorte têm valor próprio (razão das somas), e o modelo citava a média dos
// municípios como se fosse o valor do estado.
/**
 * Mesmo valor, sem o resíduo da conta em ponto flutuante: no tabelão, 4
 * municípios da Paraíba tinham 100,00000000000001% da área em seca e 56 tinham
 * 100%, e o resumo dizia "maior 100 (4 com esse valor)" (gamma, 25/11/2026).
 */
const iguais = (a: number, b: number) => Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a), Math.abs(b));

export function resumoCalculado(
  tipo: "serie" | "ranking",
  pontos: Array<{ rotulo: string; valor: number }>,
  unidade?: string,
): string {
  if (pontos.length < 3) return "";
  const vs = pontos.map((p) => p.valor);
  const max = Math.max(...vs);
  const min = Math.min(...vs);
  const media = vs.reduce((a, b) => a + b, 0) / vs.length;
  const onde = (v: number) => {
    const r = pontos.filter((p) => iguais(p.valor, v)).map((p) => p.rotulo);
    // A contagem vai por extenso: com "a, b, c e mais 60", o Haiku contou 5 (rodada v2, SC02).
    return r.length > 3
      ? `${r.length} com esse valor: ${r.slice(0, 3).join(", ")} e mais ${r.length - 3}`
      : r.join(", ");
  };
  const linhas = [
    `Resumo calculado (copie daqui; não refaça de cabeça):`,
    `- ${tipo === "serie" ? `${pontos.length} períodos, de ${pontos[0].rotulo} a ${pontos.at(-1)!.rotulo}` : `${pontos.length} itens`}; maior ${num1(max)} (${onde(max)}); menor ${num1(min)} (${onde(min)})${tipo === "serie" ? `; média simples dos ${pontos.length} ${num1(media)}` : ""}.`,
  ];
  if (tipo === "ranking") {
    const ordenados = [...vs].sort((a, b) => a - b);
    const meio = ordenados.length >> 1;
    const mediana =
      ordenados.length % 2
        ? ordenados[meio]
        : (ordenados[meio - 1] + ordenados[meio]) / 2;
    const zeros = vs.filter((v) => iguais(v, 0)).length;
    linhas.push(
      `- mediana ${num1(mediana)}${zeros ? `; ${zeros} com valor 0` : ""}.`,
    );
    return linhas.join("\n");
  }
  const primeiro = pontos[0];
  const ultimo = pontos.at(-1)!;
  const penultimo = pontos.at(-2)!;
  const d = ultimo.valor - primeiro.valor;
  linhas.push(
    `- Do primeiro ao último: ${num1(primeiro.valor)} (${primeiro.rotulo}) → ${num1(ultimo.valor)} (${ultimo.rotulo}), ${iguais(primeiro.valor, ultimo.valor) ? "sem mudança" : `${d > 0 ? "alta" : "queda"} de ${num1(Math.abs(d))}`}. Do penúltimo (${penultimo.rotulo}, ${num1(penultimo.valor)}) ao último: ${iguais(ultimo.valor, penultimo.valor) ? "igual" : `${ultimo.valor > penultimo.valor ? "alta" : "queda"} de ${num1(Math.abs(ultimo.valor - penultimo.valor))}`}.`,
  );
  // "Quanto cresceu?" pede a variação em %. Só quando o valor não é ele mesmo
  // uma porcentagem: em "% da área", "caiu 50%" se confunde com 50 pontos.
  if (unidade && !unidade.includes("%") && primeiro.valor > 0 && ultimo.valor > 0 && d !== 0) {
    const rel = (ultimo.valor / primeiro.valor - 1) * 100;
    linhas.push(
      `- Variação do primeiro ao último, em relação ao primeiro: ${rel > 0 ? "+" : "−"}${num1(Math.abs(rel))}% (o último é ${num1(ultimo.valor / primeiro.valor)} vezes o primeiro).`,
    );
  }
  const altas: string[] = [];
  const quedas: string[] = [];
  for (let i = 1; i < vs.length; i++) {
    if (vs[i] > vs[i - 1]) altas.push(pontos[i].rotulo);
    else if (vs[i] < vs[i - 1]) quedas.push(pontos[i].rotulo);
  }
  // Com poucas altas (ou quedas), dizer quais: o modelo contava de cabeça e
  // esquecia as pequenas ("só subiu em 2022", quando subiu também em 2020 e 2024).
  const quais = (ps: string[]) =>
    ps.length && ps.length <= 6 ? ` (em ${ps.join(", ")})` : "";
  linhas.push(
    `- De um período para o seguinte: ${altas.length} altas${quais(altas)}, ${quedas.length} quedas${quais(quedas)}, ${vs.length - 1 - altas.length - quedas.length} iguais.`,
  );
  // Sequências de períodos seguidos acima de zero (ex.: meses em seca).
  if (min === 0 && max > 0) {
    let atual = 0;
    for (let i = vs.length - 1; i >= 0 && vs[i] > 0; i--) atual += 1;
    let maior = 0;
    let fimDaMaior = -1;
    let corrida = 0;
    vs.forEach((v, i) => {
      corrida = v > 0 ? corrida + 1 : 0;
      if (corrida > maior) {
        maior = corrida;
        fimDaMaior = i;
      }
    });
    linhas.push(
      `- Períodos seguidos com valor acima de 0: ${atual ? `${atual} até o último (desde ${pontos[vs.length - atual].rotulo})` : `nenhum agora (o último, ${ultimo.rotulo}, é 0)`}; a maior sequência foi de ${maior} (${pontos[fimDaMaior - maior + 1].rotulo} a ${pontos[fimDaMaior].rotulo}).`,
    );
  }
  return linhas.join("\n");
}

/** Os rótulos das linhas com o maior ou o menor valor da coluna (empates juntos). */
function quemTem(linhas: Linhas, rotulo: string, coluna: string, alvo: number): string {
  return linhas
    .filter((l) => iguais(l[coluna] as number, alvo))
    .map((l) => String(l[rotulo]))
    .join(", ");
}

/**
 * Tabela larga (um lugar por linha, um indicador por coluna): quem tem o maior
 * e o menor valor de cada coluna. Nas capitais (gamma, 25/11/2026), o Haiku
 * achou de cabeça "Teresina tem o menor PIB por habitante" com Salvador mais
 * baixo na própria tabela, e a revisão deixou passar. Só nomes, sem números:
 * os valores já estão na tabela, com as casas certas.
 *
 *   extremosPorColuna(["rotulo", "pib", "idhm"], linhas)
 *   // "Maior e menor de cada coluna (...):\n- pib: maior Recife; menor Salvador\n- idhm: ..."
 */
export function extremosPorColuna(colunas: string[], linhas: Linhas): string {
  if (linhas.length < 3) return "";
  const rotulo = colunas.find((c) => linhas.every((l) => typeof l[c] === "string"));
  if (!rotulo || new Set(linhas.map((l) => l[rotulo])).size < linhas.length) return "";
  const numericas = colunas.filter((c) => c !== rotulo && linhas.every((l) => ehNumero(l[c])));
  if (numericas.length < 2) return "";
  const extremos = numericas.map((c) => {
    const vs = linhas.map((l) => l[c] as number);

    return `- ${c}: maior ${quemTem(linhas, rotulo, c, Math.max(...vs))}; menor ${quemTem(linhas, rotulo, c, Math.min(...vs))}`;
  });

  return [`Maior e menor de cada coluna, entre as ${linhas.length} linhas desta saída (calculado; use isto para "o maior" e "o menor", não ache de olho):`, ...extremos].join("\n");
}
