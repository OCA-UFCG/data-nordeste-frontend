/**
 * Página de chat do assistente do Data Nordeste (npm run chat → http://localhost:3220).
 *
 * O navegador não fala com o modelo direto: este servidor recebe a pergunta,
 * passa para um motor e repassa a resposta enquanto ela é escrita. Dois
 * motores, com as mesmas ferramentas e o mesmo prompt:
 *   claude  o `claude` da linha de comando, na assinatura de quem roda
 *           (motor-claude.ts). É o padrão: serve para testar no computador.
 *   api     a API da Anthropic, com ANTHROPIC_API_KEY (motor-api.ts).
 *
 * Dois modos:
 *   local   (padrão) escuta só em 127.0.0.1, sem senha: o computador de quem roda.
 *   equipe  com DATANE_CHAT_SENHA: pede a senha compartilhada (equipe.ts), cada
 *           navegador vê só as próprias conversas, e valem os limites de
 *           perguntas e de gasto (limites.ts). É o modo do gamma, atrás do nginx.
 * Cada pergunta é gravada em conversas/<data>_<id>.jsonl (fora do git):
 * pergunta, resposta, cada ferramenta com entrada e saída, tempo, tokens,
 * custo e a avaliação 👍/👎 com comentário.
 *
 * Variáveis de ambiente:
 *   DATANE_CHAT_PORTA      porta (padrão 3220)
 *   DATANE_CHAT_HOST       endereço em que escuta (padrão 127.0.0.1; outro só com senha)
 *   DATANE_CHAT_SENHA      senha da equipe; sem ela, modo local
 *   DATANE_CHAT_MOTOR      claude | api (padrão claude)
 *   DATANE_CHAT_MODELOS    modelos oferecidos, o primeiro é o padrão (padrão haiku,sonnet)
 *   DATANE_CHAT_CONVERSAS  pasta das conversas (padrão conversas/)
 *   e os limites de limites.ts (DATANE_CHAT_PERGUNTAS_POR_DIA, _TETO_DIARIO_USD, _TETO_MENSAL_USD)
 */
import { randomUUID } from "node:crypto";
import { appendFileSync, existsSync, mkdirSync, readdirSync, readFileSync } from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { dadosDoMapa, GERADO_EM, TABELAO } from "../ferramentas/index.ts";
import { criarPortao, type Quem } from "./equipe.ts";
import { criarLimites } from "./limites.ts";
import { manterNoCache } from "./aquecer.ts";
import { criarMotorApi } from "./motor-api.ts";
import { criarDisponibilidade } from "./disponibilidade.ts";
import { criarMotorClaude } from "./motor-claude.ts";
import { SAIDA_MAX, Turno, type Evento, type FimDoTurno, type Motor } from "./turno.ts";

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const PACOTE = path.resolve(AQUI, "../..");
const PAGINA = path.join(AQUI, "pagina");
const CONVERSAS = path.resolve(process.env.DATANE_CHAT_CONVERSAS ?? path.join(PACOTE, "conversas"));
const MALHA = path.join(PACOTE, "dados/malha-municipios.json");
const PORTA = Number(process.env.DATANE_CHAT_PORTA ?? 3220);
const portao = criarPortao(process.env.DATANE_CHAT_SENHA);
// INTENTIONAL: sem senha, só este computador. Aberto na rede sem senha, qualquer
// um gastaria a cota (ou a chave da API) de quem roda.
const HOST = process.env.DATANE_CHAT_HOST ?? "127.0.0.1";
if (!portao && !["127.0.0.1", "localhost", "::1"].includes(HOST)) {
  console.error(`DATANE_CHAT_HOST="${HOST}" abre o chat na rede; esperado 127.0.0.1, ou defina DATANE_CHAT_SENHA.`);
  process.exit(1);
}
// Pergunta maior que isto não é pergunta sobre dados; também limita o gasto.
const PERGUNTA_MAX = 2_000;
// Conversa longa reenvia todo o histórico a cada pergunta: fica cara e lenta.
const TURNOS_MAX = 30;
const ORIGENS = new Set([`http://localhost:${PORTA}`, `http://127.0.0.1:${PORTA}`]);

