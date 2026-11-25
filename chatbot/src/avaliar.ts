/**
 * Avalia o bot com as perguntas de perguntas.md, pelo mesmo motor da página de
 * chat. Cada pergunta é uma conversa (as linhas "Depois:" continuam a mesma
 * conversa). Para cada resposta, grava tempo, rodadas, ferramentas e tokens,
 * confere os números esperados e pede a nota a um juiz (Sonnet, pelo claude).
 *
 * Com ANTHROPIC_API_KEY no .env (npm run avaliar carrega), o bot e o juiz
 * gastam a chave; sem ela, a assinatura de quem roda (motor "claude",
 * claude -p). --motor claude força a assinatura para o bot;
 * DATANE_JUIZ_MOTOR=claude, para o juiz.
 *
 * Uso:
 *   npm run avaliar                               # todas, Haiku
 *   npm run avaliar -- --modelo sonnet
 *   npm run avaliar -- --so M01,E02               # só algumas
 *   npm run avaliar -- --categoria M,E            # pelas letras do id
 *   npm run avaliar -- --rotulo antes             # nome da rodada
 *   npm run avaliar -- --motor api --sem-juiz
 *   npm run avaliar -- --juizar antes             # só refaz as notas de uma rodada
 *   npm run avaliar -- --comparar antes depois    # compara duas rodadas
 *   npm run avaliar -- --rotulo v9 --retomar      # só o que faltou ou deu erro na rodada v9
 *   npm run avaliar -- --arquivo conversas/candidatas.md --sem-juiz
 *                                         # outro arquivo no formato do perguntas.md
 *
 * Grava resultados/brutos/<rotulo>/<id>.json (fora do git) e o resumo em
 * resultados/rodadas/<rotulo>.md.
 */
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { parseArgs } from "node:util";
import {
  lerPerguntas,
  numerosFaltando,
  PACOTE,
  type Pergunta,
} from "./avaliacao.ts";
import { Turno, type FimDoTurno, type Motor } from "./chat/turno.ts";
import { catalogoResumido, encerrarFerramentas } from "./ferramentas/index.ts";
import { gastoDosJuizes, motorDoJuiz, perguntarAoClaude } from "./juiz-claude.ts";

const { values: opc, positionals } = parseArgs({
  options: {
    modelo: { type: "string", default: "haiku" },
    // Com a chave no .env, o bot e o juiz gastam a chave, não a assinatura.
    motor: { type: "string", default: process.env.ANTHROPIC_API_KEY ? "api" : "claude" },
    so: { type: "string" },
    categoria: { type: "string" },
    rotulo: { type: "string" },
    paralelo: { type: "string", default: "3" },
    "sem-juiz": { type: "boolean", default: false },
    juiz: { type: "string", default: "claude-sonnet-5-5" },
    juizar: { type: "string" },
    comparar: { type: "boolean", default: false },
    arquivo: { type: "string" },
    retomar: { type: "boolean", default: false },
  },
  allowPositionals: true,
});

const BRUTOS = path.join(PACOTE, "resultados/brutos");
const ARQUIVO = opc.arquivo ? path.resolve(opc.arquivo) : undefined;
const RODADAS = path.join(PACOTE, "resultados/rodadas");

// --- o que se grava de cada pergunta -----------------------------------------

type Tokens = {
  entrada: number;
  cache_leitura: number;
  cache_escrita: number;
  saida: number;
};

type TurnoGravado = {
  pergunta: string;
  resposta: string;
  ferramentas: Array<{
    nome: string;
    entrada: unknown;
    saida?: string;
    erro?: boolean;
    ms?: number;
  }>;
  /** Links para os painéis do portal que a página montou. */
  links?: Array<{ url: string; titulo: string }>;
  sugestoes?: string[];
  /** A conferência dos números mandou reescrever a resposta. */
  corrigida?: boolean;
  /** A revisão das frases foi pedida; e se ela trocou a resposta. */
  revisada?: boolean;
  reescrita_na_revisao?: boolean;
  revisao_sem_marca?: boolean;
  /** Números que continuaram sem fonte depois da correção. */
  numeros_sem_fonte?: string[];
  ms: number;
  rodadas: number | null;
  tokens: Tokens;
  custo_usd: number | null;
  erro: string | null;
};

