import { marked } from "./marked.js";
import { desenharGrafico } from "./grafico.js";
import { desenharMapa } from "./mapa.js";
import { configurarMarkdown, escaparHtml } from "./markdown.js";

// O texto vem do modelo: ver markdown.js (HTML, links e imagens).
configurarMarkdown(marked);

const $ = (id) => document.getElementById(id);
const el = {
  rolagem: $("rolagem"),
  boasVindas: $("boas-vindas"),
  mensagens: $("mensagens"),
  compositor: $("compositor"),
  entrada: $("entrada"),
  enviar: $("enviar"),
  modelo: $("modelo"),
  nova: $("nova"),
  lista: $("lista-conversas"),
  historico: $("historico"),
  historicoVazio: $("historico-vazio"),
  abrirHistorico: $("abrir-historico"),
  veu: $("veu"),
  nota: $("nota"),
  avisoFora: $("aviso-fora"),
};

// O mesmo texto de disponibilidade.ts (INDISPONIVEL), para quando o servidor
// nem responde.
const INDISPONIVEL =
  "O assistente está indisponível no momento. Tente de novo mais tarde.";

const estado = { conversa: null, modelo: "haiku", ocupado: false };
const NOMES_MODELO = { sonnet: "Sonnet 5.5", haiku: "Haiku 5.5" };

const PASSOS = {
  detalhar_indicador: {
    fazendo: "Lendo a descrição do indicador…",
    feito: (e) => `Leu a descrição de ${e.id ?? "um indicador"}`,
  },
  buscar_territorio: {
    fazendo: "Procurando o território…",
    feito: (e) =>
      `Procurou “${e.nome ?? ""}”${e.uf ? ` (${String(e.uf).toUpperCase()})` : ""}`,
  },
  consultar_sql: {
    fazendo: "Consultando os dados…",
    feito: (e) =>
      e.grafico?.tipo === "mapa"
        ? "Consultou os dados e montou o mapa"
        : e.grafico
          ? "Consultou os dados e montou o gráfico"
          : "Consultou os dados",
  },
  conteudo_do_portal: {
    fazendo: "Procurando no portal…",
    feito: (e) => `Procurou “${e.busca ?? ""}” no conteúdo do portal`,
  },
};

const ICONES = {
  seta: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M8 5l5 5-5 5"/></svg>',
  bom: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M6 9v8H3V9h3zm0 0l3.5-6c1.2 0 2 1 1.7 2.2L10.6 8H15a2 2 0 0 1 2 2.3l-.9 5A2 2 0 0 1 14.1 17H6"/></svg>',
  ruim: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M14 11V3h3v8h-3zm0 0l-3.5 6c-1.2 0-2-1-1.7-2.2L9.4 12H5a2 2 0 0 1-2-2.3l.9-5A2 2 0 0 1 5.9 3H14"/></svg>',
  externo:
    '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M11 4h5v5M16 4l-7 7M14 12v3a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h3"/></svg>',
  copiar:
    '<svg viewBox="0 0 20 20" aria-hidden="true"><rect x="7" y="7" width="10" height="10" rx="2"/><path d="M13 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/></svg>',
};

const esc = escaparHtml;

function segundos(ms) {
  return `${(ms / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} s`;
}

function criar(tag, classe, html) {
  const n = document.createElement(tag);
  if (classe) n.className = classe;
  if (html !== undefined) n.innerHTML = html;
  return n;
}

// ---------------------------------------------------------------------------
// rolagem: acompanha a resposta só se a pessoa já estava no fim

let colado = true;
el.rolagem.addEventListener("scroll", () => {
  const r = el.rolagem;
  colado = r.scrollHeight - r.scrollTop - r.clientHeight < 80;
});
function descer(forcar = false) {
  if (forcar || colado) el.rolagem.scrollTop = el.rolagem.scrollHeight;
}

// ---------------------------------------------------------------------------
// mensagens

function adicionarPergunta(texto) {
  const li = criar("li", "msg-usuario");
  li.textContent = texto;
  el.mensagens.append(li);
}

