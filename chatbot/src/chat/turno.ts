/**
 * O que os dois motores da página (motor-api.ts e motor-claude.ts) têm em
 * comum: um Turno recebe o que o modelo vai fazendo e repassa para a página,
 * e o servidor grava o turno inteiro quando ele termina.
 */
import type { Contexto } from "../ferramentas/index.ts";

export type Evento = Record<string, unknown> & { tipo: string };

// Tamanho máximo da saída de ferramenta mandada para a página (ela mostra
// num detalhe recolhido; o arquivo da conversa guarda a saída inteira).
export const SAIDA_MAX = 6_000;

export type Ferramenta = {
  id: string;
  nome: string;
  entrada: unknown;
  saida?: string;
  erro?: boolean;
  inicio: number;
  ms?: number;
};

export type FimDoTurno = {
  ms?: number;
  custo_usd?: number;
  uso?: unknown;
  erro?: string | null;
  interrompida?: boolean;
  /** Só no motor "claude": a sessão do claude que o --resume retoma. */
  session_id?: string;
};

/** Linha que começa com este sinal, no fim da resposta, é pergunta sugerida. */
export const SINAL_DE_SUGESTAO = "»";

export class Turno {
  resposta = "";
  ferramentas: Ferramenta[] = [];
  /** Links para os painéis do portal, montados pela página (acabamento.ts). */
  links: Array<{ url: string; titulo: string }> = [];
  /** Perguntas de continuação que o modelo sugeriu. */
  sugestoes: string[] = [];
  /** Números da resposta que a conferência não achou nas fontes. */
  numerosSemFonte: string[] = [];
  /** Se a resposta foi reescrita depois da conferência dos números. */
  corrigida = false;
  /** Se a página pediu ao modelo que relesse a resposta (revisão das frases). */
  revisada = false;
  /** Se a revisão trocou a resposta por outra. */
  reescritaNaRevisao = false;
  /** A revisão devolveu texto que não era OK, mas sem a marca da correção. */
  revisaoSemMarca = false;
  /**
   * Durante a revisão a pessoa continua vendo a resposta já escrita; o que o
   * modelo escreve fica só aqui, até a página decidir se troca.
   */
  private revisando = false;
  /** O último texto descartado (escrito antes de uma chamada de ferramenta). */
  rascunho = "";
  readonly inicio = Date.now();
  private separar = false;
  private terminado = false;
  private escondendo = false;

  constructor(
    readonly numero: number,
    readonly pergunta: string,
    private readonly enviar: (e: Evento) => void,
    private readonly aoTerminar: (t: Turno, fim: FimDoTurno) => void,
  ) {}

  get acabou() {
    return this.terminado;
  }

  pensando() {
    if (!this.revisando) this.enviar({ tipo: "pensando" });
  }

  preparando(nome: string) {
    if (!this.revisando) this.enviar({ tipo: "preparando", nome });
  }

  /**
   * Começa a revisão: guarda a resposta fora da tela de escrita e deixa de
   * repassar texto para a página. Devolve a resposta que estava pronta.
   */
  iniciarRevisao(): string {
    const pronta = this.resposta;
    this.revisada = true;
    this.revisando = true;
    this.resposta = "";
    this.rascunho = "";
    this.separar = false;
    this.escondendo = false;
    return pronta;
  }

  /** Termina a revisão: a resposta volta a ser a que a página decidir. */
  terminarRevisao(resposta: string) {
    this.revisando = false;
    this.resposta = resposta;
    this.rascunho = "";
    this.separar = false;
  }

  /** Um bloco de texto novo depois de outro: a página separa em parágrafos. */
  novoBlocoDeTexto() {
    if (this.resposta) this.separar = true;
  }