type Nota = "certo" | "parcial" | "errado";

type Resultado = {
  id: string;
  categoria: string;
  modelo: string;
  motor: string;
  em: string;
  esperada: string;
  turnos: TurnoGravado[];
  numeros_faltando: string[];
  juiz?: { nota: Nota; motivo: string; modelo: string };
};

/** Junta o uso dos dois motores (claude: usage da API; api: o nosso Uso). */
function tokensDe(uso: unknown): { tokens: Tokens; rodadas: number | null } {
  const u = (uso ?? {}) as Record<string, number | undefined>;
  return {
    tokens: {
      entrada: u.input_tokens ?? u.entrada ?? 0,
      cache_leitura: u.cache_read_input_tokens ?? u.cache_leitura ?? 0,
      cache_escrita: u.cache_creation_input_tokens ?? u.cache_escrita ?? 0,
      saida: u.output_tokens ?? u.saida ?? 0,
    },
    rodadas: u.rodadas ?? null,
  };
}

// --- rodar as perguntas -------------------------------------------------------

async function criarMotor(): Promise<Motor> {
  if (opc.motor === "api") {
    if (!process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_BASE_URL)
      throw new Error("O motor api precisa de ANTHROPIC_API_KEY.");
    return (await import("./chat/motor-api.ts")).criarMotorApi();
  }
  // Pasta própria: não troca o mcp.json da página de chat que esteja aberta.
  process.env.DATANE_SESSAO ??= path.join(
    os.homedir(),
    ".cache/datane-chatbot-avaliacao",
  );
  // Sem processo de reserva: cada pergunta abre o seu, como nas rodadas antigas.
  return (await import("./chat/motor-claude.ts")).criarMotorClaude({
    argsExtras: ["--no-session-persistence"],
    reserva: false,
  });
}

function perguntar(
  motor: Motor,
  conversa: string,
  numero: number,
  pergunta: string,
  anteriores: TurnoGravado[],
) {
  return new Promise<{ turno: Turno; fim: FimDoTurno }>((ok) => {
    const turno = new Turno(
      numero,
      pergunta,
      () => {},
      (t, fim) => ok({ turno: t, fim }),
    );
    motor.responder({
      conversa,
      modelo: opc.modelo!,
      turno,
      contexto: {},
      anteriores: () => anteriores,
    });
  });
}

async function rodarPergunta(motor: Motor, p: Pergunta): Promise<Resultado> {
  const conversa = `avaliacao-${p.id}-${Date.now()}`;
  const turnos: TurnoGravado[] = [];
  try {
    for (const [i, pergunta] of p.perguntas.entries()) {
      const { turno, fim } = await perguntar(
        motor,
        conversa,
        i + 1,
        pergunta,
        turnos,
      );
      const { tokens, rodadas } = tokensDe(fim.uso);
      turnos.push({
        pergunta,
        resposta: turno.resposta,
        ferramentas: turno.ferramentas.map((f) => ({
          nome: f.nome,
          entrada: f.entrada,
          saida: f.saida,
          erro: f.erro,
          ms: f.ms,
        })),
        links: turno.links,
        sugestoes: turno.sugestoes,
        corrigida: turno.corrigida,
        revisada: turno.revisada,
        reescrita_na_revisao: turno.reescritaNaRevisao,
        revisao_sem_marca: turno.revisaoSemMarca,
        numeros_sem_fonte: turno.numerosSemFonte,
        ms: Date.now() - turno.inicio,
        rodadas,
        tokens,
        custo_usd: fim.custo_usd ?? null,
        erro: fim.erro ?? (fim.interrompida ? "interrompida" : null),
      });
      if (fim.erro) break;
    }
  } finally {
    motor.esquecer(conversa);
  }
  return {
    id: p.id,
    categoria: p.categoria,
    modelo: opc.modelo!,
    motor: motor.nome,
    em: new Date().toISOString(),
    esperada: p.esperada,
    turnos,
    numeros_faltando: numerosFaltando(turnos.at(-1)?.resposta ?? "", p.numeros),
  };
}