function renderizarMarkdown(destino, texto) {
  destino.innerHTML = marked.parse(texto);
  for (const t of destino.querySelectorAll("table")) {
    const caixa = criar("div", "tabela");
    t.replaceWith(caixa);
    caixa.append(t);
  }
  for (const a of destino.querySelectorAll("a")) {
    a.target = "_blank";
    a.rel = "noopener";
  }
}

/** Cria a mensagem do bot e devolve funções para ir preenchendo. */
function criarResposta() {
  const li = criar("li", "msg-bot");
  const avatar = criar("div", "avatar", '<img src="marca-dne.svg" alt="" />');
  const coluna = criar("div", "coluna");
  const passos = criar("details", "passos");
  passos.hidden = true;
  const resumo = criar("summary", "", `${ICONES.seta}<span></span>`);
  const listaPassos = criar("ol");
  passos.append(resumo, listaPassos);
  const aguardando = criar(
    "div",
    "aguardando",
    '<span class="pontos" aria-hidden="true"><i></i><i></i><i></i></span><span>Pensando…</span>',
  );
  const areaGrafico = criar("div", "graficos");
  const texto = criar("div", "resposta");
  const links = criar("div", "links-portal");
  const proximas = criar("div", "proximas");
  coluna.append(passos, areaGrafico, aguardando, texto, links, proximas);
  li.append(avatar, coluna);
  el.mensagens.append(li);

  const r = {
    li,
    turno: null,
    markdown: "",
    passos: new Map(),
    setStatus(s) {
      aguardando.lastElementChild.textContent = s;
    },
    atualizarResumo(fazendo) {
      const n = r.passos.size;
      resumo.lastElementChild.textContent =
        fazendo ?? `${n} ${n === 1 ? "passo" : "passos"} até a resposta`;
    },
    adicionarPasso({ id, nome, entrada }, concluido) {
      const def = PASSOS[nome];
      const item = criar("li", `passo${concluido ? "" : " rodando"}`);
      const cabeca = criar(
        "div",
        "passo-cabeca",
        `<span class="estado"></span><strong></strong><span class="tempo"></span>`,
      );
      cabeca.querySelector("strong").textContent = def
        ? def.feito(entrada ?? {})
        : nome;
      item.append(cabeca);
      if (nome === "consultar_sql" && entrada?.sql) {
        const pre = criar("pre", "sql");
        pre.textContent = entrada.sql.trim();
        item.append(pre);
      }
      listaPassos.append(item);
      passos.hidden = false;
      r.passos.set(id, { item, nome, entrada });
      if (!concluido) {
        r.atualizarResumo(def?.fazendo ?? "Consultando…");
        r.setStatus(def?.fazendo ?? "Consultando…");
      } else r.atualizarResumo();
    },
    concluirPasso({ id, texto: saida, cortada, erro, ms }) {
      const passo = r.passos.get(id);
      if (!passo) return;
      const { item, nome, entrada } = passo;
      const comErro = erro || /^Erro:/.test(saida ?? "");
      const ref = { conversa: estado.conversa, turno: r.turno, passo: id };
      if (!comErro && nome === "consultar_sql" && entrada?.grafico) {
        if (entrada.grafico.tipo === "mapa")
          desenharMapa(areaGrafico, entrada.grafico, ref).then(
            (ok) => ok && descer(),
          );
        else if (desenharGrafico(areaGrafico, entrada.grafico, saida)) descer();
      }
      item.classList.remove("rodando");
      if (erro) item.classList.add("erro");
      if (ms != null) item.querySelector(".tempo").textContent = segundos(ms);
      if (saida) {
        const det = criar("details");
        det.append(
          criar("summary", "", erro ? "Ver o erro" : "Ver o resultado"),
        );
        const pre = criar("pre");
        pre.textContent = saida + (cortada ? "\n…" : "");
        det.append(pre);
        item.append(det);
      }
      r.atualizarResumo();
      r.setStatus("Escrevendo…");
    },
    /** Botão para o painel do portal (o servidor monta pelas consultas). */
    adicionarLink(url, titulo) {
      if (!/^https?:\/\//.test(String(url ?? ""))) return;
      if ([...links.querySelectorAll("a")].some((a) => a.href === url)) return;
      const a = criar("a", "ver-no-portal", `<span></span>${ICONES.externo}`);
      a.querySelector("span").textContent = titulo || "Ver no Data Nordeste";
      a.href = url;
      a.target = "_blank";
      a.rel = "noopener";
      a.title = url.includes("datanordeste.sudene.gov.br") ? "Abre o painel no portal Data Nordeste" : "Abre a fonte original do dado (o portal não tem painel dele)";
      links.append(a);
    },
    /** Joga fora o texto mostrado (era rascunho) e volta a esperar. */
    descartar() {
      r.markdown = "";
      texto.replaceChildren();
      texto.classList.remove("cursor");
      if (!aguardando.isConnected) texto.before(aguardando);
    },
    sugerir(perguntas) {
      proximas.replaceChildren();
      for (const p of perguntas ?? []) {
        const b = criar("button", "proxima");
        b.type = "button";
        b.textContent = p;
        b.onclick = () => perguntar(p);
        proximas.append(b);
      }
    },
    escrever(pedaco) {
      aguardando.remove();
      r.markdown += pedaco;
      texto.classList.add("cursor");
      if (!r.agendado) {
        r.agendado = true;
        requestAnimationFrame(() => {
          r.agendado = false;
          renderizarMarkdown(texto, r.markdown);
          descer();
        });
      }
    },
    terminar({ ms, interrompida, erro, avaliacao }) {
      aguardando.remove();
      li.classList.remove("respondendo");
      texto.classList.remove("cursor");
      renderizarMarkdown(texto, r.markdown);
      if (!r.markdown && !erro && !interrompida)
        texto.textContent = "(sem resposta)";
      if (interrompida && !erro)
        coluna.append(
          criar("div", "comentario-salvo", "Resposta interrompida."),
        );
      if (erro) {
        const aviso = criar("div", "aviso-erro");
        aviso.textContent = erro;
        coluna.append(aviso);
      }
      coluna.append(rodape(r, ms, avaliacao));
      descer();
    },
  };
  li.classList.add("respondendo");
  return r;
}

function rodape(r, ms, avaliacao) {
  const pe = criar("div", "rodape-msg");
  const info = criar("span", "info");
  const n = r.passos.size;
  info.textContent = [
    NOMES_MODELO[estado.modelo] ?? estado.modelo,
    ms != null ? segundos(ms) : null,
    n ? `${n} ${n === 1 ? "consulta" : "consultas"}` : null,
  ]
    .filter(Boolean)
    .join(" · ");
  const bom = criar("button", "bom", ICONES.bom);
  bom.type = "button";
  bom.setAttribute("aria-label", "Resposta boa");
  bom.title = "Resposta boa";
  const ruim = criar("button", "ruim", ICONES.ruim);
  ruim.type = "button";
  ruim.setAttribute("aria-label", "Resposta ruim");
  ruim.title = "Resposta ruim";
  const copiar = criar("button", "", ICONES.copiar);
  copiar.type = "button";
  copiar.setAttribute("aria-label", "Copiar a resposta");
  copiar.title = "Copiar a resposta";
  pe.append(info, bom, ruim, copiar);

  let nota = avaliacao?.nota ?? null;
  let comentario = avaliacao?.comentario ?? "";
  const conversa = estado.conversa;
  const salvo = criar("div", "comentario-salvo");
  const marcar = () => {
    bom.setAttribute("aria-pressed", String(nota === "bom"));
    ruim.setAttribute("aria-pressed", String(nota === "ruim"));
    salvo.textContent = comentario ? `Seu comentário: “${comentario}”` : "";
  };
  marcar();

  const salvar = () =>
    fetch("api/avaliacao", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ conversa, turno: r.turno, nota, comentario }),
    }).then(() => carregarHistorico());

  let caixa = null;
  const abrirComentario = () => {
    caixa?.remove();
    caixa = criar("div", "comentario");
    const id = `comentario-${conversa}-${r.turno}`;
    caixa.innerHTML = `<label for="${id}"></label><textarea id="${id}"></textarea>
      <div class="linha"><button type="button" class="botao botao-secundario">Agora não</button>
      <button type="button" class="botao botao-primario">Enviar</button></div>`;
    caixa.querySelector("label").textContent =
      nota === "ruim"
        ? "O que ficou errado ou faltou?"
        : "Quer deixar um comentário? (opcional)";
    const area = caixa.querySelector("textarea");
    area.value = comentario;
    const [fechar, enviar] = caixa.querySelectorAll(".linha button");
    fechar.onclick = () => caixa.remove();
    enviar.onclick = () => {
      comentario = area.value.trim();
      salvar();
      marcar();
      caixa.remove();
    };
    area.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) enviar.click();
    });
    pe.after(caixa);
    area.focus();
    descer();
  };

  const votar = (valor) => {
    nota = nota === valor ? null : valor;
    if (!nota) comentario = "";
    marcar();
    salvar();
    if (nota) abrirComentario();
    else caixa?.remove();
  };
  bom.onclick = () => votar("bom");
  ruim.onclick = () => votar("ruim");
  copiar.onclick = async () => {
    await navigator.clipboard.writeText(r.markdown);
    info.textContent = "Copiado";
    info.classList.add("copiado");
    setTimeout(() => {
      info.classList.remove("copiado");
      info.textContent = info.dataset.texto;
    }, 1500);
  };
  info.dataset.texto = info.textContent;

  const caixaPe = document.createDocumentFragment();
  caixaPe.append(pe, salvo);
  const embrulho = criar("div");
  embrulho.append(caixaPe);
  return embrulho;
}

