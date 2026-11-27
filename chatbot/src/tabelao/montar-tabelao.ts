/**
 * Monta dados/datane.sqlite a partir do oca_db (npm run tabelao).
 *
 * Só lê do banco: a sessão abre em modo somente leitura e cada consulta é um
 * SELECT nas views de indicadores.ts. Tudo o que é cálculo (estados, regiões,
 * recortes, totais por sexo e faixa etária) acontece aqui, no SQLite, com as
 * regras do catálogo. O arquivo novo só substitui o anterior no fim, se tudo
 * deu certo.
 *
 * Variáveis: PG* (conexão; scripts/com-banco.sh preenche), DATANE_TABELAO
 * (destino, padrão dados/datane.sqlite).
 */
import pg from "pg";
import { DatabaseSync } from "node:sqlite";
import { mkdirSync, renameSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  CONSULTAS,
  DESCRICOES_DAS_CATEGORIAS,
  DIMENSOES,
  INDICADORES,
  ORDEM_DAS_CATEGORIAS,
  type Consulta,
  type Dimensao,
  type Indicador,
} from "./indicadores.ts";
import { ESQUEMA_SQLITE, INDICES_E_VISOES } from "./esquema.ts";
import { lerCadastro, nomeSemAcento, type Cadastro } from "./territorios.ts";
import { tirarResiduo } from "./residuo.ts";

const PACOTE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const DESTINO = process.env.DATANE_TABELAO ?? path.join(PACOTE, "dados/datane.sqlite");
const LOTE = 20_000;

const relatorio: string[] = [];
function anotar(linha: string) {
  relatorio.push(linha);
  console.log(linha);
}

async function conectar() {
  const cliente = new pg.Client({ application_name: "datane-chatbot (tabelao, so leitura)" });
  await cliente.connect();
  // INTENTIONAL: sessão só leitura. Se alguém puser um INSERT numa consulta
  // do catálogo, o Postgres recusa em vez de gravar no banco do portal.
  await cliente.query("SET default_transaction_read_only = on");
  await cliente.query("SET statement_timeout = '20min'");
  await cliente.query("BEGIN READ ONLY");

  return cliente;
}

function abrirSqlite(arquivo: string) {
  rmSync(arquivo, { force: true });
  const db = new DatabaseSync(arquivo);
  db.exec("PRAGMA journal_mode = OFF; PRAGMA synchronous = OFF; PRAGMA cache_size = -400000; PRAGMA temp_store = MEMORY;");
  db.exec(ESQUEMA_SQLITE);

  return db;
}

// ---------------------------------------------------------------------------
// Territórios

function gravarTerritorios(db: DatabaseSync, cadastro: Cadastro) {
  const ins = db.prepare(
    `INSERT INTO territorios VALUES (:codigo, :nome, :nome_sem_acento, NULL, :tipo, :uf, :cd_rgint, :nm_rgint,
     :cd_rgi, :nm_rgi, :nordeste, :semiarido, :caatinga, :area_km2, :municipios, :observacao)`,
  );
  const insM = db.prepare("INSERT INTO membros VALUES (?, ?)");
  db.exec("BEGIN");
  for (const t of cadastro.territorios) ins.run({ ...t, nome_sem_acento: nomeSemAcento(t) });
  for (const [territorio, municipio] of cadastro.membros) insM.run(territorio, municipio);
  db.exec("COMMIT");
  const porTipo = db.prepare("SELECT tipo, count(*) AS n FROM territorios GROUP BY tipo ORDER BY tipo").all();
  anotar(`Territórios: ${porTipo.map((r) => `${r.tipo} ${r.n}`).join(", ")}`);
}