/** Roda fn em cada item, com no máximo n ao mesmo tempo. */
async function emParalelo<T>(
  itens: T[],
  n: number,
  fn: (x: T) => Promise<void>,
) {
  const fila = [...itens];
  await Promise.all(
    Array.from({ length: Math.min(n, fila.length) }, async () => {
      for (let x = fila.shift(); x !== undefined; x = fila.shift()) await fn(x);
    }),
  );
}

// --- juiz ---------------------------------------------------------------------

const SOBRE = readFileSync(path.join(PACOTE, "conhecimento/sobre-o-datane.md"), "utf8").replace(/^<!--[\s\S]*?-->\n*/, "");

const JUIZ_SISTEMA = `Você confere respostas do assistente de dados do Data Nordeste, o portal de dados da Sudene. O assistente responde a pessoas que não são especialistas, usando ferramentas que consultam o "tabelão", uma camada curada montada a partir do banco do portal, com os valores de municípios, estados, regiões e recortes já calculados.

O que o assistente deve fazer:
- Responder o que foi perguntado, na língua da pergunta, em linguagem simples, indo ao ponto.
- Tirar todo número das ferramentas chamadas na conversa; nunca inventar, estimar nem usar conhecimento próprio para dados.
- Dizer junto dos números o indicador, o ano (ou mês) e o território, e a fonte.
- Usar o valor próprio de estados e recortes (não somar municípios nem tirar média de taxas).
- Dizer claramente quando o dado não existe (indicador, ano ou lugar), sem estimar, e indicar o painel do portal para os temas que só estão lá.
- Perguntar a UF quando o município tem homônimos e a pessoa não disse (ou responder para todos, com a UF de cada um).
- Avisar quando o número é de MG ou ES (só a parte na área da Sudene), do ano em curso (parcial) ou quando a cobertura vacinal passa de 100%.
- Recusar pedidos fora do tema e não dar opinião política.
- Numa conversa com várias perguntas, entender as perguntas seguintes no contexto das anteriores.

O botão para o painel do portal não é escrito pelo assistente: a página o monta a partir das consultas e ele aparece abaixo da resposta. Séries, rankings e mapas são desenhados pela página quando a consulta vem com grafico; num mapa, o assistente recebe só o resumo e os extremos, e a pessoa vê todos os municípios. As perguntas sugeridas no fim não fazem parte da resposta e não são mostradas aqui.

Notas:
- "certo": responde corretamente o essencial da resposta esperada, com números que batem com as ferramentas e sem afirmações falsas.
- "parcial": o essencial está certo, mas falta algo que a resposta esperada exige (um item, o ano, uma ressalva) ou há um problema menor que confundiria quem lê.
- "errado": número errado ou inventado, afirmação falsa, deixa de responder, escolhe sozinho entre municípios homônimos, sai do escopo, ou interpreta errado a pergunta.

A resposta esperada foi escrita à mão e pode ter detalhes a mais; não exija palavra por palavra. Se o assistente diverge da resposta esperada, mas as saídas das ferramentas mostram que ele está certo, a nota pode ser "certo": diga isso no motivo. Não julgue formatação nem estilo, a não ser que atrapalhe entender. O texto que aparece antes da última chamada de ferramenta não chega a quem pergunta; julgue só a resposta final de cada pergunta.

No motivo, em até 3 frases, diga o que está errado ou faltando (ou "ok"). Seja específico: cite o número ou trecho.

O assistente também tem no prompt o texto sobre o portal e o catálogo de indicadores abaixo. O que vem deles conta como consultado.

${SOBRE}

## Catálogo de indicadores

${catalogoResumido()}`;

