# Inconsistências encontradas no banco e no portal

Levantadas entre 23 e 24/11/2026, ao montar o tabelão do assistente a partir
do `oca_db` do beta (PostgreSQL 18, na VM do beta), só com leitura. Cada item diz
o que foi visto, como medir de novo e o que o tabelão faz a respeito. O código
cita os itens como `INC-n`.

Nada aqui impede o chat: o tabelão contorna tudo. Mas cada contorno é uma
regra que só existe neste repositório, e alguns itens também afetam o portal
(views lentas, cards errados). Vale passar a lista ao time de dados.

## Resumo para o time de dados, por prioridade

| Prioridade | Item | Por quê |
|---|---|---|
| Alta | Cards do portal com número ou rótulo errado (seção "Cards do portal") | Está no ar, na página inicial dos temas |
| Alta | INC-1 linha "Brasil" misturada aos municípios | Qualquer soma da view conta o Brasil junto |
| Alta | INC-3 falta de dado vira 0 | 0 é um valor; quem lê não sabe que é ausência |
| Alta | INC-12 views lentas (até mais de 30 s) | O portal e o relatório leem essas views |
| Média | INC-5 imunização de 2026 incoerente | Percentuais do ano parcial passam dos anos fechados |
| Média | INC-8 PIB 2022–2023 sem setores | Painel e relatório ficam sem o dado |
| Média | INC-13 aridez sem legenda e com áreas que não fecham | Não dá para usar o dado sem saber o que é cada classe |
| Média | INC-6 duas unidades na mesma view do PIB | Erro de mil vezes fácil de cometer |
| Média | INC-18 população de rua: subgrupos maiores que o total | Quem usar as colunas de crianças, idosos ou PCD (painel, relatório) mostra números que não fecham com o total |
| Baixa | INC-2, INC-4, INC-10, INC-14 nomes e tipos divergentes | Obrigam cast e alias em todo join |
| Baixa | INC-15, INC-16 documentação e objetos velhos | Custo de quem chega ao banco |

## Itens

### INC-1 — Linha "Brasil" dentro da view de mortalidade

`sau_mortalidade.vw_mortalidade` tem, além dos 2.074 municípios, uma linha com
`cd_mun = 0`, `nm_mun = 'Brasil'` e `ne` nulo, em todos os anos. Somar a view
inteira soma o Brasil aos municípios. No experimento da proposta, o Haiku sem
catálogo calculou a mortalidade do Nordeste com essa linha (12,76 em vez de
13,54).

- Medir: `SELECT ano, count(*) FROM sau_mortalidade.vw_mortalidade WHERE cd_mun = 0 GROUP BY ano;`
- No tabelão: a linha vira o território `brasil` e fica fora das somas.
- Sugestão: separar o total do país numa view própria, ou marcar a linha com
  uma coluna `nivel`.

### INC-2 — `cd_mun` com tipos diferentes

O código IBGE aparece como `integer`, `character(7)` (`eco_pib.vw_pib`),
`varchar` (`meio_seco.monitor_seca_municipal`, `carac_mun.novos_nomes`),
`bigint` (`infra_destino_lixo.destinacao_lixo_geral_view`) e `text`. Todo join
entre temas precisa de cast, e o cast desliga o índice (ver INC-12).

- No tabelão: tudo vira texto de 7 dígitos.
- Sugestão: padronizar `cd_mun integer` (ou `char(7)`) nas tabelas finais.

### INC-3 — Falta de dado vira 0

- Mortalidade: município sem registro aparece com `nascidos = 0` e
  `obitos_infantis = 0`, sem distinguir de "não houve".
- Imunização: em 2026, 21 municípios têm `populacao = 0`; a
  `cobertura_vacinal` deles sai 0 mesmo com doses aplicadas (ex.: Ichu–BA,
  8 doses de BCG, cobertura 0).
- No tabelão: razão com denominador 0 não tem valor (linha ausente) e fica fora
  das somas dos recortes.
- Sugestão: deixar nulo onde não há dado (evitar `COALESCE(..., 0)` nas views).

### INC-4 — Nomes de município divergentes

| Código | `carac_mun.novos_nomes` (e 9 views) | `carac_mun.auxiliar` |
|---|---|---|
| 2400208 | Assú | Açu |
| 2401206 | Arez | Arês |
| 2802601 | Graccho Cardoso | Gracho Cardoso |

As colunas de recorte (UF, Nordeste, Semiárido, Caatinga, área da Sudene,
regiões) bateram nas 10 views usadas: só os nomes divergem.

- No tabelão: o nome é o de `novos_nomes` (o que as views mostram) e o outro
  fica em `nomes_alternativos`, para a busca achar os dois.