mkdirSync(CONVERSAS, { recursive: true });
const limites = criarLimites(CONVERSAS);

const nomeDoMotor = process.env.DATANE_CHAT_MOTOR ?? "claude";
const disponibilidade = criarDisponibilidade();
const motor: Motor = nomeDoMotor === "api" ? criarMotorApi({ aoFalhar: disponibilidade.registrar }) : criarMotorClaude();
const MODELOS = (process.env.DATANE_CHAT_MODELOS ?? "haiku,sonnet")
  .split(",")
  .map((m) => m.trim())
  .filter((m) => motor.modelos[m]);
if (!MODELOS.length) {
  console.error(`DATANE_CHAT_MODELOS="${process.env.DATANE_CHAT_MODELOS}" não tem nenhum modelo conhecido; esperado haiku e/ou sonnet.`);
  process.exit(1);
}
// O motor "claude" já deixa aberto um processo do modelo padrão.
motor.aquecer?.(MODELOS[0]);

// ---------------------------------------------------------------------------
// Conversas (uma linha por evento; ver o README)

// pessoa: o id do navegador no modo equipe (equipe.ts); null no modo local.
type Conversa = { id: string; modelo: string; arquivo: string; pessoa: string | null; turno?: Turno; turnos: number };

// nome: o que a pessoa digitou na tela da senha (equipe.ts); não identifica, só registra.
type RegistroInicio = { tipo: "inicio"; id: string; modelo: string; pessoa?: string; nome?: string; em: string };
type RegistroTurno = {
  tipo: "turno";
  turno: number;
  session_id?: string;
  pergunta: string;
  resposta: string;
  ferramentas?: Array<Record<string, unknown> & { saida?: string }>;
  links?: Array<{ url: string; titulo: string }>;
  sugestoes?: string[];
  ms?: number;
  interrompida?: boolean;
  erro?: string | null;
  em: string;
};
type RegistroAvaliacao = { tipo: "avaliacao"; turno: number; nota: "bom" | "ruim" | null; comentario?: string };
type Registro = RegistroInicio | RegistroTurno | RegistroAvaliacao;

const conversas = new Map<string, Conversa>();
const inicioDe = (regs: Registro[]) => regs.find((r): r is RegistroInicio => r.tipo === "inicio");
const turnosDe = (regs: Registro[]) => regs.filter((r): r is RegistroTurno => r.tipo === "turno");

function gravar(c: Conversa, registro: Record<string, unknown>) {
  appendFileSync(c.arquivo, JSON.stringify({ ...registro, em: new Date().toISOString() }) + "\n");
}

function lerRegistros(arquivo: string): Registro[] {
  return readFileSync(arquivo, "utf8")
    .split("\n")
    .filter(Boolean)
    .flatMap((l) => {
      try {
        return [JSON.parse(l)];
      } catch {
        return [];
      }
    });
}

function arquivoDaConversa(id: string) {
  if (!/^[a-z0-9-]+$/.test(id)) return null;
  const nome = readdirSync(CONVERSAS).find((f) => f.endsWith(`_${id}.jsonl`));

  return nome ? path.join(CONVERSAS, nome) : null;
}

/** Conversa em memória, ou reaberta do arquivo. */
function obterConversa(id: string): Conversa | null {
  const viva = conversas.get(id);
  if (viva) return viva;
  const arquivo = arquivoDaConversa(id);
  if (!arquivo) return null;
  const regs = lerRegistros(arquivo);
  const inicio = inicioDe(regs);
  const c: Conversa = { id, modelo: inicio?.modelo ?? MODELOS[0], arquivo, pessoa: inicio?.pessoa ?? null, turnos: turnosDe(regs).length };
  conversas.set(id, c);

  return c;
}

/** A conversa, se ela é de quem pede (no modo local, todas são). */
function conversaDe(id: string, pessoa: string | null): Conversa | null {
  const c = obterConversa(id);

  return c && (!portao || c.pessoa === pessoa) ? c : null;
}