const ESQUEMA_JUIZ = JSON.stringify({
  type: "object",
  properties: {
    nota: { type: "string", enum: ["certo", "parcial", "errado"] },
    motivo: { type: "string" },
  },
  required: ["nota", "motivo"],
  additionalProperties: false,
});

function textoParaOJuiz(r: Resultado) {
  const partes: string[] = [];
  r.turnos.forEach((t, i) => {
    partes.push(`## Pergunta ${i + 1}`, t.pergunta, "");
    if (t.ferramentas.length) {
      partes.push("### Ferramentas chamadas");
      for (const f of t.ferramentas) {
        const saida = (f.saida ?? "").replace(/\n\((Fonte: tabelão|Dados do Data Nordeste)[^\n]*\)/, "");
        const curta = saida.slice(0, 12000);
        partes.push(
          `- ${f.nome} ${JSON.stringify(f.entrada)}${f.erro ? " [ERRO]" : ""}`,
          "```",
          curta,
          "```",
        );
      }
    }
    partes.push(
      `### Resposta final do assistente`,
      t.resposta || `(sem resposta${t.erro ? `: ${t.erro}` : ""})`,
      "",
    );
    if (t.links?.length)
      partes.push(
        `Botões de painel que a página mostrou junto da resposta: ${t.links.map((l) => `${l.titulo} (${l.url})`).join(" ; ")}`,
        "",
      );
  });
  partes.push(
    "## Resposta esperada (para a última pergunta)",
    r.esperada || "(não informada)",
  );
  if (r.numeros_faltando.length)
    partes.push(
      "",
      `Atenção: estes números esperados não aparecem na última resposta: ${r.numeros_faltando.join(", ")}.`,
    );
  return partes.join("\n");
}

async function julgar(r: Resultado): Promise<Resultado["juiz"]> {
  const j = await perguntarAoClaude<{ nota: Nota; motivo: string }>({
    modelo: opc.juiz!,
    sistema: JUIZ_SISTEMA,
    esquema: ESQUEMA_JUIZ,
    texto: textoParaOJuiz(r),
    rotulo: r.id,
  });

  return j && { ...j, modelo: opc.juiz! };
}

// --- resumo -------------------------------------------------------------------

const media = (xs: number[]) =>
  xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN;
const quantil = (xs: number[], q: number) => {
  const s = [...xs].sort((a, b) => a - b);
  return s.length ? s[Math.min(s.length - 1, Math.floor(q * s.length))] : NaN;
};
const um = (x: number) =>
  Number.isNaN(x) ? "?" : x.toFixed(1).replace(".", ",");
const mil = (x: number) =>
  Number.isNaN(x)
    ? "?"
    : `${Math.round(x / 100) / 10}`.replace(".", ",") + " mil";
const entradaTotal = (t: Tokens) =>
  t.entrada + t.cache_leitura + t.cache_escrita;

function lerRodada(rotulo: string): Resultado[] {
  const dir = path.join(BRUTOS, rotulo);
  if (!existsSync(dir)) throw new Error(`Rodada não encontrada: ${dir}`);
  const ordem = new Map(lerPerguntas(ARQUIVO).map((p, i) => [p.id, i]));
  return readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map(
      (f) => JSON.parse(readFileSync(path.join(dir, f), "utf8")) as Resultado,
    )
    .sort((a, b) => (ordem.get(a.id) ?? 999) - (ordem.get(b.id) ?? 999));
}