### INC-5 — Imunização: ano parcial incoerente e cadastro de vacinas irregular

- 2026 é o ano em curso, mas várias coberturas de 2026 passam as de anos
  fechados: Penta no Nordeste, 103,97% em 2026 contra 88,39% em 2025; Pólio
  injetável na área da Sudene, 104,25% em 2026. A Influenza de 2026 está em 8,9%. O
  numerador e o denominador do ano parcial não parecem ser do mesmo período.
- A cobertura passa de 100% em cerca de 40% das linhas (máximo de 1.400%).
  Parte é esperada (vacinação de não residentes), mas o volume pede uma nota.
- A lista de vacinas muda por ano (Pólio oral só em 2023–2024; Pólio injetável
  de reforço e Influenza a partir de 2024–2025). `doenca_prevenida` está vazia
  para a Pólio oral bivalente; `meta_cobertura` é nula para Hepatite B
  (≤ 1 dia e ≤ 2 dias).
- A média simples das coberturas municipais difere muito da cobertura agregada
  (Hepatite A, 2023: 102,46% de média contra 88,24% agregada). O tabelão usa a
  agregada (doses somadas ÷ público somado).
- No tabelão: o catálogo e a ferramenta avisam sobre o ano em curso e sobre
  cobertura acima de 100%.

### INC-6 — Duas unidades na mesma view do PIB

Em `eco_pib.vw_pib`, `pib` e `vab_*` estão em R$ mil e `pib_total` em R$.
`obs_sudene` usa o texto `'NA'` para vazio (29.022 linhas) e `'Sim'` em 14.

- No tabelão: tudo convertido para R$.

### INC-7 — PIB per capita de 2022 e 2023 com a mesma população

A população implícita (`pib_total / pib_per_capita`) é a do Censo 2022 nos dois
anos (Campina Grande: 419.379 em 2022 e 2023). Pode ser a escolha do IBGE ou
do pipeline; vale confirmar.

### INC-8 — PIB de 2022 e 2023 sem valor por setor

`vab_agropecuaria`, `vab_industria`, `vab_servicos`, `vab_adm_publica`,
`vab_total`, `impostos_liquidos` e `atividade_*` estão nulos em 2022 e 2023
para os 2.074 municípios.

- No tabelão: os indicadores de setor vão de 2010 a 2021, e o catálogo diz isso.

### INC-9 — Centros POP de 2022 zerados

`dem_rua.vw_pop.num_centro_pop` é 0 em todos os municípios em 2022 (68 em
2023). É falta de dado, não ausência de centros.

- No tabelão: 2022 fica sem valor.

### INC-10 — Colunas de recorte com nomes diferentes

- Área da Sudene: `aas_21` na maioria das views, `ass_21` em `des_idhm.vw_idhm`,
  `sau_mortalidade.vw_mortalidade` e nos cadastros.
- Caatinga: `caat_24` na maioria, `caat_25` em `infra_destino_lixo`,
  `carac_mun.auxiliar` e `meio_seco.vw_monitor_seca`. O conteúdo é igual hoje
  (0 diferenças), mas o nome sugere duas delimitações. O banco não documenta se
  a marca é bioma predominante ou qualquer parte do município. A área do
  recorte Caatinga no tabelão (857.824 km²) é a soma das áreas dos municípios
  marcados, não a área do bioma.

### INC-11 — Monitor de Secas: classes que não cobrem a área do município

Em 9.170 de 165.920 município-mês (5,5%), a soma de `area_classe_km2` fica
abaixo de `area_municipio_km2` (mínimo de 79,5%). A tabela só tem linha para as
classes presentes.

- Medir: ver `meio_seco.monitor_seca_municipal`, agrupando por `cd_mun, ano_mes`.
- No tabelão: a sobra vira a categoria "Sem informação" e as classes somam 100%.

### INC-12 — Views lentas

| Objeto | Tempo | Causa provável |
|---|---|---|
| `meio_seco.vw_monitor_seca` | > 30 s | junta por `d.cd_mun::text = a.cd_mun::varchar::text` e por `btrim()` em `novos_nomes`: os casts impedem o índice |
| `sau_estabelecimento_de_saude.estabelecimento_saude_geral` | > 30 s | não investigado |
| `relatorios_auto.mv_comex_municipal_mensal` filtrada por `co_mun` | > 30 s | matview sem índice em `co_mun` |
| `edu_analfabetismo.vw_analfabetismo` | ~14 s sem filtro | view sobre cubo grande |
| `edu_nivel_de_instrucao.niveis_instrucao_geral` | ~12 s | não investigado |

- No tabelão: o Monitor de Secas é lido da tabela, não da view (19 s para a
  grade toda); as outras são lidas uma vez na montagem.

