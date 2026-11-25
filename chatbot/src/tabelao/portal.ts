/**
 * Baixa o conteúdo publicado do portal para dados/portal.json (npm run portal):
 * painéis, boletins, data stories e outras publicações do Contentful, e os
 * datasets da comunidade "datane" no Zenodo. A ferramenta conteudo_do_portal
 * busca nesse arquivo.
 *
 * O token do Contentful é o de leitura do frontend (NEXT_PUBLIC_*), lido do
 * .env dele (DATANE_FRONTEND_ENV); nada é copiado para este repositório.
 * Os links seguem as rotas do frontend: /data-panel/<id>, /boletim/<sys.id>,
 * /data-stories/<id ArcGIS>, /catalog/<id Zenodo>.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PACOTE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const PORTAL = "https://datanordeste.sudene.gov.br";
const DESTINO = path.join(PACOTE, "dados/portal.json");

export type ItemDoPortal = {
  tipo: "painel" | "boletim" | "data-story" | "publicacao" | "dataset";
  titulo: string;
  data: string | null;
  tema: string | null;
  resumo: string;
  link: string;
};

function lerEnv(arquivo: string): Record<string, string> {
  const caminho = arquivo.replace(/^~/, os.homedir());
  if (!existsSync(caminho)) throw new Error(`Não achei o .env do frontend em "${caminho}"; defina DATANE_FRONTEND_ENV com o caminho dele.`);

  return Object.fromEntries(
    readFileSync(caminho, "utf8")
      .split("\n")
      .map((l) => /^([A-Z0-9_]+)=(.*)$/.exec(l.trim()))
      .filter((m): m is RegExpExecArray => Boolean(m))
      .map((m) => [m[1], m[2].replace(/^["']|["']$/g, "")]),
  );
}

type NoRichText = { value?: string; content?: NoRichText[] };
/** Texto puro de um campo rich text do Contentful. */
const textoDe = (no: NoRichText | null | undefined): string =>
  !no ? "" : `${no.value ?? ""}${(no.content ?? []).map(textoDe).join(" ")}`.replace(/\s+/g, " ").trim();

const CONSULTA = `query {
  postCollection(limit: 300, order: date_DESC) { items { sys { id } title type date link descriptionNew { json } categoryCollection(limit: 5) { items { name } } } }
  panelsCollection(limit: 200) { items { title date macroTheme description { json } } }
}`;

type Post = { sys: { id: string }; title: string; type: string; date: string | null; link: string | null; descriptionNew: { json: NoRichText } | null; categoryCollection: { items: Array<{ name: string } | null> } };
type Painel = { title: string; date: string | null; macroTheme: string | null; description: { json: NoRichText } | null };

/** Mesma regra do frontend (ContentPost): StoryMaps e Experience viram páginas do portal. */
function linkDoPost(p: Post): string {
  if (p.type === "newsletter") return `${PORTAL}/boletim/${p.sys.id}`;
  const arcgis = /(storymaps\.arcgis\.com\/stories|experience\.arcgis\.com\/experience)\/([0-9a-f]{32})/i.exec(p.link ?? "");
  if (arcgis) return `${PORTAL}/${arcgis[1].startsWith("story") ? "data-stories" : "experience"}/${arcgis[2]}`;
  if (p.link?.startsWith("/")) return `${PORTAL}${p.link}`;

  return p.link ?? PORTAL;
}

const TIPO_DO_POST: Record<string, ItemDoPortal["tipo"]> = { newsletter: "boletim", "data-story": "data-story" };