/** Grava as outras grafias de cada município (do cadastro e das views). */
function gravarNomesAlternativos(db: DatabaseSync, nomes: Map<string, Set<string>>) {
  const atual = new Map(
    (db.prepare("SELECT codigo, nome FROM territorios WHERE tipo = 'municipio'").all() as Array<{ codigo: string; nome: string }>).map(
      (r) => [r.codigo, r.nome],
    ),
  );
  const upd = db.prepare("UPDATE territorios SET nomes_alternativos = ? WHERE codigo = ?");
  let n = 0;
  for (const [codigo, conjunto] of nomes) {
    const outros = [...conjunto].filter((x) => x && x !== atual.get(codigo));
    if (!outros.length) continue;
    upd.run(outros.join("; "), codigo);
    n += 1;
  }
  anotar(`Municípios com outra grafia em alguma view: ${n}`);
}

// ---------------------------------------------------------------------------
// Consultas: oca_db → tabela temporária c_<id>

const periodoDe = (ano: number, mes: number | null) =>
  mes === null ? String(ano) : `${ano}-${String(mes).padStart(2, "0")}`;

const numero = (v: unknown) => (v === null || v === undefined || v === "" ? null : Number(v));

async function carregarConsulta(
  cliente: pg.Client,
  db: DatabaseSync,
  c: Consulta,
  nomes: Map<string, Set<string>>,
) {
  const inicio = Date.now();
  const colunas = ["cd_mun", "nm_mun", "periodo", "ano", "mes", ...c.dimensoes, ...c.medidas];
  db.exec(
    `CREATE TEMP TABLE c_${c.id} (cd_mun INTEGER, nm_mun TEXT, periodo TEXT, ano INTEGER, mes INTEGER${c.dimensoes
      .map((d) => `, ${d} TEXT`)
      .join("")}${c.medidas.map((m) => `, ${m} REAL`).join("")})`,
  );
  const ins = db.prepare(`INSERT INTO c_${c.id} VALUES (${colunas.map(() => "?").join(", ")})`);
  await cliente.query(`DECLARE cursor_${c.id} NO SCROLL CURSOR FOR ${c.sql}`);
  let linhas = 0;
  for (;;) {
    const lote = await cliente.query<Record<string, unknown>>(`FETCH ${LOTE} FROM cursor_${c.id}`);
    if (!lote.rows.length) break;
    db.exec("BEGIN");
    for (const r of lote.rows) {
      const ano = Number(r.ano);
      const mes = numero(r.mes);
      const nm = String(r.nm_mun ?? "");
      if (Number(r.cd_mun) > 0) nomes.set(String(r.cd_mun), (nomes.get(String(r.cd_mun)) ?? new Set()).add(nm));
      ins.run(
        Number(r.cd_mun),
        nm,
        periodoDe(ano, mes),
        ano,
        mes,
        ...c.dimensoes.map((d) => (r[d] === null ? null : String(r[d]).trim())),
        ...c.medidas.map((m) => numero(r[m])),
      );
    }
    db.exec("COMMIT");
    linhas += lote.rows.length;
  }
  await cliente.query(`CLOSE cursor_${c.id}`);
  anotar(`Consulta ${c.id}: ${linhas} linhas em ${((Date.now() - inicio) / 1000).toFixed(1)} s (${c.origem})`);
}

// ---------------------------------------------------------------------------
// Indicadores: c_<id> → base → cubo (com totais) → valores

/** Expressão do valor de um município (sobre uma linha do cubo). */
function valorMunicipal(ind: Indicador) {
  if (ind.agregacao === "razao") return `CASE WHEN den > 0 THEN ${ind.fator ?? 1} * num / den END`;

  return "num";
}

/** Expressão do valor de um recorte (sobre um grupo de municípios). */
function valorAgregado(ind: Indicador) {
  if (ind.agregacao === "razao") return `CASE WHEN SUM(c.den) > 0 THEN ${ind.fator ?? 1} * SUM(c.num) / SUM(c.den) END`;

  return "SUM(c.num)";
}