function novaConversa(modelo: string, quem: Quem | null): Conversa {
  const pessoa = quem?.id ?? null;
  const id = randomUUID().slice(0, 8);
  const carimbo = new Date().toLocaleString("sv-SE", { timeZone: "America/Fortaleza" }).replace(" ", "T").replaceAll(":", "-");
  const c: Conversa = { id, modelo, arquivo: path.join(CONVERSAS, `${carimbo}_${id}.jsonl`), pessoa, turnos: 0 };
  conversas.set(id, c);
  gravar(c, { tipo: "inicio", id, modelo, modelo_id: motor.modelos[modelo], motor: motor.nome, pessoa: pessoa ?? undefined, nome: quem?.nome ?? undefined });

  return c;
}

function registrarFim(c: Conversa, t: Turno, fim: FimDoTurno, enviar: (e: Evento) => void, fechar: () => void) {
  if (c.turno === t) c.turno = undefined;
  limites.contarGasto(fim.custo_usd);
  const ms = fim.ms ?? Date.now() - t.inicio;
  gravar(c, {
    tipo: "turno",
    turno: t.numero,
    modelo: c.modelo,
    session_id: fim.session_id,
    pergunta: t.pergunta,
    resposta: t.resposta,
    ferramentas: t.ferramentas.map((f) => ({ ...f, inicio: undefined })),
    links: t.links,
    sugestoes: t.sugestoes,
    corrigida: t.corrigida || undefined,
    revisada: t.revisada || undefined,
    reescrita_na_revisao: t.reescritaNaRevisao || undefined,
    revisao_sem_marca: t.revisaoSemMarca || undefined,
    numeros_sem_fonte: t.numerosSemFonte.length ? t.numerosSemFonte : undefined,
    ms,
    custo_usd: fim.custo_usd,
    uso: fim.uso,
    interrompida: fim.interrompida ?? false,
    erro: fim.erro ?? null,
  });
  enviar({ tipo: "fim", turno: t.numero, ms, interrompida: fim.interrompida ?? false, erro: fim.erro ?? null });
  fechar();
}

// ---------------------------------------------------------------------------
// Mapa: a página pede os valores de todos os municípios de um mapa. O servidor
// só refaz uma consulta que o modelo já fez naquela conversa: quem pede passa
// a conversa, o turno e o passo, nunca o SQL.

type Anel = Array<[number, number]>;
let malha: Map<string, Anel[]> | undefined;

function malhaDosMunicipios() {
  if (malha || !existsSync(MALHA)) return malha;
  const geo = JSON.parse(readFileSync(MALHA, "utf8")) as Record<string, Anel[]>;
  malha = new Map(Object.entries(geo));

  return malha;
}

type Passo = { nome?: string; entrada?: unknown; erro?: boolean; turno: number; id: string };

function passosDaConversa(c: Conversa): Passo[] {
  const gravados = existsSync(c.arquivo)
    ? turnosDe(lerRegistros(c.arquivo)).flatMap((r) => (r.ferramentas ?? []).map((f) => ({ ...(f as Omit<Passo, "turno" | "id">), turno: r.turno, id: String(f.id) })))
    : [];
  const vivos = (c.turno?.ferramentas ?? []).map((f) => ({ ...f, turno: c.turno!.numero }));

  return [...gravados, ...vivos];
}

async function mapaDoPasso(c: Conversa, turno: number, id: string) {
  const passo = passosDaConversa(c).find((x) => x.turno === turno && x.id === id);
  if (!passo || passo.erro || passo.nome !== "consultar_sql") return { erro: "mapa não encontrado" };
  const formas = malhaDosMunicipios();
  if (!formas) return { erro: "falta a malha dos municípios (npm run malha)" };
  const itens = await dadosDoMapa(String((passo.entrada as { sql?: string } | null)?.sql ?? ""));
  if (typeof itens === "string") return { erro: itens };

  return { itens: itens.flatMap((i) => (formas.get(i.codigo) ? [{ ...i, aneis: formas.get(i.codigo) }] : [])) };
}