// ---------------------------------------------------------------------------
// enviar e receber

function setOcupado(sim) {
  estado.ocupado = sim;
  el.compositor.classList.toggle("ocupado", sim);
  // A resposta chega aos pedaços; com aria-busy o leitor de tela espera o fim
  // em vez de ler cada pedaço que aparece.
  el.mensagens.setAttribute("aria-busy", String(sim));
  el.enviar.setAttribute("aria-label", sim ? "Parar a resposta" : "Enviar");
  atualizarBotaoEnviar();
}

function atualizarBotaoEnviar() {
  el.enviar.disabled = !estado.ocupado && !el.entrada.value.trim();
}

function travarModelo() {
  for (const b of el.modelo.querySelectorAll("button")) {
    b.setAttribute("aria-checked", String(b.dataset.modelo === estado.modelo));
    b.disabled = Boolean(estado.conversa);
  }
  el.modelo.title = estado.conversa
    ? "O modelo fica fixo durante a conversa. Comece uma nova para trocar."
    : "";
}

async function perguntar(texto) {
  if (estado.ocupado || !texto.trim()) return;
  el.boasVindas.hidden = true;
  // As perguntas sugeridas valem para a última resposta só.
  for (const n of el.mensagens.querySelectorAll(".proximas"))
    n.replaceChildren();
  adicionarPergunta(texto);
  const r = criarResposta();
  descer(true);
  setOcupado(true);
  let terminou = false;
  try {
    const resp = await fetch("api/mensagem", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        conversa: estado.conversa,
        modelo: estado.modelo,
        texto,
      }),
    });
    // 401: a senha da equipe venceu ou foi trocada; recarregar mostra a tela de senha.
    if (resp.status === 401) return location.reload();
    if (!resp.ok) {
      // Sem JSON (502/504 do nginx com o chat parado): o chat está fora do ar.
      const corpo = await resp.json().catch(() => ({}));
      throw new Error(corpo.erro ?? INDISPONIVEL);
    }
    const leitor = resp.body.pipeThrough(new TextDecoderStream()).getReader();
    let resto = "";
    for (;;) {
      const { value, done } = await leitor.read();
      if (done) break;
      resto += value;
      const linhas = resto.split("\n");
      resto = linhas.pop();
      for (const linha of linhas) {
        if (!linha) continue;
        const ev = JSON.parse(linha);
        if (ev.tipo === "conversa") {
          const nova = estado.conversa !== ev.id;
          estado.conversa = ev.id;
          estado.modelo = ev.modelo;
          r.turno = ev.turno;
          travarModelo();
          if (nova) {
            history.replaceState(null, "", `#c=${ev.id}`);
            carregarHistorico();
          }
        } else if (ev.tipo === "pensando") r.setStatus("Pensando…");
        else if (ev.tipo === "preparando")
          r.setStatus(
            PASSOS[ev.nome.replace(/^mcp__datane__/, "")]?.fazendo ??
              "Consultando…",
          );
        else if (ev.tipo === "ferramenta") r.adicionarPasso(ev, false);
        else if (ev.tipo === "saida") r.concluirPasso(ev);
        else if (ev.tipo === "texto") r.escrever(ev.t);
        else if (ev.tipo === "descartar") r.descartar();
        else if (ev.tipo === "status") r.setStatus(ev.texto);
        else if (ev.tipo === "link") r.adicionarLink(ev.url, ev.titulo);
        else if (ev.tipo === "sugestoes") r.sugerir(ev.perguntas);
        else if (ev.tipo === "fim") {
          terminou = true;
          r.terminar(ev);
        }
      }
    }
    if (!terminou)
      r.terminar({
        erro: "A conexão caiu antes do fim da resposta. Tente de novo.",
      });
  } catch (e) {
    // TypeError: o fetch nem chegou ao servidor (sem internet, VPN caída).
    const erro =
      e instanceof TypeError
        ? "Não consegui falar com o assistente. Confira a sua internet e tente de novo."
        : e.message;
    if (!terminou) r.terminar({ erro });
  } finally {
    setOcupado(false);
    carregarHistorico();
    el.entrada.focus();
  }
}