/** As linhas do indicador, uma vez cada, na tabela base (município × período × recorte). */
function preencherBase(db: DatabaseSync, ind: Indicador, c: Consulta): number {
  db.exec("DELETE FROM base");
  let descartadas = 0;
  for (const linha of ind.linhas) {
    const dims = DIMENSOES.map((d) => {
      const fixo = linha.recorte?.[d];
      if (fixo !== undefined) return `'${fixo.replaceAll("'", "''")}'`;

      return c.dimensoes.includes(d) ? `COALESCE(${d}, 'sem informação')` : "'total'";
    });
    const den = linha.denominador ?? "NULL";
    // Razão: município sem denominador positivo fica fora das duas somas.
    const valido =
      ind.agregacao === "razao"
        ? `(${linha.numerador}) IS NOT NULL AND (${den}) > 0`
        : `(${linha.numerador}) IS NOT NULL`;
    db.exec(
      `INSERT INTO base SELECT cd_mun, periodo, ano, mes, ${dims.join(", ")}, ${linha.numerador}, ${den}
       FROM c_${c.id} WHERE ${valido}`,
    );
    descartadas += Number(
      (db.prepare(`SELECT count(*) AS n FROM c_${c.id} WHERE NOT (${valido})`).get() as { n: number }).n,
    );
  }

  return descartadas;
}

/** Soma a base em todas as combinações de totais (ex.: sexo × cor × faixa → 8 combinações). */
function preencherCubo(db: DatabaseSync, ind: Indicador) {
  db.exec("DELETE FROM cubo");
  const totais = ind.totais ?? [];
  for (let mascara = 0; mascara < 1 << totais.length; mascara++) {
    const somadas = new Set(totais.filter((_, i) => mascara & (1 << i)));
    const dims = DIMENSOES.map((d) => (somadas.has(d) ? `'total'` : d));
    const grupo = DIMENSOES.filter((d) => !somadas.has(d));
    db.exec(
      `INSERT INTO cubo SELECT cd_mun, periodo, ano, mes, ${dims.join(", ")}, SUM(num), SUM(den)
       FROM base GROUP BY cd_mun, periodo${grupo.map((d) => `, ${d}`).join("")}`,
    );
  }
}

function gravarValores(db: DatabaseSync, ind: Indicador) {
  const dims = DIMENSOES.join(", ");
  db.exec(
    `INSERT INTO valores SELECT '${ind.id}', periodo, ano, mes,
       CASE cd_mun WHEN 0 THEN 'brasil' ELSE CAST(cd_mun AS TEXT) END, ${dims}, ${valorMunicipal(ind)}
     FROM cubo
     WHERE ${valorMunicipal(ind)} IS NOT NULL
       AND (cd_mun = 0 OR CAST(cd_mun AS TEXT) IN (SELECT codigo FROM territorios WHERE tipo = 'municipio'))`,
  );
  if (ind.agregacao !== "municipal")
    db.exec(
      `INSERT INTO valores SELECT '${ind.id}', c.periodo, MIN(c.ano), MIN(c.mes), m.territorio,
         ${DIMENSOES.map((d) => `c.${d}`).join(", ")}, ${valorAgregado(ind)}
       FROM cubo c JOIN membros m ON m.municipio = CAST(c.cd_mun AS TEXT)
       WHERE c.cd_mun <> 0
       GROUP BY c.periodo, m.territorio${DIMENSOES.map((d) => `, c.${d}`).join("")}
       HAVING ${valorAgregado(ind)} IS NOT NULL`,
    );
  tirarResiduo(db, ind.id);
}