// ---------------------------------------------------------------------------
// HTTP

const TIPOS: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
};

// Os endereços são relativos na página, para ela poder morar num subcaminho depois.
const ESTATICOS: Record<string, string> = {
  "/": path.join(PAGINA, "index.html"),
  "/estilo.css": path.join(PAGINA, "estilo.css"),
  "/app.js": path.join(PAGINA, "app.js"),
  "/grafico.js": path.join(PAGINA, "grafico.js"),
  "/mapa.js": path.join(PAGINA, "mapa.js"),
  "/markdown.js": path.join(PAGINA, "markdown.js"),
  "/marked.js": path.join(PACOTE, "node_modules/marked/lib/marked.esm.js"),
  "/logo.png": path.join(PAGINA, "logo.png"),
  "/logo-dne.svg": path.join(PAGINA, "logo-dne.svg"),
  "/marca-dne.svg": path.join(PAGINA, "marca-dne.svg"),
  "/icones.svg": path.join(PAGINA, "icones.svg"),
  "/favicon.png": path.join(PAGINA, "logo.png"),
};

function json(res: http.ServerResponse, status: number, corpo: unknown) {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(corpo));
}

async function lerCorpo(req: http.IncomingMessage): Promise<Record<string, unknown>> {
  let s = "";
  for await (const pedaco of req) {
    s += pedaco;
    if (s.length > 100_000) throw new Error("corpo do pedido passou de 100 mil caracteres; esperado um JSON pequeno");
  }

  return s ? JSON.parse(s) : {};
}

function notasPorTurno(regs: Registro[]) {
  const notas = new Map<number, { nota: string | null; comentario: string }>();
  for (const r of regs) if (r.tipo === "avaliacao") notas.set(r.turno, { nota: r.nota, comentario: r.comentario ?? "" });

  return notas;
}

function listarConversas(pessoa: string | null) {
  return readdirSync(CONVERSAS)
    .filter((f) => f.endsWith(".jsonl"))
    .sort()
    .reverse()
    .flatMap((f) => {
      const regs = lerRegistros(path.join(CONVERSAS, f));
      const inicio = inicioDe(regs);
      const turnos = turnosDe(regs);
      if (!turnos.length || (portao && inicio?.pessoa !== pessoa)) return [];
      const notas = [...notasPorTurno(regs).values()];

      return [
        {
          id: inicio?.id ?? f.replace(/^.*_|\.jsonl$/g, ""),
          modelo: inicio?.modelo,
          em: inicio?.em,
          titulo: turnos[0]?.pergunta?.slice(0, 120) ?? "",
          turnos: turnos.length,
          bons: notas.filter((n) => n.nota === "bom").length,
          ruins: notas.filter((n) => n.nota === "ruim").length,
        },
      ];
    });
}

function conversaParaAPagina(id: string, pessoa: string | null) {
  const arquivo = conversaDe(id, pessoa)?.arquivo;
  if (!arquivo) return null;
  const regs = lerRegistros(arquivo);
  const notas = notasPorTurno(regs);

  return {
    id,
    modelo: inicioDe(regs)?.modelo,
    turnos: turnosDe(regs).map((r) => ({
      turno: r.turno,
      pergunta: r.pergunta,
      resposta: r.resposta,
      ferramentas: (r.ferramentas ?? []).map((f) => ({ ...f, saida: f.saida?.slice(0, SAIDA_MAX) })),
      links: r.links ?? [],
      sugestoes: r.sugestoes ?? [],
      ms: r.ms,
      interrompida: r.interrompida,
      erro: r.erro,
      avaliacao: notas.get(r.turno) ?? null,
    })),
  };
}

