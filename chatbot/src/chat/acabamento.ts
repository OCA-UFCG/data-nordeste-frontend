/**
 * O que os dois motores fazem com a resposta do modelo antes de entregá-la:
 *
 *   1. tiram o que não é resposta (o link do site escrito no texto, as linhas
 *      de pergunta sugerida);
 *   2. conferem se os números vieram das ferramentas (conferir-numeros.ts) e,
 *      se algum não veio, pedem ao modelo que reescreva, uma vez;
 *   3. pedem ao modelo que releia a resposta contra as saídas das ferramentas
 *      (revisão das frases) e, se ele achar erro, trocam pela corrigida;
 *   4. montam o link para o painel do portal pelas consultas feitas.
 *
 * São coisas que o prompt pedia e o Haiku cumpria quase sempre; aqui ficam
 * garantidas pelo código, para os dois modelos.
 */
import { paineisDasConsultas } from "../ferramentas/index.ts";
import { numerosSemFonte } from "../conferir-numeros.ts";
import { promptDoSistema } from "../prompt-sistema.ts";
import { linguaDa, NOME_DA_LINGUA, respostaNaLinguaErrada } from "./lingua.ts";
import { SINAL_DE_SUGESTAO, type Pedido, type Turno } from "./turno.ts";

// DATANE_CHAT_CONFERIR=0 desliga a rodada de correção (para comparar na avaliação).
const CONFERIR = process.env.DATANE_CHAT_CONFERIR !== "0";
// DATANE_CHAT_REVISAR=0 desliga a revisão das frases.
const REVISAR = process.env.DATANE_CHAT_REVISAR !== "0";
const SUGESTOES_MAX = 3;

/**
 * A conferência dos números pega número inventado, mas o erro que sobrava no
 * Haiku era outro: os números vinham certos e a frase em volta não ("quase
 * toda em seca fraca" com 26% fraca e 14% moderada; "26 municípios" com 23 na
 * tabela; "as fontes concordam" quando discordavam). Aqui o modelo relê a
 * própria resposta com uma lista curta do que procurar. Medido em 16/11/2026:
 * veja o diário do processo, na documentação interna.
 */
/**
 * A linha que separa o comentário do revisor da resposta corrigida. Antes a
 * página tentava reconhecer o comentário pelo texto ("não precisa de
 * correção", "segue a resposta corrigida") e errou três vezes: R03 (c3-todas),
 * FP07 (amp-2) e PX16 (c12-todas: "Não encontrei erro que exija reescrever.
 * Ajustei três pontos..." chegou à pessoa). Com a marca, nada antes dela é
 * mostrado.
 */
export const MARCA_DA_CORRECAO = "RESPOSTA CORRIGIDA:";

const PEDIDO_DE_REVISAO = `[Conferência automática da página, não é mensagem da pessoa] Antes de entregar, releia a sua resposta frase por frase, comparando com as saídas das ferramentas desta conversa. Procure só estes erros:
1. Resumo que a saída não confirma: "quase toda", "a maioria", "só", "nenhum", "todos", "sempre", "se concentra em", "o mais", e contagens ("26 municípios", "em 3 dos anos"). Conte de novo na tabela.
2. Direção ou ordem trocada: maior e menor, pior e melhor, subiu e caiu, mais forte e mais fraco, antes e depois.
3. Número certo com o período, o território, o índice ou a classe errados em relação à linha da saída de onde ele veio.
4. Afirmação que não está em nenhuma saída nem nos textos do Data Nordeste: causas, explicações, o que é "normal", como o índice é calculado ou de quanto em quanto tempo é atualizado.
5. A resposta foge do que foi perguntado: outro período ("de lá pra cá" é desde o ano da conversa), ou outra língua que não a da pergunta.
Se não achar nenhum desses erros, responda só com a palavra OK, sem mais nada. Se achar, escreva uma linha só com ${MARCA_DA_CORRECAO} e, abaixo dela, a resposta inteira de novo para a pessoa, com as perguntas sugeridas. A pessoa só vê o que vier depois dessa linha; o que você escrever antes dela é descartado. Mude só o que está errado: tire a frase sem apoio ou troque pelo que a saída diz. Não acrescente assunto novo nem alongue a resposta.`;

/** A resposta do modelo à revisão diz que está tudo certo? */
export function revisaoSemErro(texto: string): boolean {
  const t = texto.trim();
  if (t.length < 40) return true;
  if (
    t.length < 160 &&
    /^\W*(ok\b|nenhum erro|n[ãa]o (achei|encontrei|h[áa]) )/iu.test(t)
  )
    return true;
  // Às vezes o "OK" vem por extenso ("Esta resposta não precisa de correção,
  // então não a reescrevo. A contagem está certa..."). Sem isto o comentário
  // virava a resposta e a pessoa ficava sem os dados (pergunta R03, c3-todas).
  // Se o texto anuncia uma correção ("segue a resposta corrigida"), é reescrita.
  const comeco = t.slice(0, 250);
  return (
    /n[ãa]o precisa (de )?(corre[çc][ãa]o|ser corrigid|mudan[çc]a)|n[ãa]o (a )?reescrevo|nenhuma corre[çc][ãa]o|(est[áa]|ficou) (toda |tudo )?(certa|correta)[ ,.]/iu.test(
      comeco,
    ) && !/segue a resposta|resposta corrigida|vers[ãa]o corrigida/iu.test(t)
  );
}

