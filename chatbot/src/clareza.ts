/**
 * Juiz de clareza: lê as respostas de uma rodada já gravada (resultados/brutos/
 * <rotulo>) e pergunta a um modelo se quem não é especialista entende cada uma.
 * Separado do juiz de acerto (avaliar.ts), que de propósito não julga estilo:
 * uma resposta pode estar certa e cheia de jargão, e as duas notas mudam por
 * motivos diferentes.
 *
 * O critério vem da Lei 15.263/2025 (Política Nacional de Linguagem Simples),
 * que vale para a Sudene: art. 5º, IV (palavras comuns), V (termo técnico e
 * jargão com sinônimo ou explicado no texto), VI (estrangeirismo), VIII (nome
 * completo antes da sigla), X (o mais importante primeiro), II/XIII (frases
 * curtas, sem intercaladas). Os critérios de número são do Data Nordeste.
 *
 * Com ANTHROPIC_API_KEY no .env, gasta a chave (uns US$ 0,01 por resposta no
 * Sonnet); sem ela, a assinatura de quem roda (claude -p). Ver juiz-claude.ts.
 *
 * Uso:
 *   npm run clareza -- c13-todas                 # julga o que ainda não tem nota
 *   npm run clareza -- c13-todas --so M01,E02 --refazer
 *   npm run clareza -- c13-todas --resumir       # só refaz o resumo
 *
 * Grava a nota em cada turno do resultados/brutos/<rotulo>/<id>.json (campo
 * clareza) e o resumo em resultados/rodadas/<rotulo>-clareza.md.
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import { PACOTE } from "./avaliacao.ts";
import { gastoDosJuizes, motorDoJuiz, perguntarAoClaude } from "./juiz-claude.ts";

const { values: opc, positionals } = parseArgs({
  options: {
    so: { type: "string" },
    juiz: { type: "string", default: "claude-sonnet-5-5" },
    paralelo: { type: "string", default: "4" },
    refazer: { type: "boolean", default: false },
    resumir: { type: "boolean", default: false },
  },
  allowPositionals: true,
});

type NotaClareza = "clara" | "pode melhorar" | "difícil";
type Tipo = "sigla" | "termo técnico" | "jargão interno" | "número" | "frase" | "estrangeirismo";
type Problema = { trecho: string; tipo: Tipo; peso: "grave" | "leve"; sugestao: string };
type Clareza = { nota: NotaClareza; problemas: Problema[]; modelo: string };
type TurnoGravado = { pergunta: string; resposta: string | null; clareza?: Clareza };
type ResultadoGravado = { id: string; categoria: string; turnos: TurnoGravado[] };

export const JUIZ_CLAREZA = `Você revisa a linguagem das respostas do assistente de dados do Data Nordeste, o portal público de dados da Sudene. O portal foi feito para gestores públicos (inclusive de prefeituras pequenas), jornalistas, estudantes, empresários e qualquer cidadão da região, e promete que "mesmo quem não entende de análise estatística" consegue usar os dados. A Sudene é órgão federal e segue a Lei 15.263/2025 (Política Nacional de Linguagem Simples).

Leia a resposta como essa pessoa leria: alguém que sabe o que é município, estado, população, porcentagem, média e taxa, mas não conhece siglas de sistemas de dados, termos de estatística ou de economia, nem a parte técnica do portal. A pergunta: ela entende a resposta na primeira leitura, sem pesquisar nada?

Aponte só o que atrapalha essa pessoa. Tipos de problema:
- sigla: sigla sem o nome por extenso ou explicação curta na primeira vez (IDHM, Sinasc, SIM, Caged, PNAD, Ideb, Inep, CadÚnico, UF, VAB). Não aponte IBGE, SUS, PIB, INSS, CPF, R$: são de uso comum. Sigla só na linha "Fonte:" é leve quando o órgão aparece por extenso ou é conhecido (ex.: "DATASUS, Ministério da Saúde").
- termo técnico: palavra de estatística, economia, demografia ou geografia oficial que a pessoa não conhece, usada sem explicar (per capita, pontos percentuais, mediana, média ponderada, preços correntes, deflacionado, valor adicionado, índice de Gini, região imediata, região intermediária, mesorregião, série histórica, nascidos vivos como base de taxa, cobertura vacinal acima de 100%). Explicar em poucas palavras no próprio texto resolve ("R$ 20 mil por habitante (PIB per capita)", "o Gini, que vai de 0 a 1 e é maior quanto mais desigual").
- jargão interno: palavra do funcionamento do assistente ou do banco, que não significa nada para quem lê: tabelão, ferramenta, consulta, banco de dados, base, catálogo, código do território, nome de coluna ou identificador (com sublinhado, como taxa_analfabetismo), "recorte" no sentido técnico, "o indicador X não tem a dimensão Y".
- número: número que a pessoa não sabe interpretar: índice sem dizer a escala ou o que é bom (IDHM 0,62 sem dizer que vai de 0 a 1), taxa sem a base ("12,3" sem "por mil nascidos vivos"), ou uma lista de números sem dizer qual é a resposta.
- frase: frase longa ou em ordem indireta, com intercaladas, voz passiva que esconde quem fez, ou a informação principal só no fim da resposta (a primeira frase deve responder a pergunta).
- estrangeirismo: palavra estrangeira que não é de uso corrente (ranking, link, download e site são de uso corrente).

Peso:
- grave: impede ou distorce o entendimento da resposta principal (o termo central da resposta sem explicação, jargão interno, número principal sem escala).
- leve: incomoda mas não impede entender (sigla na linha de fonte, termo secundário).

Nota:
- "clara": nenhum problema grave e no máximo um leve.
- "pode melhorar": nenhum grave, mas dois ou mais leves; ou um grave num ponto secundário.
- "difícil": algum problema grave na resposta principal.

Não aponte:
- palavras comuns (taxa, média, percentual, índice, população, renda, município, estado, região, Nordeste, Semiárido, Caatinga, área de atuação da Sudene, Censo, censo demográfico, cobertura);
- o nome oficial do indicador quando vem com o que ele mede ("taxa de mortalidade infantil, óbitos de menores de 1 ano por mil nascidos vivos");
- falta de detalhe: respostas curtas são boas; não peça para acrescentar contexto que a pessoa não pediu;
- casas decimais e centavos: o assistente segue as casas do catálogo do portal (até duas), de propósito;
- as perguntas sugeridas no fim (linhas com »), a formatação em negrito ou listas, nem se os números estão certos (outro juiz confere isso).

Se a pessoa usou o termo na pergunta (ex.: perguntou do IDHM ou do PIB per capita), o termo pode aparecer sem explicação, mas um número de índice ainda precisa da escala.

Em cada problema, copie o trecho exato da resposta (curto), diga o tipo e o peso, e dê a sugestão: como dizer de forma simples, em poucas palavras. Sem problemas, devolva a lista vazia.`;

const ESQUEMA_CLAREZA = JSON.stringify({
  type: "object",
  properties: {
    nota: { type: "string", enum: ["clara", "pode melhorar", "difícil"] },
    problemas: {
      type: "array",
      items: {
        type: "object",
        properties: {
          trecho: { type: "string" },
          tipo: { type: "string", enum: ["sigla", "termo técnico", "jargão interno", "número", "frase", "estrangeirismo"] },
          peso: { type: "string", enum: ["grave", "leve"] },
          sugestao: { type: "string" },
        },
        required: ["trecho", "tipo", "peso", "sugestao"],
        additionalProperties: false,
      },
    },
  },
  required: ["nota", "problemas"],
  additionalProperties: false,
});

/** O juiz vê as perguntas anteriores (contexto), mas julga só a resposta do turno. */
function textoParaOJuiz(r: ResultadoGravado, i: number) {
  const anteriores = r.turnos.slice(0, i).map((t, j) => `${j + 1}. ${t.pergunta}`);
  const resposta = (r.turnos[i].resposta ?? "").replace(/\n\s*».*$/gm, "").trim();

  return [
    ...(anteriores.length ? ["## Perguntas anteriores da mesma conversa", ...anteriores, ""] : []),
    "## Pergunta",
    r.turnos[i].pergunta,
    "",
    "## Resposta do assistente",
    resposta,
  ].join("\n");
}