async function parar() {
  if (!estado.conversa) return;
  await fetch("api/parar", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ conversa: estado.conversa }),
  });
}

// ---------------------------------------------------------------------------
// histórico

function novaConversa() {
  if (estado.ocupado) return;
  estado.conversa = null;
  el.mensagens.replaceChildren();
  el.boasVindas.hidden = false;
  history.replaceState(null, "", location.pathname);
  travarModelo();
  marcarAtual();
  fecharHistorico();
  el.entrada.focus();
}

async function abrirConversa(id) {
  if (estado.ocupado) return;
  const resp = await fetch(`api/conversas/${id}`);
  if (!resp.ok) return novaConversa();
  const c = await resp.json();
  estado.conversa = c.id;
  estado.modelo = c.modelo ?? "haiku";
  travarModelo();
  el.boasVindas.hidden = true;
  el.mensagens.replaceChildren();
  for (const t of c.turnos) {
    adicionarPergunta(t.pergunta);
    const r = criarResposta();
    r.turno = t.turno;
    for (const f of t.ferramentas) {
      r.adicionarPasso(f, true);
      r.concluirPasso({ id: f.id, texto: f.saida, erro: f.erro, ms: f.ms });
    }
    for (const l of t.links ?? [])
      typeof l === "string" ? r.adicionarLink(l) : r.adicionarLink(l.url, l.titulo);
    if (t === c.turnos.at(-1)) r.sugerir(t.sugestoes);
    r.markdown = t.resposta ?? "";
    r.terminar({
      ms: t.ms,
      interrompida: t.interrompida,
      erro: t.erro,
      avaliacao: t.avaliacao,
    });
  }
  history.replaceState(null, "", `#c=${c.id}`);
  marcarAtual();
  fecharHistorico();
  descer(true);
}