function metricas(rs: Resultado[]) {
  const turnos = rs.flatMap((r) => r.turnos);
  const notas = rs.map((r) => r.juiz?.nota);
  return {
    perguntas: rs.length,
    turnos: turnos.length,
    certo: notas.filter((n) => n === "certo").length,
    parcial: notas.filter((n) => n === "parcial").length,
    errado: notas.filter((n) => n === "errado").length,
    sem_nota: notas.filter((n) => !n).length,
    numeros_faltando: rs.filter((r) => r.numeros_faltando.length).length,
    erros: turnos.filter((t) => t.erro).length,
    s_media: media(turnos.map((t) => t.ms / 1000)),
    s_mediana: quantil(
      turnos.map((t) => t.ms / 1000),
      0.5,
    ),
    s_p90: quantil(
      turnos.map((t) => t.ms / 1000),
      0.9,
    ),
    rodadas: media(turnos.flatMap((t) => (t.rodadas ? [t.rodadas] : []))),
    ferramentas: media(turnos.map((t) => t.ferramentas.length)),
    listar_indices:
      turnos.filter((t) =>
        t.ferramentas.some((f) => f.nome === "listar_indices"),
      ).length / (turnos.length || 1),
    tokens_entrada: media(turnos.map((t) => entradaTotal(t.tokens))),
    tokens_saida: media(turnos.map((t) => t.tokens.saida)),
    custo: turnos.reduce((a, t) => a + (t.custo_usd ?? 0), 0),
    corrigidas: turnos.filter((t) => t.corrigida).length,
    revisadas: turnos.filter((t) => t.revisada).length,
    reescritasNaRevisao: turnos.filter((t) => t.reescrita_na_revisao).length,
    revisaoSemMarca: turnos.filter((t) => t.revisao_sem_marca).length,
    sem_fonte: turnos.filter((t) => t.numeros_sem_fonte?.length).length,
    com_sugestoes: turnos.filter((t) => t.sugestoes?.length).length,
    com_link: turnos.filter((t) => t.links?.length).length,
    chamadas_com_erro: turnos.reduce(
      (a, t) =>
        a +
        t.ferramentas.filter((f) => f.erro || /^Erro/.test(f.saida ?? ""))
          .length,
      0,
    ),
  };
}

function linhaMetricas(m: ReturnType<typeof metricas>) {
  return [
    `| Perguntas (turnos) | ${m.perguntas} (${m.turnos}) |`,
    `| Notas do juiz | ${m.certo} certo · ${m.parcial} parcial · ${m.errado} errado${m.sem_nota ? ` · ${m.sem_nota} sem nota` : ""} |`,
    `| Com número esperado faltando | ${m.numeros_faltando} |`,
    `| Turnos com erro | ${m.erros} |`,
    `| Tempo por turno (média · mediana · p90) | ${um(m.s_media)} · ${um(m.s_mediana)} · ${um(m.s_p90)} s |`,
    `| Rodadas do modelo por turno | ${um(m.rodadas)} |`,
    `| Ferramentas por turno | ${um(m.ferramentas)} |`,
    `| Turnos que chamaram listar_indices | ${Math.round(m.listar_indices * 100)}% |`,
    `| Tokens de entrada por turno (com cache) | ${mil(m.tokens_entrada)} |`,
    `| Tokens de saída por turno | ${Math.round(m.tokens_saida)} |`,
    `| Custo somado (preço de API) | US$ ${m.custo.toFixed(2)} |`,
    `| Chamadas de ferramenta que voltaram com erro | ${m.chamadas_com_erro} |`,
    `| Respostas reescritas pela conferência dos números | ${m.corrigidas} |`,
    `| Respostas que passaram pela revisão das frases · trocadas por ela · correção perdida por falta da marca | ${m.revisadas} · ${m.reescritasNaRevisao} · ${m.revisaoSemMarca ?? 0} |`,
    `| Respostas que ficaram com número sem fonte | ${m.sem_fonte} |`,
    `| Turnos com link para o site · com perguntas sugeridas | ${m.com_link} · ${m.com_sugestoes} |`,
  ];
}