function calcularIndicador(db: DatabaseSync, ind: Indicador) {
  const c = CONSULTAS.find((x) => x.id === ind.consulta);
  if (!c) throw new Error(`Indicador "${ind.id}" aponta para a consulta "${ind.consulta}", que não existe em CONSULTAS.`);
  const inicio = Date.now();
  const descartadas = preencherBase(db, ind, c);
  preencherCubo(db, ind);
  db.exec("BEGIN");
  gravarValores(db, ind);
  db.exec("COMMIT");
  const r = db
    .prepare(
      `SELECT count(*) AS n, count(DISTINCT periodo) AS periodos,
         count(DISTINCT CASE WHEN territorio GLOB '[0-9]*' THEN territorio END) AS municipios
       FROM valores WHERE indicador = ?`,
    )
    .get(ind.id) as { n: number; periodos: number; municipios: number };
  anotar(
    `  ${ind.id}: ${r.n} valores, ${r.periodos} períodos, ${r.municipios} municípios com valor` +
      `${descartadas ? `, ${descartadas} linhas da fonte sem valor válido (vazio${ind.agregacao === "razao" ? " ou denominador ≤ 0" : ""})` : ""}` +
      ` (${((Date.now() - inicio) / 1000).toFixed(1)} s)`,
  );
}

// ---------------------------------------------------------------------------
// Catálogo (tabelas indicadores e categorias)

const ORDEM_FIXA: Record<string, string[]> = {
  sexo: ["Homens", "Mulheres"],
  cor_raca: ["Branca", "Preta", "Amarela", "Parda", "Indígena"],
};
const primeiroNumero = (s: string) => Number(/\d+/.exec(s)?.[0] ?? 1e9);

function ordenarValores(ind: Indicador, dim: Dimensao, valores: string[]) {
  const daLinha = ind.linhas.map((l) => l.recorte?.[dim]).filter((x): x is string => Boolean(x));
  const ordem = (dim === "categoria" ? ORDEM_DAS_CATEGORIAS[ind.id] : undefined) ?? ORDEM_FIXA[dim] ?? (daLinha.length ? daLinha : undefined);
  if (ordem) return [...valores].sort((a, b) => (ordem.indexOf(a) + 1 || 999) - (ordem.indexOf(b) + 1 || 999));
  if (dim === "faixa_etaria") return [...valores].sort((a, b) => primeiroNumero(a) - primeiroNumero(b));

  return [...valores].sort((a, b) => a.localeCompare(b, "pt-BR"));
}

async function descricoesDasCategorias(cliente: pg.Client) {
  const out = new Map<string, Map<string, string>>();
  for (const [consulta, sql] of Object.entries(DESCRICOES_DAS_CATEGORIAS)) {
    const linhas = (await cliente.query<{ categoria: string; descricao: string }>(sql)).rows;
    out.set(consulta, new Map(linhas.map((l) => [l.categoria.trim(), l.descricao])));
  }

  return out;
}

function gravarCatalogo(db: DatabaseSync, descricoes: Map<string, Map<string, string>>) {
  const ins = db.prepare(
    `INSERT INTO indicadores VALUES (:id, :nome, :tema, :descricao, :unidade, :casas, :agregacao, :formula, :fonte,
     :origem, :periodicidade, :primeiro, :ultimo, :periodos, :dimensoes, :observacao, :painel)`,
  );
  const insCat = db.prepare("INSERT INTO categorias VALUES (?, ?, ?, ?, ?)");
  for (const ind of INDICADORES) {
    const c = CONSULTAS.find((x) => x.id === ind.consulta)!;
    const periodos = (db.prepare("SELECT DISTINCT periodo FROM valores WHERE indicador = ? ORDER BY periodo").all(ind.id) as Array<{ periodo: string }>).map((r) => r.periodo);
    const mensal = periodos.some((p) => p.length === 7);
    const dimensoes: string[] = [];
    for (const dim of DIMENSOES) {
      const vistos = (db.prepare(`SELECT DISTINCT ${dim} AS v FROM valores WHERE indicador = ? AND ${dim} <> 'total'`).all(ind.id) as Array<{ v: string }>).map((r) => r.v);
      if (!vistos.length) continue;
      const ordenados = ordenarValores(ind, dim, vistos);
      ordenados.forEach((v, i) => insCat.run(ind.id, dim, i + 1, v, descricoes.get(c.id)?.get(v) ?? null));
      dimensoes.push(`${dim}: ${ordenados.join(" | ")}`);
    }
    ins.run({
      id: ind.id,
      nome: ind.nome,
      tema: ind.tema,
      descricao: ind.descricao,
      unidade: ind.unidade,
      casas: ind.casas,
      agregacao: ind.agregacao,
      formula: ind.formula,
      fonte: ind.fonte,
      origem: c.origem,
      periodicidade: mensal ? "mensal" : "anual",
      primeiro: periodos[0] ?? null,
      ultimo: periodos.at(-1) ?? null,
      periodos: mensal ? `${periodos[0]} a ${periodos.at(-1)} (${periodos.length} meses)` : periodos.join(", "),
      dimensoes: dimensoes.join("\n") || null,
      observacao: ind.observacao ?? null,
      painel: ind.painel ?? null,
    });
  }
}