### INC-13 — Aridez sem legenda e com áreas que não fecham

`meio_aridez.vw_aridez` tem a classe em `dn_uni` (valores 2 a 5 e nulo) sem
tabela de legenda; a soma das áreas das classes difere da área do município em
1.462 de 2.073 municípios (de 91% a 104%), e há um município a menos que nos
outros temas. A área vem de texto com vírgula convertido dentro da view.

- No tabelão: aridez ficou fora da v1 até alguém do time dizer o que é cada
  classe.

### INC-14 — Cadastros de municípios com tamanhos diferentes

`"Visualização".municipios_sudene` tem 1.834 linhas; `carac_mun.auxiliar`
(com `aas_21 = 'Sim'`), `meio_aridez.auxiliar`,
`infra_matriz_eletrica.municipios_sudene` e
`eco_importacao.regionalizacao_municipal` têm 2.074. O schema "Visualização"
tem acento e maiúscula, o que obriga aspas em todo SQL.

### INC-15 — Documentação

Só 3 de 7.979 colunas têm `COMMENT`. As planilhas `metadados_*.xlsx` publicadas
no Zenodo descrevem as bases, mas não batem com os nomes de colunas do banco.

### INC-16 — Objetos de backup e teste no banco de produção do beta

15 objetos com `backup`, `temp`, `old` ou `teste` no nome (ex.:
`carac_mun.caracteristicas_municipais_backup_biomas`,
`meio_seco.monitor_seca_municipal_backup_sem_geom`).

### INC-17 — Texto cru na camada bruta

Nas tabelas brutas (não nas views finais): números em formato brasileiro como
texto (`' 20.000,00 '`), `'-'` como vazio, datas em dois formatos e o caminho
de um arquivo local (`C:\Users\...`) numa coluna. As views finais que o tabelão
lê já vêm tipadas.

### INC-18 — População de rua: subgrupos maiores que o total