function responderMensagem(res: http.ServerResponse, corpo: Record<string, unknown>, quem: Quem | null) {
  const pessoa = quem?.id ?? null;
  const texto = String(corpo.texto ?? "").trim();
  if (!texto) return json(res, 400, { erro: "pergunta vazia" });
  if (texto.length > PERGUNTA_MAX) return json(res, 400, { erro: `a pergunta passou de ${PERGUNTA_MAX} caracteres; resuma e tente de novo` });
  // Fora do ar (chave recusada, crédito acabou): recusa sem chamar a API.
  const fora = disponibilidade.recusa();
  if (fora) return json(res, 503, { erro: fora, indisponivel: true });
  const recusa = limites.recusa(pessoa);
  if (recusa) return json(res, 429, { erro: recusa });
  const modelo = MODELOS.includes(String(corpo.modelo)) ? String(corpo.modelo) : MODELOS[0];
  const c = corpo.conversa ? conversaDe(String(corpo.conversa), pessoa) : novaConversa(modelo, quem);
  if (!c) return json(res, 404, { erro: "conversa não encontrada" });
  if (c.turno) return json(res, 409, { erro: "a conversa ainda está respondendo" });
  if (c.turnos >= TURNOS_MAX) return json(res, 400, { erro: `esta conversa chegou a ${TURNOS_MAX} perguntas; comece uma nova` });
  limites.contarPergunta(pessoa);

  res.writeHead(200, { "content-type": "application/x-ndjson; charset=utf-8", "cache-control": "no-cache", "x-accel-buffering": "no" });
  const enviar = (e: Evento) => {
    if (!res.writableEnded) res.write(JSON.stringify(e) + "\n");
  };
  c.turnos += 1;
  const turno = new Turno(c.turnos, texto, enviar, (t, fim) => registrarFim(c, t, fim, enviar, () => res.end()));
  c.turno = turno;
  enviar({ tipo: "conversa", id: c.id, modelo: c.modelo, turno: c.turnos });
  motor.responder({
    conversa: c.id,
    modelo: c.modelo,
    turno,
    contexto: {},
    anteriores: () => turnosDe(existsSync(c.arquivo) ? lerRegistros(c.arquivo) : []).filter((r) => r.turno < turno.numero),
  });
}

/** O pedido veio da própria página? (no gamma, o endereço é o que o nginx repassa) */
function origemPermitida(req: http.IncomingMessage): boolean {
  const origem = req.headers.origin;
  if (!origem || ORIGENS.has(origem)) return true;
  const host = String(req.headers["x-forwarded-host"] ?? req.headers.host ?? "");

  return Boolean(portao) && URL.canParse(origem) && new URL(origem).host === host;
}

// Sem a senha, só a tela de entrada e o que ela usa.
const PUBLICOS = new Set(["/estilo.css", "/logo.png", "/logo-dne.svg", "/favicon.png", "/api/saude", "/api/entrar"]);

function servirEstatico(res: http.ServerResponse, arquivo: string) {
  res.writeHead(200, { "content-type": TIPOS[path.extname(arquivo)] ?? TIPOS[".html"], "cache-control": "no-cache" });
  res.end(readFileSync(arquivo));
}