async function julgarTurno(r: ResultadoGravado, i: number): Promise<Clareza | undefined> {
  const j = await perguntarAoClaude<Omit<Clareza, "modelo">>({
    modelo: opc.juiz!,
    sistema: JUIZ_CLAREZA,
    esquema: ESQUEMA_CLAREZA,
    texto: textoParaOJuiz(r, i),
    rotulo: `${r.id}#${i + 1}`,
  });

  return j && { ...j, modelo: opc.juiz! };
}

function lerRodada(dir: string): Array<{ arquivo: string; r: ResultadoGravado }> {
  return readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => ({ arquivo: path.join(dir, f), r: JSON.parse(readFileSync(path.join(dir, f), "utf8")) as ResultadoGravado }));
}

async function julgarRodada(dir: string) {
  const so = opc.so ? new Set(opc.so.split(",")) : null;
  const fila = lerRodada(dir).filter(({ r }) => !so || so.has(r.id));
  const pendentes = (r: ResultadoGravado) =>
    r.turnos.flatMap((t, i) => (t.resposta && (opc.refazer || !t.clareza) ? [i] : []));
  let feitos = 0;
  const total = fila.reduce((a, { r }) => a + pendentes(r).length, 0);
  console.log(`${total} respostas para julgar`);

  async function trabalhar() {
    for (let item = fila.shift(); item; item = fila.shift()) {
      for (const i of pendentes(item.r)) {
        const c = await julgarTurno(item.r, i);
        if (c) item.r.turnos[i].clareza = c;
        console.log(`[${++feitos}/${total}] ${item.r.id}#${i + 1} ${c?.nota ?? "sem nota"}`);
      }
      writeFileSync(item.arquivo, JSON.stringify(item.r, null, 1));
    }
  }
  await Promise.all(Array.from({ length: Number(opc.paralelo) }, trabalhar));
}