function marcarAtual() {
  for (const a of el.lista.querySelectorAll("a"))
    a.setAttribute("aria-current", String(a.dataset.id === estado.conversa));
}

async function carregarHistorico() {
  const lista = await fetch("api/conversas")
    .then((r) => (r.ok ? r.json() : []))
    .catch(() => []);
  el.historicoVazio.hidden = lista.length > 0;
  el.lista.replaceChildren();
  let diaAnterior = "";
  const hoje = new Date().toDateString();
  for (const c of lista) {
    const data = new Date(c.em);
    const dia =
      data.toDateString() === hoje
        ? "Hoje"
        : data.toLocaleDateString("pt-BR", { day: "numeric", month: "long" });
    if (dia !== diaAnterior) {
      el.lista.append(criar("li", "dia", esc(dia)));
      diaAnterior = dia;
    }
    const li = criar("li");
    const a = criar("a");
    a.href = `#c=${c.id}`;
    a.dataset.id = c.id;
    const titulo = criar("span", "titulo-conversa");
    titulo.textContent = c.titulo;
    const meta = criar("span", "meta-conversa");
    meta.textContent = [
      data.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      NOMES_MODELO[c.modelo]?.split(" ")[0],
      `${c.turnos} ${c.turnos === 1 ? "pergunta" : "perguntas"}`,
      c.bons ? `👍 ${c.bons}` : null,
      c.ruins ? `👎 ${c.ruins}` : null,
    ]
      .filter(Boolean)
      .join(" · ");
    a.append(titulo, meta);
    a.onclick = (e) => {
      e.preventDefault();
      abrirConversa(c.id);
    };
    li.append(a);
    el.lista.append(li);
  }
  marcarAtual();
}

