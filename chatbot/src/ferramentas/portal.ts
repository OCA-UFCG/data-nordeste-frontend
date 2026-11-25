/**
 * conteudo_do_portal: busca nos painéis, boletins, data stories e datasets
 * publicados no portal (dados/portal.json, gerado por npm run portal). Serve
 * para "onde vejo isso no site?" e, principalmente, para os temas que o
 * tabelão ainda não tem (comércio exterior, CAGED, FNE...): aí o bot aponta o
 * painel ou o dataset em vez de dizer só que não sabe.
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { z } from "zod";
import { PACOTE, dataBr, tabela } from "./banco.ts";
import { semAcento } from "../texto.ts";
import type { Ferramenta } from "./tipos.ts";
import type { ItemDoPortal } from "../tabelao/portal.ts";

const ARQUIVO = path.join(PACOTE, "dados/portal.json");
const VAZIAS = new Set("de da do das dos e em no na nos nas o a os as um uma para por com sobre qual quais tem ha que como onde ver painel dados dado".split(" "));

let conteudo: { gerado_em: string; itens: ItemDoPortal[] } | undefined;
function carregar() {
  if (!conteudo && existsSync(ARQUIVO)) conteudo = JSON.parse(readFileSync(ARQUIVO, "utf8"));

  return conteudo;
}

/** Palavras da busca, sem acento, sem as vazias, com o radical curto ("vacinacao" acha "vacina"). */
const palavras = (texto: string) => semAcento(texto).split(" ").filter((p) => p.length >= 3 && !VAZIAS.has(p)).map((p) => p.slice(0, 6));

function pontos(item: ItemDoPortal, busca: string[]) {
  const titulo = semAcento(item.titulo);
  const tema = semAcento(item.tema ?? "");
  const resumo = semAcento(item.resumo);

  return busca.reduce((t, p) => t + (titulo.includes(p) ? 3 : 0) + (tema.includes(p) ? 2 : 0) + (resumo.includes(p) ? 1 : 0), 0);
}

/** "que painéis existem?": o tipo de conteúdo dito na busca. */
function tipoDaBusca(busca: string): string | undefined {
  const b = semAcento(busca);
  if (/painei|painel/.test(b)) return "painel";
  if (/boletin|boletim|publicac/.test(b)) return "boletim";
  if (/stor/.test(b)) return "data-story";
  if (/dataset|planilh|baixar/.test(b)) return "dataset";

  return undefined;
}

/**
 * Busca sem palavra de assunto ("painel", "dados"): antes voltava "Nada no
 * portal" e o modelo dizia que o portal não tinha painéis (conversa fe633356,
 * 24/11/2026). Agora lista o tipo pedido, ou diz quantos há de cada tipo.
 */
function listarSemAssunto(itens: ItemDoPortal[], tipo: string | undefined, rodape: string): string {
  if (!tipo) {
    const contagem = ["painel", "boletim", "data-story", "dataset"].map((t) => `${itens.filter((i) => i.tipo === t).length} ${t}`);

    return `A busca não tem palavra de assunto. O portal tem ${contagem.join(", ")}. Busque por um tema ou passe o tipo para ver a lista.${rodape}`;
  }
  const doTipo = itens.filter((i) => i.tipo === tipo).map((i) => ({ titulo: i.titulo, data: i.data, tema: i.tema, link: i.link }));

  return `${tabela(["titulo", "data", "tema", "link"], doTipo)}\n${doTipo.length} itens do tipo ${tipo}. Na resposta, dê o link de cada item que citar, exatamente como está.${rodape}`;
}

export function buscarNoPortal(busca: string, tipo?: string): string {
  const c = carregar();
  if (!c) return "O conteúdo do portal não foi baixado (falta dados/portal.json; rode npm run portal). Diga que não conseguiu consultar o portal agora.";
  const termos = palavras(busca);
  const rodape = `\n(Conteúdo publicado no portal, lido em ${dataBr(c.gerado_em)}.)`;
  if (!termos.length) return listarSemAssunto(c.itens, tipo ?? tipoDaBusca(busca), rodape);
  const achados = c.itens
    .filter((i) => !tipo || i.tipo === tipo)
    .map((i) => ({ i, p: pontos(i, termos) }))
    .filter((x) => x.p > 0)
    .sort((a, b) => b.p - a.p || (b.i.data ?? "").localeCompare(a.i.data ?? ""))
    .slice(0, 8)
    .map(({ i }) => ({ ...i, resumo: i.resumo.slice(0, 220) }));
  if (!achados.length) return `Nada no portal com "${busca}". Tipos que existem: painel, boletim, data-story, dataset.${rodape}`;

  return `${tabela(["tipo", "titulo", "data", "tema", "link", "resumo"], achados)}\nUse o link exatamente como está. Painel e data story são páginas interativas; dataset é a planilha para baixar no catálogo.${rodape}`;
}

export const conteudoDoPortal: Ferramenta = {
  nome: "conteudo_do_portal",
  titulo: "Buscar no conteúdo do portal",
  descricao:
    "Busca nos painéis, boletins (PDF), data stories e datasets (catálogo, no Zenodo) publicados no Data Nordeste e devolve título, data, tema e link. Use para 'onde vejo isso no site?', 'tem boletim sobre...?', 'onde baixo os dados?', e sempre que a pergunta for de um tema que o assistente não tem (a lista está em 'Sobre o Data Nordeste'; ex.: comércio exterior, emprego/CAGED, FNE, energia): aí indique o painel ou dataset do portal. Sem palavra de assunto ('que painéis existem?'), passe só o tipo.",
  entrada: {
    busca: z.string().min(2).describe("Palavras do assunto, ex.: 'exportação', 'emprego caged', 'seca boletim'"),
    tipo: z.enum(["painel", "boletim", "data-story", "publicacao", "dataset"]).optional().describe("Filtra por tipo de conteúdo"),
  },
  async executar({ busca, tipo }: { busca: string; tipo?: string }) {
    return buscarNoPortal(busca, tipo);
  },
};