/**
 * O que a revisão devolveu vira a resposta da pessoa? Devolve a resposta
 * corrigida (o texto depois da marca) ou null para ficar com a de antes:
 * "OK", texto sem a marca ou marca sem resposta embaixo. Sem marca fica a de
 * antes de propósito: perder uma correção custa menos que mostrar à pessoa o
 * comentário do revisor (PX16, c12-todas).
 *
 *   respostaDaRevisao("OK")                                  // null
 *   respostaDaRevisao("Tirei uma frase.\nRESPOSTA CORRIGIDA:\nEm 2022...") // "Em 2022..."
 */
export function respostaDaRevisao(texto: string): string | null {
  const marca = /^[\s*#_>-]*RESPOSTA CORRIGIDA:?[\s*_]*$/imu.exec(texto);
  if (!marca) return null;
  const depois = texto.slice(marca.index + marca[0].length).trim();

  return depois.length >= 40 ? depois : null;
}

let prompt: { dia: string; texto: string } | undefined;
function promptDeHoje() {
  const dia = new Date().toDateString();
  if (prompt?.dia !== dia) prompt = { dia, texto: promptDoSistema() };
  return prompt.texto;
}

/**
 * Separa a resposta das perguntas sugeridas e tira do texto os links de
 * painel, porque a página já mostra o botão do painel das consultas. Ficam os
 * links em permitidos: os que conteudo_do_portal devolveu, que o prompt
 * deixa escrever (UR22, c13: a lista dos 24 painéis saía sem nenhum link).
 *
 *   limparResposta("Veja [o painel](https://.../data-panel/pib).", new Set())
 *   // { resposta: "Veja o painel.", sugestoes: [] }
 */
export function limparResposta(
  texto: string,
  permitidos: ReadonlySet<string> = new Set(),
): {
  resposta: string;
  sugestoes: string[];
} {
  // Tudo depois do primeiro » são as perguntas sugeridas (uma por »), com
  // quebra de linha entre elas ou não.
  const [corpo, ...depois] = texto.split(SINAL_DE_SUGESTAO);
  const sugestoes = depois
    .map((p) => p.trim().replace(/^[-*]\s*/, "").replace(/\s+/gu, " "))
    .filter((p) => p.length > 8)
    .slice(0, SUGESTOES_MAX);
  const linhas: string[] = [];
  for (const linha of corpo.split("\n")) {
    const l = linha.trim();
    // "[Ver o painel](https://datanordeste.../data-panel/...)": a página já mostra o botão.
    const sozinho = /^\W*(\*\*)?\[[^\]]*\]\((https?:\/\/[^)]*\/data-panel\/[^)]*)\)\W*$/u.exec(l);
    if (sozinho && !permitidos.has(sozinho[2])) continue;
    linhas.push(linha);
  }
  const resposta = linhas
    .join("\n")
    .replace(/\[([^\]]*)\]\((https?:\/\/[^)]*\/data-panel\/[^)]*)\)/gu, (link, nome: string, url: string) =>
      permitidos.has(url) ? link : nome,
    )
    .replace(/\n{3,}/gu, "\n\n")
    .trim();
  return { resposta: semIntroducaoPendurada(resposta), sugestoes };
}

/**
 * A última frase terminada em ":" anunciava as perguntas sugeridas, que saem
 * do texto e viram botões: sobrava "Por exemplo:" no fim, sem nada depois
 * (gamma, 25/11/2026, na recusa de alterar o banco; 6 de 3.439 respostas das
 * rodadas, como G04 e NV09). Só a frase final sai; um número com ponto
 * ("1.234 pessoas:") para a busca, e nada é tirado.
 *
 *   semIntroducaoPendurada("Posso mostrar de outras formas. Por exemplo:")
 *   // "Posso mostrar de outras formas."
 */
export function semIntroducaoPendurada(texto: string): string {
  return texto.replace(/(^|[.!?]\s+|\n)[^.!?\n]*:\s*$/u, "$1").trim();
}

/** Os links que conteudo_do_portal devolveu neste turno. */
function linksDoPortal(t: Turno): Set<string> {
  const saidas = t.ferramentas.filter((f) => f.nome === "conteudo_do_portal").map((f) => String(f.saida ?? ""));

  return new Set(saidas.flatMap((s) => s.match(/https?:\/\/[^\s|)]+/gu) ?? []));
}

/**
 * Chamado quando o modelo termina de escrever. Devolve o pedido de correção a
 * mandar ao modelo, ou null quando a resposta está pronta (e já acabada: texto
 * limpo, link e sugestões enviados à página).
 */