function abrirHistorico() {
  el.historico.classList.add("aberto");
  el.veu.hidden = false;
  el.abrirHistorico.setAttribute("aria-expanded", "true");
}

function fecharHistorico() {
  el.historico.classList.remove("aberto");
  el.veu.hidden = true;
  el.abrirHistorico.setAttribute("aria-expanded", "false");
}

// ---------------------------------------------------------------------------
// eventos

el.compositor.addEventListener("submit", (e) => {
  e.preventDefault();
  if (estado.ocupado) return parar();
  const texto = el.entrada.value;
  el.entrada.value = "";
  ajustarAltura();
  perguntar(texto);
});

el.entrada.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey && !e.isComposing) {
    e.preventDefault();
    if (!estado.ocupado) el.compositor.requestSubmit();
  }
});

function ajustarAltura() {
  el.entrada.style.height = "auto";
  el.entrada.style.height = `${el.entrada.scrollHeight}px`;
  atualizarBotaoEnviar();
}
el.entrada.addEventListener("input", ajustarAltura);

for (const b of el.modelo.querySelectorAll("button"))
  b.addEventListener("click", () => {
    if (estado.conversa) return;
    estado.modelo = b.dataset.modelo;
    travarModelo();
  });

for (const b of $("sugestoes").querySelectorAll("button"))
  b.addEventListener("click", () =>
    perguntar(b.querySelector("p").textContent.replace(/\s+/g, " ").trim()),
  );

el.nova.addEventListener("click", novaConversa);
el.abrirHistorico.addEventListener("click", abrirHistorico);
el.veu.addEventListener("click", fecharHistorico);
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") fecharHistorico();
});

// ---------------------------------------------------------------------------
// início

fetch("api/info")
  .then((r) => (r.status === 401 ? location.reload() : r.json()))
  .then((info) => {
    // Só os modelos que o servidor oferece; o primeiro é o padrão.
    if (Array.isArray(info.modelos) && info.modelos.length) {
      for (const b of el.modelo.querySelectorAll("button"))
        b.hidden = !info.modelos.includes(b.dataset.modelo);
      el.modelo.hidden = info.modelos.length < 2;
      if (!estado.conversa) {
        estado.modelo = info.modelos[0];
        travarModelo();
      }
    }
    if (info.tabelaoGeradoEm) {
      const data = info.tabelaoGeradoEm
        .slice(0, 10)
        .split("-")
        .reverse()
        .join("/");
      el.nota.textContent = `As respostas são feitas por inteligência artificial, com os dados do Data Nordeste (cópia de ${data}). Podem ter erros: confira os números importantes nos painéis do site.`;
    }
    if (info.disponivel === false) el.avisoFora.hidden = false;
  })
  .catch(() => {});

travarModelo();
atualizarBotaoEnviar();
carregarHistorico();
const inicial = location.hash.match(/^#c=([a-z0-9-]+)$/);
if (inicial) abrirConversa(inicial[1]);
el.entrada.focus();
