/**
 * buscar_territorio: acha o código de um município, estado, região ou recorte
 * pelo nome. Adaptado do chat do SEDES: tenta o nome exato (sem acento,
 * maiúscula, hífen ou apóstrofo), o nome com a UF no fim ("Patos - PB"), um
 * pedaço do nome e, por último, grafias parecidas (erro de digitação). Sem
 * isso, "Cajazieras" voltava como "nenhum território" e o modelo dizia que o
 * dado não existia.
 */
import { z } from "zod";
import { db, tabela } from "./banco.ts";
import { semAcento } from "../texto.ts";
import type { Ferramenta } from "./tipos.ts";

const UFS = new Set("AC AL AM AP BA CE DF ES GO MA MG MS MT PA PB PE PI PR RJ RN RO RR RS SC SE SP TO".split(" "));
const soLetras = (texto: string) => semAcento(texto).replace(/ /g, "");

/** "Campina Grande - PB", "Petrolina/PE", "Sousa (PB)", "Patos PB" → nome e UF. */
export function separarUf(nome: string): { nome: string; uf?: string } {
  const m = /^(.{2,}?)[\s,\-–/(]+([A-Za-z]{2})\)?\s*$/.exec(nome.trim());

  return m && UFS.has(m[2].toUpperCase()) ? { nome: m[1].trim(), uf: m[2].toUpperCase() } : { nome: nome.trim() };
}