async function atender(req: http.IncomingMessage, res: http.ServerResponse) {
  const url = new URL(req.url ?? "/", "http://chat");
  // Só a própria página pode mandar perguntas: outro site aberto no navegador não gasta a cota.
  if (req.method === "POST" && !origemPermitida(req)) return json(res, 403, { erro: "origem não permitida" });
  const quem = portao?.quem(req.headers.cookie) ?? null;
  const pessoa = quem?.id ?? null;
  if (portao && req.method === "POST" && url.pathname === "/api/entrar") {
    const corpo = await lerCorpo(req);
    const r = portao.entrar(String(corpo.senha ?? ""), req.headers["x-forwarded-proto"] === "https", corpo.nome);
    if (!r.ok) return json(res, 401, { erro: r.erro });
    res.writeHead(200, { "content-type": "application/json; charset=utf-8", "set-cookie": r.cookie });

    return res.end(JSON.stringify({ ok: true }));
  }
  if (portao && !pessoa && !PUBLICOS.has(url.pathname)) {
    if (req.method === "GET" && url.pathname === "/") return servirEstatico(res, path.join(PAGINA, "entrar.html"));

    return json(res, 401, { erro: "Entre com a senha da equipe: recarregue a página." });
  }

  if (req.method === "GET" && ESTATICOS[url.pathname]) {
    return servirEstatico(res, ESTATICOS[url.pathname]);
  }
  if (req.method === "GET" && url.pathname === "/api/saude") return json(res, 200, { ok: true, motor: motor.nome, tabelao: GERADO_EM, ...disponibilidade.estado() });
  if (req.method === "GET" && url.pathname === "/api/info")
    return json(res, 200, { tabelaoGeradoEm: GERADO_EM, motor: motor.nome, modelos: MODELOS, usuario: null, temMapa: existsSync(MALHA), disponivel: disponibilidade.estado().disponivel });
  if (req.method === "GET" && url.pathname === "/api/conversas") return json(res, 200, listarConversas(pessoa));
  const m = url.pathname.match(/^\/api\/conversas\/([a-z0-9-]+)$/);
  if (req.method === "GET" && m) {
    const conversa = conversaParaAPagina(m[1], pessoa);

    return conversa ? json(res, 200, conversa) : json(res, 404, { erro: "conversa não encontrada" });
  }
  if (req.method === "GET" && url.pathname === "/api/mapa") {
    const c = conversaDe(String(url.searchParams.get("conversa")), pessoa);
    if (!c) return json(res, 404, { erro: "conversa não encontrada" });
    const mapa = await mapaDoPasso(c, Number(url.searchParams.get("turno")), String(url.searchParams.get("passo")));

    return json(res, "erro" in mapa ? 404 : 200, mapa);
  }
  if (req.method === "POST" && url.pathname === "/api/mensagem") return responderMensagem(res, await lerCorpo(req), quem);
  if (req.method === "POST" && url.pathname === "/api/parar") {
    const c = conversaDe(String((await lerCorpo(req)).conversa), pessoa);
    if (c?.turno) motor.parar(c.id);

    return json(res, 200, { ok: true });
  }
  if (req.method === "POST" && url.pathname === "/api/avaliacao") {
    const corpo = await lerCorpo(req);
    const c = conversaDe(String(corpo.conversa), pessoa);
    if (!c) return json(res, 404, { erro: "conversa não encontrada" });
    const nota = corpo.nota === "bom" || corpo.nota === "ruim" ? corpo.nota : null;
    gravar(c, { tipo: "avaliacao", turno: Number(corpo.turno), nota, comentario: String(corpo.comentario ?? "").slice(0, 4000) });

    return json(res, 200, { ok: true });
  }
  json(res, 404, { erro: "não encontrado" });
}

const servidor = http.createServer((req, res) => {
  atender(req, res).catch((e) => {
    console.error(JSON.stringify({ event: "erro_no_servidor_do_chat", url: req.url, mensagem: (e as Error).message }));
    if (!res.headersSent) json(res, 500, { erro: "erro no servidor do chat" });
    else res.end();
  });
});

for (const sinal of ["SIGINT", "SIGTERM"] as const)
  process.on(sinal, () => {
    motor.encerrar();
    process.exit(0);
  });

servidor.listen(PORTA, HOST, () => {
  console.log(`Assistente do Data Nordeste em http://${HOST}:${PORTA} (motor ${motor.nome}, modelos ${MODELOS.join(", ")}, ${portao ? "modo equipe, com senha" : "modo local"})`);
  const l = limites.situacao();
  if (portao) console.log(`Limites: ${l.porPessoa} perguntas por pessoa por dia; US$ ${l.tetoDia} por dia; US$ ${l.tetoMes} por mês (gasto no mês até agora: US$ ${l.gastoMes.toFixed(2)}).`);
  console.log(`Tabelão: ${TABELAO} (gerado em ${GERADO_EM.slice(0, 10)})`);
  console.log(`Conversas gravadas em ${CONVERSAS}`);
  manterNoCache(TABELAO, Number(process.env.DATANE_AQUECER_MIN ?? 30));
  if (!existsSync(MALHA)) console.log("Sem dados/malha-municipios.json: os mapas não aparecem (npm run malha).");
});