async function doContentful(): Promise<ItemDoPortal[]> {
  const env = lerEnv(process.env.DATANE_FRONTEND_ENV ?? "~/datanordeste/data-nordeste-frontend/.env");
  const espaco = env.NEXT_PUBLIC_CONTENTFUL_SPACE;
  const token = env.NEXT_PUBLIC_CONTENTFUL_ACCESS_TOKEN;
  if (!espaco || !token) throw new Error("O .env do frontend não tem NEXT_PUBLIC_CONTENTFUL_SPACE e NEXT_PUBLIC_CONTENTFUL_ACCESS_TOKEN.");
  const r = await fetch(`https://graphql.contentful.com/content/v1/spaces/${espaco}`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
    body: JSON.stringify({ query: CONSULTA }),
  });
  if (!r.ok) throw new Error(`Contentful respondeu ${r.status} ${r.statusText}; esperado JSON do GraphQL.`);
  const corpo = (await r.json()) as { data: { postCollection: { items: Array<Post | null> }; panelsCollection: { items: Array<Painel | null> } } };
  const posts = corpo.data.postCollection.items.filter((p): p is Post => Boolean(p?.title) && p!.type !== "data-panel");
  const paineis = corpo.data.panelsCollection.items.filter((p): p is Painel => Boolean(p?.title));

  return [
    ...paineis.map((p): ItemDoPortal => ({
      tipo: "painel",
      titulo: `Painel ${p.title}`,
      data: p.date?.slice(0, 10) ?? null,
      tema: p.macroTheme,
      resumo: textoDe(p.description?.json).slice(0, 600),
      link: `${PORTAL}/data-panel/${p.title}`,
    })),
    ...posts.map((p): ItemDoPortal => ({
      tipo: TIPO_DO_POST[p.type] ?? "publicacao",
      titulo: p.title,
      data: p.date?.slice(0, 10) ?? null,
      tema: p.categoryCollection.items.map((c) => c?.name).filter(Boolean).join(", ") || null,
      resumo: textoDe(p.descriptionNew?.json).slice(0, 600),
      link: linkDoPost(p),
    })),
  ];
}

const ENTIDADES: Record<string, string> = { nbsp: " ", amp: "&", quot: '"', lt: "<", gt: ">", ordm: "º", ordf: "ª", deg: "°", ndash: "–", mdash: "—", ldquo: "“", rdquo: "”", lsquo: "‘", rsquo: "’" };
const ACENTOS: Record<string, string> = { acute: "\u0301", grave: "\u0300", circ: "\u0302", tilde: "\u0303", uml: "\u0308", cedil: "\u0327" };

/** Texto puro de um trecho HTML do Zenodo: sem marcas e com &ccedil;, &atilde;, &#233; decodificados. */
export function textoDoHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCodePoint(Number(n)))
    .replace(/&([a-zA-Z])(acute|grave|circ|tilde|uml|cedil);/g, (_, l: string, a: string) => `${l}${ACENTOS[a]}`.normalize("NFC"))
    .replace(/&([a-z]+);/g, (m, nome: string) => ENTIDADES[nome] ?? m)
    .replace(/\s+/g, " ")
    .trim();
}

type RegistroZenodo = { id: number; metadata: { title: string; publication_date?: string; description?: string; keywords?: string[] } };

async function doZenodo(): Promise<ItemDoPortal[]> {
  const itens: ItemDoPortal[] = [];
  for (let pagina = 1; pagina <= 10; pagina++) {
    // O Zenodo limita a 25 por página para clientes sem login.
    const r = await fetch(`https://zenodo.org/api/records?communities=datane&size=25&page=${pagina}&sort=newest`, {
      headers: { accept: "application/json", "user-agent": "Mozilla/5.0 (compatible; datane-chatbot)" },
    });
    if (!r.ok) throw new Error(`Zenodo respondeu ${r.status} na página ${pagina}; esperado JSON de registros da comunidade "datane".`);
    const corpo = (await r.json()) as { hits: { hits: RegistroZenodo[]; total: number } };
    for (const h of corpo.hits.hits)
      itens.push({
        tipo: "dataset",
        titulo: h.metadata.title,
        data: h.metadata.publication_date ?? null,
        tema: (h.metadata.keywords ?? []).join(", ") || null,
        resumo: textoDoHtml(h.metadata.description ?? "").slice(0, 600),
        link: `${PORTAL}/catalog/${h.id}`,
      });
    if (itens.length >= corpo.hits.total || !corpo.hits.hits.length) break;
  }

  return itens;
}

async function main() {
  const [contentful, zenodo] = await Promise.all([doContentful(), doZenodo()]);
  const itens = [...contentful, ...zenodo];
  mkdirSync(path.dirname(DESTINO), { recursive: true });
  writeFileSync(DESTINO, JSON.stringify({ gerado_em: new Date().toISOString(), itens }, null, 1));
  const porTipo = Object.entries(itens.reduce<Record<string, number>>((a, i) => ({ ...a, [i.tipo]: (a[i.tipo] ?? 0) + 1 }), {}));
  console.log(`Conteúdo do portal gravado em ${DESTINO}: ${porTipo.map(([t, n]) => `${t} ${n}`).join(", ")}.`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main();