function resumir(rotulo: string) {
  const rs = lerRodada(rotulo);
  const m = metricas(rs);
  const ordemNota = { errado: 0, parcial: 1, undefined: 2, certo: 3 };
  const detalhes = [...rs]
    .sort(
      (a, b) =>
        ordemNota[String(a.juiz?.nota) as keyof typeof ordemNota] -
        ordemNota[String(b.juiz?.nota) as keyof typeof ordemNota],
    )
    .flatMap((r) => [
      `## ${r.id} — ${r.categoria} — ${r.juiz?.nota ?? "sem nota"}`,
      "",
      ...(r.juiz ? [`**Juiz:** ${r.juiz.motivo}`, ""] : []),
      ...(r.numeros_faltando.length
        ? [`**Números faltando:** ${r.numeros_faltando.join(", ")}`, ""]
        : []),
      `**Esperado:** ${r.esperada}`,
      "",
      ...r.turnos.flatMap((t) => [
        `**Pergunta:** ${t.pergunta}`,
        "",
        `${um(t.ms / 1000)} s · ${t.rodadas ?? "?"} rodadas · ${mil(entradaTotal(t.tokens))} tokens de entrada${t.erro ? ` · erro: ${t.erro}` : ""}`,
        "",
        ...t.ferramentas.map(
          (f) =>
            `1. ${f.nome}${f.erro ? " (erro)" : ""}: \`${JSON.stringify(f.entrada).replace(/`/g, "'").slice(0, 400)}\``,
        ),
        "",
        ...t.resposta.split("\n").map((l) => `> ${l}`),
        "",
      ]),
    ]);
  const md = [
    `# Rodada ${rotulo}`,
    "",
    `Modelo ${rs[0]?.modelo ?? "?"}, motor ${rs[0]?.motor ?? "?"}, juiz ${rs.find((r) => r.juiz)?.juiz?.modelo ?? "nenhum"}. Gerado por \`npm run avaliar\` em ${new Date().toISOString().slice(0, 16)}.`,
    "",
    "| Medida | Valor |",
    "| --- | --- |",
    ...linhaMetricas(m),
    "",
    "| Id | Categoria | Nota | Tempo (s) | Rodadas | Ferramentas |",
    "| --- | --- | --- | --- | --- | --- |",
    ...rs.map(
      (r) =>
        `| ${r.id} | ${r.categoria} | ${r.juiz?.nota ?? "?"}${r.numeros_faltando.length ? " (nº)" : ""} | ${r.turnos.map((t) => um(t.ms / 1000)).join(" + ")} | ${r.turnos.map((t) => t.rodadas ?? "?").join(" + ")} | ${r.turnos.map((t) => t.ferramentas.length).join(" + ")} |`,
    ),
    "",
    ...detalhes,
  ].join("\n");
  mkdirSync(RODADAS, { recursive: true });
  const saida = path.join(RODADAS, `${rotulo}.md`);
  writeFileSync(saida, md);
  console.log(linhaMetricas(m).join("\n"));
  console.log(`Gravado ${path.relative(process.cwd(), saida)}`);
}

function comparar(a: string, b: string) {
  const ra = lerRodada(a);
  const rb = new Map(lerRodada(b).map((r) => [r.id, r]));
  const comuns = ra.filter((r) => rb.has(r.id));
  const ma = metricas(comuns);
  const mb = metricas(comuns.map((r) => rb.get(r.id)!));
  const la = linhaMetricas(ma);
  const lb = linhaMetricas(mb);
  console.log(`| Medida | ${a} | ${b} |\n| --- | --- | --- |`);
  la.forEach((l, i) => {
    const [, nome, va] = l.split("|").map((x) => x.trim());
    const vb = lb[i].split("|")[2].trim();
    console.log(`| ${nome} | ${va} | ${vb} |`);
  });
  console.log("\nMudanças de nota:");
  for (const r of comuns) {
    const na = r.juiz?.nota ?? "?";
    const nb = rb.get(r.id)!.juiz?.nota ?? "?";
    if (na !== nb)
      console.log(
        `  ${r.id}: ${na} → ${nb}  (${rb.get(r.id)!.juiz?.motivo ?? ""})`,
      );
  }
}

