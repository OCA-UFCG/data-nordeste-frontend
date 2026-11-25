/**
 * Varre as respostas guardadas de uma ou mais rodadas atrás do que o juiz não
 * olha, porque nenhum gabarito pede: nome interno chegando à pessoa, língua
 * errada, SQL na resposta, link de fora do portal, resposta longa demais,
 * comentário da revisão que chegou à pessoa e gráfico com barras de mesmo
 * nome (o juiz lê só o texto, não o gráfico).
 *
 * Nasceu em 24/11/2026: "Fonte: tabelão do Data Nordeste" estava em ~1 de cada
 * 10 respostas, e o juiz deu "certo" a todas (diário do processo, na documentação interna).
 *
 * Uso:
 *   npm run varrer -- c6-todas            # uma rodada
 *   npm run varrer -- v4-haiku c6-todas   # várias
 */
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { PACOTE } from "./avaliacao.ts";
import { respostaNaLinguaErrada } from "./chat/lingua.ts";

type TurnoGuardado = {
  pergunta: string;
  resposta: string | null;
  ferramentas?: Array<{ nome: string; saida?: string }>;
};
type Achado = { regra: string; onde: string; trecho: string };

const BRUTOS = path.join(PACOTE, "resultados/brutos");
const PALAVRAS_MAX = 260;

/**
 * O primeiro rótulo repetido de um gráfico que a página desenhou: saída que
 * começa com "rotulo | valor" (pagina/grafico.js) e tem o mesmo rótulo em
 * duas linhas (conversa fe633356: "Campina Grande" três vezes, sem o ano).
 */
function rotuloRepetidoNoGrafico(t: TurnoGuardado): string | null {
  for (const f of t.ferramentas ?? []) {
    const linhas = (f.saida ?? "").split("\n");
    if (linhas[0] !== "rotulo | valor") continue;
    const vistos = new Set<string>();
    for (const linha of linhas.slice(1)) {
      if (!linha.includes(" | ")) break;
      const rotulo = linha.split(" | ")[0];
      if (vistos.has(rotulo)) return `"${rotulo}" em mais de uma barra`;
      vistos.add(rotulo);
    }
  }

  return null;
}

/** Cada regra devolve o trecho que a disparou, ou null. */
const REGRAS: Array<{ nome: string; acha: (t: TurnoGuardado) => string | null }> = [
  {
    nome: "nome interno na resposta",
    acha: (t) => t.resposta?.match(/.{0,40}\b(tabel[ãa]o|sqlite|valores_com_nomes|consultar_sql|buscar_territorio|detalhar_indicador|conteudo_do_portal)\b.{0,20}/iu)?.[0] ?? null,
  },
  {
    nome: "SQL na resposta",
    acha: (t) => t.resposta?.match(/.{0,30}\b(SELECT|WHERE)\b.{0,30}|\b(indicador|territorio)\s*=\s*'[^']*'/u)?.[0] ?? null,
  },
  {
    nome: "língua errada",
    acha: (t) => (t.resposta && respostaNaLinguaErrada(t.pergunta, t.resposta) ? t.resposta.slice(0, 60) : null),
  },
  {
    nome: "link de fora do portal",
    acha: (t) => t.resposta?.match(/https?:\/\/(?!datanordeste\.sudene\.gov\.br|zenodo\.org|doi\.org)\S+/u)?.[0] ?? null,
  },
  {
    // PX16, c12-todas: "Não encontrei erro que exija reescrever. Ajustei três
    // pontos..." abriu a resposta. Desde então a revisão usa uma marca.
    // "resposta anterior" fica de fora: numa conversa a pessoa fala dela (UR20).
    nome: "comentário da revisão na resposta",
    acha: (t) =>
      t.resposta
        ?.slice(0, 400)
        .match(/.{0,30}(n[ãa]o encontrei erros?\b|resposta corrigida|reescrev|confer[êe]ncia autom[áa]tica).{0,30}/iu)?.[0] ?? null,
  },
  {
    nome: "gráfico com rótulo repetido",
    acha: rotuloRepetidoNoGrafico,
  },
  {
    nome: `resposta com mais de ${PALAVRAS_MAX} palavras`,
    acha: (t) => {
      const n = t.resposta?.split(/\s+/u).length ?? 0;

      return n > PALAVRAS_MAX ? `${n} palavras` : null;
    },
  },
];

function turnosDaRodada(rotulo: string): Array<{ onde: string; turno: TurnoGuardado }> {
  const pasta = path.join(BRUTOS, rotulo);
  return readdirSync(pasta)
    .filter((f) => f.endsWith(".json"))
    .flatMap((f) => {
      const d = JSON.parse(readFileSync(path.join(pasta, f), "utf8")) as { id: string; turnos: TurnoGuardado[] };

      return d.turnos.map((turno, i) => ({ onde: `${rotulo}/${d.id}#${i + 1}`, turno }));
    });
}

function varrer(rotulos: string[]): { total: number; achados: Achado[] } {
  const turnos = rotulos.flatMap(turnosDaRodada);
  const achados = turnos.flatMap(({ onde, turno }) =>
    REGRAS.flatMap((r) => {
      const trecho = r.acha(turno);

      return trecho ? [{ regra: r.nome, onde, trecho: trecho.replace(/\s+/gu, " ") }] : [];
    }),
  );

  return { total: turnos.length, achados };
}

const rotulos = process.argv.slice(2);
if (!rotulos.length) {
  console.error('Uso: npm run varrer -- <rótulo da rodada> [outros rótulos]; ex.: npm run varrer -- c6-todas');
  process.exit(1);
}
const { total, achados } = varrer(rotulos);
console.log(`${total} respostas, ${achados.length} achados.`);
for (const regra of REGRAS.map((r) => r.nome)) {
  const daRegra = achados.filter((a) => a.regra === regra);
  if (!daRegra.length) continue;
  console.log(`\n${regra}: ${daRegra.length}`);
  for (const a of daRegra.slice(0, 15)) console.log(`  ${a.onde}: ${a.trecho}`);
}