export function acabar(pedido: Pedido): string | null {
  const t = pedido.turno;
  // Volta da revisão: "OK" mantém a resposta que a pessoa já está vendo;
  // outro texto é a resposta corrigida e segue o caminho normal abaixo.
  let antesDaRevisao: string | undefined;
  if (t.revisada && pedido.respostaAntesDaRevisao !== undefined) {
    antesDaRevisao = pedido.respostaAntesDaRevisao;
    pedido.respostaAntesDaRevisao = undefined;
    const nova =
      t.resposta.trim() || (t.rascunho.length > 200 ? t.rascunho : "");
    const corrigida = respostaDaRevisao(nova);
    t.terminarRevisao(corrigida ?? antesDaRevisao);
    t.reescritaNaRevisao = corrigida !== null;
    // Medida: a revisão quis mudar, mas sem a marca a mudança se perdeu.
    t.revisaoSemMarca = corrigida === null && !!nova && !revisaoSemErro(nova);
  }
  // O modelo escreveu a resposta, chamou uma ferramenta e fechou com quase
  // nada: a resposta era o que veio antes.
  if (
    t.rascunho &&
    (!t.resposta.trim() ||
      (t.resposta.length < 200 && t.rascunho.length > 400))
  )
    t.resposta = `${t.rascunho}\n\n${t.resposta}`.trim();

  const { resposta, sugestoes } = limparResposta(t.resposta, linksDoPortal(t));

  const anteriores = pedido.anteriores();
  const fontes = {
    ferramentas: [
      ...anteriores.flatMap((a) => a.ferramentas ?? []),
      ...t.ferramentas,
    ].flatMap((f) => [String(f.saida ?? ""), JSON.stringify(f.entrada ?? "")]),
    outras: [
      ...anteriores.flatMap((a) => [a.pergunta, a.resposta]),
      t.pergunta,
      promptDeHoje(),
    ],
  };
  const sem = numerosSemFonte(resposta, fontes, linguaDa(t.pergunta));
  // A resposta corrigida na revisão trouxe número sem fonte: fica a anterior,
  // que já tinha passado na conferência.
  if (antesDaRevisao !== undefined && t.reescritaNaRevisao && sem.length) {
    t.reescritaNaRevisao = false;
    t.resposta = antesDaRevisao;
    return acabar(pedido);
  }

  // Língua errada usa a mesma ida de correção dos números (uma vez só).
  const lingua = respostaNaLinguaErrada(t.pergunta, resposta);
  if ((sem.length || lingua) && CONFERIR && !t.corrigida) {
    t.corrigida = true;
    t.numerosSemFonte = sem;
    t.descartarTexto();
    t.rascunho = "";
    t.status("Conferindo a resposta…");
    // "Mexa só nesses números": sem isso, a correção das medidas de um campo de
    // futebol (105 × 68 m, de memória) levou junto a conversão em campos, que era
    // a resposta à pergunta (rodada c17-v1, DE01).
    const numeros = sem.length
      ? ` Estes números da sua resposta não aparecem nas saídas das ferramentas desta conversa: ${sem.join("; ")}. Confira cada um. Se for uma conta sua (soma, diferença, média) com valores das saídas, refaça a conta com uma consulta ou tire o número. Se veio de memória, tire ou consulte. Mexa só nesses números: o resto da resposta fica, principalmente a parte que responde à pergunta.`
      : "";
    const idioma = lingua
      ? ` A pergunta foi em ${NOME_DA_LINGUA[lingua]} e a sua resposta saiu em português. Escreva tudo em ${NOME_DA_LINGUA[lingua]}, inclusive as perguntas sugeridas; os nomes dos lugares e das fontes ficam como estão.`
      : "";

    return `[Conferência automática da página, não é mensagem da pessoa]${numeros}${idioma} Depois escreva a resposta inteira de novo, completa, para a pessoa, sem mencionar esta conferência.`;
  }
  // Na segunda vez, fica o que veio: registra o que sobrou sem fonte.
  t.numerosSemFonte = t.corrigida ? sem : [];

  // Revisão das frases: só em resposta que usou ferramenta e que ainda não
  // foi reescrita pela conferência dos números (uma ida a mais por turno).
  if (REVISAR && !t.revisada && !t.corrigida && t.ferramentas.length) {
    pedido.respostaAntesDaRevisao = t.resposta;
    t.iniciarRevisao();
    t.status("Conferindo a resposta…");
    return PEDIDO_DE_REVISAO;
  }

  // A página já mostrou o texto até o primeiro »: só troca se mudou mais que isso.
  // (A resposta corrigida na revisão a página ainda não viu: troca sempre.)
  if (
    !t.reescritaNaRevisao &&
    resposta === t.resposta.split(SINAL_DE_SUGESTAO)[0].trim()
  )
    t.resposta = resposta;
  else t.substituirTexto(resposta);
  const paineis = paineisDasConsultas(
    t.ferramentas
      .filter(
        (f) =>
          f.nome === "consultar_sql" &&
          !f.erro &&
          !/^(Erro|Nenhuma linha)/u.test(f.saida ?? ""),
      )
      .map((f) => String((f.entrada as { sql?: string } | null)?.sql ?? "")),
  );
  for (const p of paineis) t.link(p.url, p.titulo);
  t.sugerir(sugestoes);
  return null;
}