  texto(pedaco: string) {
    if (!pedaco) return;
    if (this.separar) {
      pedaco = "\n\n" + pedaco;
      this.separar = false;
    }
    this.resposta += pedaco;
    if (this.revisando) return;
    // As perguntas sugeridas vêm no fim, em linhas com ». A página não mostra
    // esse trecho enquanto ele é escrito; elas chegam como botões no fim.
    if (this.escondendo) return;
    const corte = pedaco.indexOf(SINAL_DE_SUGESTAO);
    if (corte >= 0) {
      this.escondendo = true;
      pedaco = pedaco.slice(0, corte);
      if (!pedaco) return;
    }
    this.enviar({ tipo: "texto", t: pedaco });
  }

  /**
   * Joga fora o texto escrito até aqui. O que o modelo escreve antes de chamar
   * uma ferramenta é rascunho ("Vou verificar...", ou a resposta inteira que
   * ele reescreve depois): sem isto a página mostrava os dois.
   */
  descartarTexto() {
    if (!this.resposta) return;
    this.rascunho = this.resposta;
    this.resposta = "";
    this.separar = false;
    this.escondendo = false;
    if (!this.revisando) this.enviar({ tipo: "descartar" });
  }

  /** Troca o texto mostrado pelo texto final (limpo). */
  substituirTexto(texto: string) {
    this.resposta = texto;
    this.separar = false;
    this.enviar({ tipo: "descartar" });
    if (texto) this.enviar({ tipo: "texto", t: texto });
  }

  status(texto: string) {
    this.enviar({ tipo: "status", texto });
  }

  link(url: string, titulo: string) {
    if (this.links.some((l) => l.url === url)) return;
    this.links.push({ url, titulo });
    this.enviar({ tipo: "link", url, titulo });
  }

  sugerir(perguntas: string[]) {
    this.sugestoes = perguntas;
    if (perguntas.length) this.enviar({ tipo: "sugestoes", perguntas });
  }

  ferramenta(id: string, nome: string, entrada: unknown) {
    const f: Ferramenta = { id, nome, entrada, inicio: Date.now() };
    this.ferramentas.push(f);
    this.enviar({ tipo: "ferramenta", id, nome, entrada });
  }

  saida(id: string, texto: string, erro: boolean) {
    const f = this.ferramentas.find((x) => x.id === id);
    if (!f) return;
    f.saida = texto;
    f.erro = erro;
    f.ms = Date.now() - f.inicio;
    this.enviar({
      tipo: "saida",
      id,
      texto: texto.slice(0, SAIDA_MAX),
      cortada: texto.length > SAIDA_MAX,
      erro,
      ms: f.ms,
    });
  }

  terminar(fim: FimDoTurno) {
    if (this.terminado) return;
    this.terminado = true;
    this.aoTerminar(this, fim);
  }
}

/** O que o motor recebe para responder uma pergunta. */
export type Pedido = {
  conversa: string;
  /** Apelido do modelo: "haiku" ou "sonnet". */
  modelo: string;
  turno: Turno;
  contexto: Contexto;
  /** A resposta que estava pronta quando a revisão das frases começou. */
  respostaAntesDaRevisao?: string;
  /** Turnos já gravados, para retomar uma conversa que não está na memória. */
  anteriores: () => Array<{
    pergunta: string;
    resposta: string;
    session_id?: string;
    ferramentas?: Array<{ entrada?: unknown; saida?: string }>;
  }>;
};

export type Motor = {
  nome: "api" | "claude";
  /** Apelido → id do modelo. */
  modelos: Record<string, string>;
  /** Começa a responder; termina chamando pedido.turno.terminar(). */
  responder(pedido: Pedido): void;
  /** Botão Parar: interrompe a resposta em andamento daquela conversa. */
  parar(conversa: string): void;
  /** Opcional: prepara o modelo para a próxima conversa (motor "claude"). */
  aquecer?(modelo: string): void;
  /** Fecha a conversa e libera o que ela ocupa (usado pela avaliação). */
  esquecer(conversa: string): void;
  encerrar(): void;
};