Achado em 24/11/2026 por uma pergunta de teste ("quantas crianças em situação de
rua há em Fortaleza?"). Em `dem_rua.vw_pop`, as colunas de subgrupo não são um
subconjunto de `pessoas`:

- `criancas_adolescentes_situacao_rua`: o Nordeste soma 1.561 em 2022, 0 em
  2023, 0 em 2024, 500 em 2025 e 0 em 2026. Nos anos com valor, muitos
  municípios têm mais crianças do que pessoas em situação de rua: 239 em 2022 e
  110 em 2025. Exemplo de 2025: Cândido Sales–BA tem 35 crianças e 0 pessoas.
  As capitais ficam com 0 a 2 (Fortaleza tem 1 criança para 11.362 pessoas).
- `idosos` e `pcd`: o mesmo problema em escala menor. O subgrupo passa do total
  em 13 a 33 municípios por ano nos idosos e em 39 a 80 nas pessoas com
  deficiência.

Hipóteses para o time de dados confirmar: a coluna de crianças conta outra
coisa (crianças em família de referência em situação de rua?), e os anos
zerados são falta de dado (INC-3).

- Medir: no tabelão, junte `criancas_situacao_rua` com `pessoas_situacao_rua`
  por território e ano e conte onde o subgrupo é maior.
- No tabelão: os três indicadores ficam, com ressalva no catálogo. A saída da
  consulta avisa que crianças "não é confiável" e pede cautela com idosos e PCD
  em município (`notasDeRessalvas` em `src/ferramentas/notas.ts`).

## Cards do portal (Contentful)

Os cards de indicador são digitados à mão no Contentful. Comparados com o banco
em 24/11/2026 (`npm run conferir`, seção "Cards do portal"):

| Card | No site | No banco | Correção sugerida |
|---|---|---|---|
| PIB per capita (Nordeste) | R$ 27,68 Mi | R$ 27.681,97 (2023) | R$ 27,68 mil |
| População em situação de rua (Nordeste) | 57,05 milhões | 57.836 (2026, parcial); 54.909 (2025) | 54.909 pessoas (2025) ou 57.836 com "2026, parcial" |
| Lixo coletado (Nordeste) | 74,6% | 83,30% (2022) | 83,3% |
| Descarte inapropriado de lixo (Nordeste) | 74,6% (igual ao anterior) | 16,70% (2022, complemento da coleta) | 16,7%, ou definir o que é "inapropriado" |
| População feminina (Nordeste) | 30.598.265 | 28.240.713 no Nordeste (30.598.265 é a área da Sudene) | trocar o número ou o rótulo |
| População masculina (Nordeste) | 28.719.654 | 26.417.802 no Nordeste (28.719.654 é a área da Sudene) | trocar o número ou o rótulo |
| Cisterna para irrigação | 161.124 | 162.612 (2026); a categoria é "produção" (irrigação e criação de animais) | 162.612, rótulo "para produção" |
| Condições sanitárias (Nordeste) | 1,50% | não está claro o que mede; o mais próximo é "sem banheiro nem sanitário", 1,52% (2022) | dizer o que mede |
| Doses aplicadas (Nordeste) | 17 milhões | 16,57 milhões em 2025 (todas as vacinas) | arredondamento aceitável; dizer o ano |
| População Indígena (Nordeste) | 529.116, link para /data-panel/demografia_indigena | o link dá 404 no site; no banco, cor ou raça indígena = 327.725 (2022) | corrigir o link; o número do card é outra definição (ver abaixo) |

Batem com o banco: população residente (54.658.515), PIB (R$ 1,51 tri),
analfabetismo (14,21%), mortalidade infantil (13,11), nascidos vivos (679 mil),
cisternas (1.278.849), cisternas para consumo (1.108.343), cisternas escolares
(7.894), domicílios conectados à rede (40,2%). Outros: o card "Condições
sanitárias" aponta para `/data-panel/saneamento?` (com `?` no fim) e há um
erro de digitação "PIB perPIB per capita" num texto do tema Economia.

A população indígena do card (529.116) parece ser a contagem do Censo 2022 que
inclui quem se considera indígena além da cor ou raça declarada; a tabela de
demografia do banco tem só a cor ou raça (327.725). Não é erro, mas o
assistente precisa explicar a diferença se alguém comparar.

### INC-19 — Desmatamento: períodos de vários anos repetidos em cada ano

Achado em 24/11/2026, ao trazer o desmatamento para o tabelão. Em
`meio_desmatamento.vw_desmat_geral_municipios` (e já nas tabelas
`desmat_caat_municipios_final` e `acumulado_caat_ano_municipio`), a Caatinga
tem o mesmo total em 2001–2004 (12.186,4 km² em cada ano), 2005–2006,
2007–2008, 2009–2010, 2012–2013, 2015–2016; a Mata Atlântica repete nos mesmos
blocos. Parece o PRODES dos primeiros anos, que mediu períodos de 2 a 4 anos,
gravado repetido em cada ano do período. A tabela "acumulado" tem os mesmos
números da anual, então o nome não descreve o conteúdo.

Somar anos (ex.: "quanto foi desmatado de 2001 a 2010?") conta o mesmo período
várias vezes. 2025 só tem Cerrado e Amazônia de 517 municípios.

- Medir: `SELECT ano, SUM(desmat_caat_km2) FROM meio_desmatamento.vw_desmat_geral_municipios GROUP BY 1 ORDER BY 1`.
- No tabelão: o indicador `desmatamento` vai até 2024 e o catálogo avisa que
  anos seguidos com o mesmo valor são um período só.
- Para o time de dados: guardar o período (ano inicial e final) em vez de
  repetir, e conferir o nome da tabela "acumulado".

### INC-20 — Nível de instrução de 2000: sexo e cor ou raça em linhas separadas

Em `edu_nivel_de_instrucao.niveis_instrucao_geral`, 2010 e 2022 cruzam sexo ×
cor ou raça × faixa etária, mas 2000 traz dois blocos: linhas com sexo e cor
vazia, e linhas com cor e sexo vazio. Somar tudo de 2000 dobra o total (os dois
blocos somam ~23,3 milhões de pessoas de 25 anos ou mais cada). 2022 não tem a
cor "Sem declaração".

- Medir: `SELECT ano, sexo IS NULL, cor_ou_raca IS NULL, count(*) FROM edu_nivel_de_instrucao.niveis_instrucao_geral GROUP BY 1,2,3`.
- No tabelão: só 2010 e 2022. Trazer 2000 pede dois indicadores (um por sexo,
  outro por cor) ou uma marcação do recorte.

### INC-21 — Escassez hídrica: salto entre o cenário atual e 2030

Em `hidr_escassez.vw_ameaca_publicavel`, o cenário atual (2020) não tem nenhum
município nas classes alta ou muito alta (1.682 de 2.074 na média), mas em 2030
cerca de 90% já estão em alta ou muito alta, nos dois cenários. Campina Grande
vai de 0,50 para 0,84 em dez anos. Pode ser o estudo (projeção climática), mas
também pode ser uma mudança de método entre o atual e as projeções. A fonte
original não está no banco (sem comentário na tabela nem na view).

- No tabelão: entra como `indice_ameaca_escassez_hidrica`, só municipal, com a
  fonte "a confirmar" e o aviso de que 2030 e 2050 são projeções.
- Para o time de dados: qual é o estudo, e se o atual e as projeções usam a
  mesma escala.