async function gravarMetadados(cliente: pg.Client, db: DatabaseSync) {
  const seca = (
    await cliente.query<{ ultimo: string; carga: Date | null }>(
      "SELECT max(ano_mes)::text AS ultimo, max(concluido_em) AS carga FROM meio_seco.monitor_seca_municipal_cargas WHERE status IS DISTINCT FROM 'erro'",
    )
  ).rows[0];
  const ins = db.prepare("INSERT INTO metadados VALUES (?, ?)");
  ins.run("gerado_em", new Date().toISOString());
  ins.run("fonte", "oca_db (PostgreSQL do Data Nordeste), lido só com SELECT");
  if (seca?.carga) ins.run("monitor_secas_carregado_em", new Date(seca.carga).toISOString());
  const total = db.prepare("SELECT count(*) AS n FROM valores").get() as { n: number };
  ins.run("valores", String(total.n));
  anotar(`Monitor de Secas: último mês ${seca?.ultimo ?? "?"}, carregado no banco em ${seca?.carga ? new Date(seca.carga).toISOString().slice(0, 10) : "?"}`);
  anotar(`Total: ${total.n} valores`);
}

// ---------------------------------------------------------------------------

async function main() {
  const inicio = Date.now();
  mkdirSync(path.dirname(DESTINO), { recursive: true });
  const novo = `${DESTINO}.novo`;
  const cliente = await conectar();
  const db = abrirSqlite(novo);
  try {
    const cadastro = await lerCadastro(cliente);
    gravarTerritorios(db, cadastro);
    db.exec(`CREATE INDEX membros_m ON membros (municipio);
      CREATE TEMP TABLE base (cd_mun INTEGER, periodo TEXT, ano INTEGER, mes INTEGER, sexo TEXT, cor_raca TEXT, faixa_etaria TEXT, categoria TEXT, num REAL, den REAL);
      CREATE TEMP TABLE cubo AS SELECT * FROM base WHERE 0;`);
    const nomes = cadastro.outrosNomes;
    for (const c of CONSULTAS) {
      await carregarConsulta(cliente, db, c, nomes);
      for (const ind of INDICADORES.filter((i) => i.consulta === c.id)) calcularIndicador(db, ind);
      db.exec(`DROP TABLE c_${c.id}`);
    }
    gravarNomesAlternativos(db, nomes);
    gravarCatalogo(db, await descricoesDasCategorias(cliente));
    await gravarMetadados(cliente, db);
    db.exec("DROP INDEX membros_m");
    db.exec(INDICES_E_VISOES);
    db.exec("ANALYZE");
    db.close();
    await cliente.query("ROLLBACK");
    renameSync(novo, DESTINO);
    anotar(`Tabelão gravado em ${DESTINO} em ${((Date.now() - inicio) / 1000).toFixed(0)} s.`);
    writeFileSync(path.join(path.dirname(DESTINO), "montagem.txt"), relatorio.join("\n") + "\n");
  } finally {
    await cliente.end();
  }
}

await main();
