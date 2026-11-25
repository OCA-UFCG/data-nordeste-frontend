/**
 * Tabelas do tabelão (dados/datane.sqlite). A descrição para o modelo, com
 * exemplos de consulta, está em ferramentas/esquema.ts; mude as duas juntas.
 */
export const ESQUEMA_SQLITE = `
CREATE TABLE metadados (chave TEXT PRIMARY KEY, valor TEXT NOT NULL);

CREATE TABLE indicadores (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  tema TEXT NOT NULL,
  descricao TEXT NOT NULL,
  unidade TEXT NOT NULL,
  casas INTEGER NOT NULL,
  agregacao TEXT NOT NULL,
  formula TEXT NOT NULL,
  fonte TEXT NOT NULL,
  origem TEXT NOT NULL,
  periodicidade TEXT NOT NULL,
  primeiro_periodo TEXT,
  ultimo_periodo TEXT,
  periodos TEXT,
  dimensoes TEXT,
  observacao TEXT,
  painel TEXT
);

CREATE TABLE categorias (
  indicador TEXT NOT NULL,
  dimensao TEXT NOT NULL,
  ordem INTEGER NOT NULL,
  valor TEXT NOT NULL,
  descricao TEXT,
  PRIMARY KEY (indicador, dimensao, valor)
);

CREATE TABLE territorios (
  codigo TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  nome_sem_acento TEXT NOT NULL,
  nomes_alternativos TEXT,
  tipo TEXT NOT NULL,
  uf TEXT,
  cd_rgint TEXT,
  nm_rgint TEXT,
  cd_rgi TEXT,
  nm_rgi TEXT,
  nordeste INTEGER,
  semiarido INTEGER,
  caatinga INTEGER,
  area_km2 REAL,
  municipios INTEGER,
  observacao TEXT
);

CREATE TABLE membros (
  territorio TEXT NOT NULL,
  municipio TEXT NOT NULL,
  PRIMARY KEY (territorio, municipio)
) WITHOUT ROWID;

CREATE TABLE valores (
  indicador TEXT NOT NULL,
  periodo TEXT NOT NULL,
  ano INTEGER NOT NULL,
  mes INTEGER,
  territorio TEXT NOT NULL,
  sexo TEXT NOT NULL DEFAULT 'total',
  cor_raca TEXT NOT NULL DEFAULT 'total',
  faixa_etaria TEXT NOT NULL DEFAULT 'total',
  categoria TEXT NOT NULL DEFAULT 'total',
  valor REAL NOT NULL,
  PRIMARY KEY (indicador, periodo, territorio, sexo, cor_raca, faixa_etaria, categoria)
) WITHOUT ROWID;
`;

/** Criados depois da carga: inserir com índice já criado é bem mais lento. */
export const INDICES_E_VISOES = `
CREATE INDEX valores_por_territorio ON valores (territorio, indicador, periodo);
CREATE INDEX membros_por_municipio ON membros (municipio);
CREATE VIEW valores_com_nomes AS
  SELECT v.*, t.nome AS nome_territorio, t.tipo AS tipo_territorio, t.uf
  FROM valores v JOIN territorios t ON t.codigo = v.territorio;
`;