/** Quantas letras é preciso trocar, pôr ou tirar para a virar b (Levenshtein). */
export function distancia(a: string, b: string) {
  let linha = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const nova = [i];
    for (let j = 1; j <= b.length; j++)
      nova[j] = Math.min(linha[j] + 1, nova[j - 1] + 1, linha[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    linha = nova;
  }

  return linha[b.length];
}

type Territorio = {
  codigo: string;
  nome: string;
  nome_sem_acento: string;
  nomes_alternativos: string | null;
  tipo: string;
  uf: string | null;
  nm_rgi: string | null;
  semiarido: number | null;
  municipios: number | null;
};

// Outros nomes pelos quais as pessoas chamam os recortes.
const APELIDOS: Record<string, string[]> = {
  area_sudene: ["area da sudene", "area de atuacao da sudene", "sudene", "area sudene"],
  nordeste: ["regiao nordeste", "ne"],
  semiarido: ["semiarido brasileiro", "semi arido"],
  caatinga: ["bioma caatinga"],
  MG_SUDENE: ["minas gerais", "minas", "norte de minas", "norte mineiro", "mg"],
  ES_SUDENE: ["espirito santo", "norte do espirito santo", "norte capixaba", "es"],
  // "Norte de Minas" também é a mesorregião antiga do IBGE, que quase coincide
  // com esta região intermediária: a busca devolve as duas (NOMES_COM_DOIS_SENTIDOS).
  rgint_3102: ["norte de minas", "norte mineiro"],
};

/**
 * Nomes populares que servem a dois territórios de tamanhos bem diferentes.
 * Na rodada c9-v0 (PS06), "norte de Minas" trouxe só MG_SUDENE, e o modelo,
 * sem saber por quê, trocou pela região intermediária de Montes Claros. As
 * duas leituras valem; o que não vale é escolher sem dizer.
 */
const NOMES_COM_DOIS_SENTIDOS: Record<string, string> = {
  nortedeminas:
    "\nATENÇÃO: \"norte de Minas\" tem dois sentidos. (1) A mesorregião antiga do IBGE, que quase coincide com a região intermediária de Montes Claros (rgint_3102, 85 municípios). (2) A parte de Minas Gerais na área da Sudene (MG_SUDENE, 249 municípios, que inclui também os vales do Jequitinhonha e do Mucuri). Use o que a pergunta indica (quem fala da Sudene quer o 2) e diga na resposta qual usou e quantos municípios tem.",
};
NOMES_COM_DOIS_SENTIDOS.nortemineiro = NOMES_COM_DOIS_SENTIDOS.nortedeminas;

const ORDEM_DOS_TIPOS = ["municipio", "estado", "estado_parcial", "recorte", "regiao_intermediaria", "regiao_imediata", "pais"];

let emMemoria: Array<Territorio & { chaves: string[] }> | undefined;
function todos() {
  emMemoria ??= (
    db.prepare("SELECT codigo, nome, nome_sem_acento, nomes_alternativos, tipo, uf, nm_rgi, semiarido, municipios FROM territorios").all() as Territorio[]
  ).map((t) => ({
    ...t,
    chaves: [
      soLetras(t.nome_sem_acento),
      soLetras(t.nome_sem_acento.replace(/^regiao (intermediaria|imediata) de /, "").replace(/ parte na area.*$/, "")),
      ...(t.nomes_alternativos ?? "").split(";").filter(Boolean).map(soLetras),
      ...(APELIDOS[t.codigo] ?? []).map(soLetras),
      ...(t.tipo === "estado" ? [t.codigo.toLowerCase()] : []),
    ],
  }));

  return emMemoria;
}

const COLUNAS = ["codigo", "nome", "tipo", "uf", "nm_rgi", "semiarido", "municipios"];
const ordenar = (ts: Territorio[]) =>
  [...ts].sort((a, b) => ORDEM_DOS_TIPOS.indexOf(a.tipo) - ORDEM_DOS_TIPOS.indexOf(b.tipo) || (a.uf ?? "").localeCompare(b.uf ?? ""));

const SEM_RECORTE =
  "O Data Nordeste tem os 2.074 municípios da área da Sudene, os 9 estados do Nordeste, a parte de MG e do ES na área da Sudene, as regiões geográficas intermediárias e imediatas do IBGE, e os recortes Nordeste, área da Sudene, Semiárido e Caatinga. Não tem bairros, distritos, mesorregiões antigas (Sertão, Agreste, Cariri, Zona da Mata), regiões metropolitanas, bacias, municípios fora da área da Sudene nem outros países.";

function porNomeParecido(nome: string, uf?: string): string {
  const alvo = soLetras(separarUf(nome).nome);
  const ufDoNome = uf ?? separarUf(nome).uf;
  const limite = alvo.length >= 16 ? 3 : alvo.length >= 10 ? 2 : alvo.length >= 5 ? 1 : 0;
  const proximos = todos()
    .filter((t) => !ufDoNome || t.uf === ufDoNome)
    .map((t) => ({ t, d: Math.min(...t.chaves.map((k) => distancia(alvo, k))) }))
    .filter((x) => x.d <= limite)
    .sort((a, b) => a.d - b.d || (a.t.uf ?? "").localeCompare(b.t.uf ?? ""))
    .slice(0, 8);
  if (!proximos.length) return `Nenhum território tem nome parecido com "${nome}"${uf ? ` na UF ${uf}` : ""}. ${SEM_RECORTE}`;

  return `Nenhum território se chama exatamente "${nome}". Os de grafia mais parecida:\n${tabela(COLUNAS, proximos.map((x) => x.t))}\nSe a diferença é só um erro de digitação, use esse território e escreva o nome certo na resposta; com dúvida entre mais de um, pergunte. Se a pessoa falou de outro lugar, diga que o Data Nordeste não tem esse lugar.`;
}

function aviso(linhas: Territorio[]): string {
  const municipios = linhas.filter((l) => l.tipo === "municipio").length;
  if (municipios > 1)
    return `\nATENÇÃO: ${municipios} municípios com esse nome. Se a pessoa não disse a UF, pergunte qual é (ou responda para todos, dizendo a UF de cada um).`;
  if (municipios === 1 && linhas.some((l) => l.tipo.startsWith("regiao")))
    return "\nHá também região intermediária ou imediata com esse nome: use o município, a não ser que a pessoa fale em região.";
  if (linhas.some((l) => l.tipo === "estado_parcial"))
    return "\nATENÇÃO: o Data Nordeste só tem a parte deste estado na área da Sudene. Diga isso na resposta; o número não é do estado inteiro.";
  // "Belo Horizonte" casava só com a região intermediária de BH (1 de 74
  // municípios na área), e o modelo tinha de deduzir que a cidade está fora
  // (rodada c3-v0, TE02). A região leva o nome da cidade-polo; se ela é só em
  // parte da área e nenhum município casou, a cidade-polo está fora.
  if (municipios === 0 && linhas.length && linhas.every((l) => l.tipo.startsWith("regiao") && l.nome.includes("parte na área")))
    return "\nATENÇÃO: não há município com esse nome na área da Sudene. A região do IBGE leva o nome da cidade-polo, que fica fora da área. Se a pessoa perguntou pela cidade, diga que ela está fora da área da Sudene e ofereça um município da área no mesmo estado; não use a região no lugar da cidade.";

  return "";
}

/** A busca da ferramenta (exportada para os testes). */
export function buscarTerritorios(nome: string, uf?: string): string {
  const naUf = (t: Territorio, sigla?: string) => !sigla || t.uf === sigla.toUpperCase();
  const exatos = (texto: string, sigla?: string) => todos().filter((t) => t.chaves.includes(soLetras(texto)) && naUf(t, sigla));
  let linhas = ordenar(exatos(nome, uf));
  let modo = "nome exato";
  if (!linhas.length) {
    const partes = separarUf(nome);
    if (partes.uf && (!uf || uf.toUpperCase() === partes.uf)) linhas = ordenar(exatos(partes.nome, partes.uf));
  }
  if (!linhas.length) {
    const alvo = semAcento(nome);
    linhas = todos()
      .filter((t) => t.nome_sem_acento.includes(alvo) && naUf(t, uf))
      .sort((a, b) => ORDEM_DOS_TIPOS.indexOf(a.tipo) - ORDEM_DOS_TIPOS.indexOf(b.tipo) || a.nome.length - b.nome.length)
      .slice(0, 30);
    modo = "parte do nome";
  }
  if (!linhas.length) return porNomeParecido(nome, uf);
  const doisSentidos = NOMES_COM_DOIS_SENTIDOS[soLetras(separarUf(nome).nome)];

  return `Busca por ${modo}:\n${tabela(COLUNAS, linhas)}${doisSentidos ?? aviso(linhas)}`;
}

export const buscarTerritorio: Ferramenta = {
  nome: "buscar_territorio",
  titulo: "Buscar território pelo nome",
  descricao:
    "Procura municípios, estados, regiões intermediárias e imediatas do IBGE e os recortes (Nordeste, área da Sudene, Semiárido, Caatinga) pelo nome, sem diferenciar acento ou maiúscula, e acha nomes com erro de digitação. Devolve TODOS os homônimos com UF. O campo codigo é o que se usa em valores.territorio. Não precisa chamar para os recortes e estados de código conhecido ('nordeste', 'PB').",
  entrada: {
    nome: z.string().min(2).describe("Nome ou parte do nome, ex.: 'Santa Luzia', 'campina grande', 'Paraíba', 'Cariri'"),
    uf: z.string().length(2).optional().describe("Sigla da UF para filtrar, ex.: 'PB'"),
  },
  async executar({ nome, uf }: { nome: string; uf?: string }) {
    return buscarTerritorios(nome, uf);
  },
};