// --- principal ------------------------------------------------------------------

async function principal() {
  if (opc.comparar) {
    if (positionals.length !== 2) throw new Error("Uso: --comparar A B");
    comparar(positionals[0], positionals[1]);
    return;
  }
  if (opc.juizar) {
    const rs = lerRodada(opc.juizar);
    const filtro = opc.so?.split(",");
    await emParalelo(
      rs.filter((r) => !filtro || filtro.includes(r.id)),
      Number(opc.paralelo),
      async (r) => {
        r.juiz = await julgar(r);
        writeFileSync(
          path.join(BRUTOS, opc.juizar!, `${r.id}.json`),
          JSON.stringify(r, null, 1),
        );
        console.error(`${r.id}: ${r.juiz?.nota ?? "?"}`);
      },
    );
    resumir(opc.juizar);
    return;
  }

  const so = opc.so?.split(",");
  const categorias = opc.categoria?.split(",");
  const perguntas = lerPerguntas(ARQUIVO).filter(
    (p) =>
      (!so || so.includes(p.id)) &&
      // Pelas letras do id inteiras: "B" não traz as "BR".
      (!categorias || categorias.includes(p.id.replace(/\d+$/, ""))),
  );
  if (!perguntas.length) throw new Error("Nenhuma pergunta selecionada.");
  const rotulo =
    opc.rotulo ??
    `${opc.modelo}-${opc.motor}-${new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-")}`;
  const dir = path.join(BRUTOS, rotulo);
  mkdirSync(dir, { recursive: true });
  const motor = await criarMotor();
  console.error(
    `Rodada ${rotulo}: ${perguntas.length} perguntas, ${opc.modelo} pelo motor ${motor.nome}.`,
  );
  let feitas = 0;
  try {
    await emParalelo(perguntas, Number(opc.paralelo), async (p) => {
      // --retomar: a pergunta que já tem resposta e nota nesta rodada não é
      // refeita. Serve quando a rodada parou no meio (limite de uso, queda).
      const gravado = path.join(dir, `${p.id}.json`);
      if (opc.retomar && existsSync(gravado)) {
        const antes = JSON.parse(readFileSync(gravado, "utf8")) as Resultado;
        const completa =
          antes.turnos.length === p.perguntas.length &&
          antes.turnos.every((t) => !t.erro && t.resposta) &&
          (opc["sem-juiz"] || antes.juiz);
        if (completa) {
          feitas += 1;
          return;
        }
      }
      const r = await rodarPergunta(motor, p);
      // Sem resposta (erro do motor), não há o que julgar: não gasta o juiz.
      if (r.turnos.some((t) => t.erro)) {
        writeFileSync(gravado, JSON.stringify(r, null, 1));
        feitas += 1;
        console.error(`[${feitas}/${perguntas.length}] ${p.id} ERRO: ${r.turnos.find((t) => t.erro)?.erro?.slice(0, 80)}`);
        return;
      }
      if (!opc["sem-juiz"]) r.juiz = await julgar(r);
      writeFileSync(path.join(dir, `${p.id}.json`), JSON.stringify(r, null, 1));
      feitas += 1;
      console.error(
        `[${feitas}/${perguntas.length}] ${p.id} ${r.juiz?.nota ?? ""} ${r.turnos.map((t) => um(t.ms / 1000)).join("+")} s`,
      );
    });
  } finally {
    motor.encerrar();
    // No motor api as consultas rodam em processos filhos deste.
    encerrarFerramentas();
  }
  resumir(rotulo);
}

await principal();
if (motorDoJuiz === "api" && gastoDosJuizes() > 0)
  console.error(`Juiz pela API: US$ ${gastoDosJuizes().toFixed(2)}.`);