function resumir(rotulo: string, dir: string) {
  const turnos = lerRodada(dir).flatMap(({ r }) => r.turnos.map((t, i) => ({ id: `${r.id}#${i + 1}`, t })));
  const julgados = turnos.filter(({ t }) => t.clareza);
  const conta = (f: (c: Clareza) => boolean) => julgados.filter(({ t }) => f(t.clareza!)).length;
  const problemas = julgados.flatMap(({ id, t }) => t.clareza!.problemas.map((p) => ({ id, ...p })));
  const porTipo = new Map<string, { grave: number; leve: number }>();
  for (const p of problemas) {
    const n = porTipo.get(p.tipo) ?? { grave: 0, leve: 0 };
    n[p.peso]++;
    porTipo.set(p.tipo, n);
  }
  const linhas = [
    `# Clareza: ${rotulo}`,
    "",
    `Juiz: ${julgados[0]?.t.clareza?.modelo ?? "?"}. Critério: src/clareza.ts (Lei 15.263/2025, art. 5º).`,
    "",
    `| Nota | Respostas |`,
    `|---|---|`,
    `| clara | ${conta((c) => c.nota === "clara")} |`,
    `| pode melhorar | ${conta((c) => c.nota === "pode melhorar")} |`,
    `| difícil | ${conta((c) => c.nota === "difícil")} |`,
    `| sem nota | ${turnos.length - julgados.length} |`,
    "",
    `| Tipo de problema | Grave | Leve |`,
    `|---|---|---|`,
    ...[...porTipo].sort((a, b) => b[1].grave - a[1].grave).map(([tipo, n]) => `| ${tipo} | ${n.grave} | ${n.leve} |`),
    "",
    "## Problemas graves",
    "",
    ...problemas.filter((p) => p.peso === "grave").map((p) => `- **${p.id}** (${p.tipo}) “${p.trecho}” → ${p.sugestao}`),
    "",
    "## Problemas leves",
    "",
    ...problemas.filter((p) => p.peso === "leve").map((p) => `- **${p.id}** (${p.tipo}) “${p.trecho}” → ${p.sugestao}`),
  ];
  const saida = path.join(PACOTE, "resultados/rodadas", `${rotulo}-clareza.md`);
  writeFileSync(saida, linhas.join("\n") + "\n");
  console.log(linhas.slice(0, 16).join("\n"));
  console.log(`\nResumo em ${saida}`);
}

const rotulo = positionals[0];
if (!rotulo) throw new Error('Falta o rótulo da rodada; esperado algo como "npm run clareza -- c13-todas".');
const dir = path.join(PACOTE, "resultados/brutos", rotulo);
if (!opc.resumir) await julgarRodada(dir);
resumir(rotulo, dir);
if (motorDoJuiz === "api" && gastoDosJuizes() > 0)
  console.error(`Juiz pela API: US$ ${gastoDosJuizes().toFixed(2)}.`);
