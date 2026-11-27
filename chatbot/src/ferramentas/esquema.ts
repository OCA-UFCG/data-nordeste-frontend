/**
 * O tabelão como o modelo o vê: vai na descrição de consultar_sql. Os
 * exemplos são consultas reais, conferidas contra o tabelão; quando mudar o
 * esquema (src/tabelao/esquema.ts), mude aqui também.
 */
export const ESQUEMA = `Banco SQLite só leitura (os dados do assistente do Data Nordeste). Tabelas:
- valores(indicador, periodo, ano, mes, territorio, sexo, cor_raca, faixa_etaria, categoria, valor): formato longo, já calculado para municípios, estados, regiões e recortes.
    periodo: 'AAAA' (anual) ou 'AAAA-MM' (mensal, só o Monitor de Secas).
    sexo, cor_raca, faixa_etaria, categoria: 'total' quando não há recorte. Para o número total, filtre 'total' em todas as dimensões que o indicador tem (o catálogo diz quais). Nunca some linhas de recortes: cada recorte já está calculado, inclusive os cruzados (ex.: mulheres pretas de 60 anos ou mais).
    categoria sem 'total' (vacina, classe de seca, destino do lixo, tipo de esgoto, setor): cada categoria é um item; filtre uma ou mostre todas.
    Linha ausente = sem dado para aquele território e período.
- territorios(codigo, nome, nome_sem_acento, nomes_alternativos, tipo, uf, cd_rgint, nm_rgint, cd_rgi, nm_rgi, nordeste, semiarido, caatinga, area_km2, municipios, observacao)
    codigo: IBGE de 7 dígitos (município); sigla MAIÚSCULA dos 9 estados do Nordeste ('PB'); 'MG_SUDENE' e 'ES_SUDENE' (só a parte de MG e do ES na área da Sudene, não o estado inteiro); 'nordeste'; 'area_sudene' (área de atuação da Sudene, 2.074 municípios); 'semiarido'; 'caatinga'; 'rgint_<cd_rgint>' e 'rgi_<cd_rgi>' (regiões geográficas intermediárias e imediatas do IBGE); 'brasil' (só mortalidade, nascidos e óbitos infantis).
    tipo: 'municipio' | 'estado' | 'estado_parcial' | 'recorte' | 'regiao_intermediaria' | 'regiao_imediata' | 'pais'.
    nordeste, semiarido, caatinga: 1 ou 0 (só municípios). municipios: quantos municípios o recorte tem. area_km2: soma das áreas dos municípios.
- indicadores(id, nome, tema, descricao, unidade, casas, agregacao, formula, fonte, origem, periodicidade, primeiro_periodo, ultimo_periodo, periodos, dimensoes, observacao, painel): o catálogo (já está no prompt).
- categorias(indicador, dimensao, ordem, valor, descricao): os valores possíveis de cada recorte (a descrição da vacina traz público-alvo e meta).
- valores_com_nomes: valores com nome_territorio, tipo_territorio e uf.

Regras:
- Estados, regiões e recortes já têm valor próprio em valores, calculado com a regra certa (soma, ou razão das somas para taxas). Use esse valor; nunca some nem tire média de municípios para chegar nele.
- A tabela valores mistura municípios e recortes: para ranking, contagem ou mapa de municípios, junte com territorios e filtre t.tipo = 'municipio'; para comparar estados, t.tipo = 'estado'.
- Indicador "só por município" (IDHM, Gini, renda per capita) não tem valor de estado ou recorte.
- Contas (diferença, variação, percentual, média) vão na consulta; não faça de cabeça.
- Desempenho: a chave começa por (indicador, periodo, territorio) e há índice em (territorio, indicador, periodo). Filtre sempre por indicador.

Exemplos:
1) Um valor (população de Campina Grande–PB, 2022; total em todas as dimensões):
   SELECT valor FROM valores WHERE indicador='populacao' AND periodo='2022' AND territorio='2504009' AND sexo='total' AND cor_raca='total' AND faixa_etaria='total';
2) Série com gráfico (grafico = {tipo:'serie', titulo:'Mortalidade infantil na Paraíba', unidade:'por mil nascidos vivos'}):
   SELECT periodo AS rotulo, valor FROM valores WHERE indicador='mortalidade_infantil' AND territorio='PB' ORDER BY periodo;
3) Ranking de municípios com gráfico (grafico = {tipo:'ranking', titulo:'Maiores PIB per capita do Semiárido, 2023', unidade:'R$'}):
   SELECT t.nome || '–' || t.uf AS rotulo, v.valor FROM valores v JOIN territorios t ON t.codigo=v.territorio
   WHERE v.indicador='pib_per_capita' AND v.periodo='2023' AND t.tipo='municipio' AND t.semiarido=1 ORDER BY v.valor DESC LIMIT 10;
4) Estados comparados (ranking):
   SELECT t.nome AS rotulo, v.valor FROM valores v JOIN territorios t ON t.codigo=v.territorio
   WHERE v.indicador='taxa_analfabetismo' AND v.periodo='2022' AND t.tipo='estado' AND v.sexo='total' AND v.cor_raca='total' AND v.faixa_etaria='total' ORDER BY v.valor DESC;
5) Recortes cruzados (taxa de analfabetismo de mulheres pretas de 60 anos ou mais no Nordeste):
   SELECT valor FROM valores WHERE indicador='taxa_analfabetismo' AND periodo='2022' AND territorio='nordeste' AND sexo='Mulheres' AND cor_raca='Preta' AND faixa_etaria='60 anos ou mais';
6) Categorias (classes de seca de um município num mês):
   SELECT categoria, valor FROM valores WHERE indicador='monitor_secas' AND periodo='2026-08' AND territorio='2504009' AND valor > 0 ORDER BY valor DESC;
7) Mapa (grafico = {tipo:'mapa', titulo:'Área em seca moderada ou pior na Paraíba, agosto de 2026', unidade:'% da área'}): codigo e valor, uma linha por município, sem LIMIT:
   SELECT t.codigo, v.valor FROM valores v JOIN territorios t ON t.codigo=v.territorio
   WHERE v.indicador='area_seca_moderada_ou_pior' AND v.periodo='2026-08' AND t.tipo='municipio' AND t.uf='PB';
8) Contar municípios (abaixo da meta de 95% na tríplice viral, Ceará, 2025):
   SELECT COUNT(*) AS abaixo, (SELECT COUNT(*) FROM territorios WHERE tipo='municipio' AND uf='CE') AS total FROM valores v JOIN territorios t ON t.codigo=v.territorio
   WHERE v.indicador='cobertura_vacinal' AND v.periodo='2025' AND v.categoria='Tríplice Viral - 1° Dose' AND t.tipo='municipio' AND t.uf='CE' AND v.valor < 95;
9) Variação entre dois anos, calculada na consulta:
   SELECT a.valor AS em_2010, b.valor AS em_2022, b.valor - a.valor AS diferenca FROM valores a JOIN valores b
   ON b.indicador=a.indicador AND b.territorio=a.territorio AND b.sexo=a.sexo AND b.cor_raca=a.cor_raca AND b.faixa_etaria=a.faixa_etaria AND b.categoria=a.categoria
   WHERE a.indicador='esgoto_rede_geral' AND a.territorio='nordeste' AND a.periodo='2010' AND b.periodo='2022';
10) Participação de um grupo (percentual da população parda na Bahia, 2022):
   SELECT 100.0 * SUM(CASE WHEN cor_raca='Parda' THEN valor END) / SUM(CASE WHEN cor_raca='total' AND sexo='total' THEN valor END) AS pct_parda
   FROM valores WHERE indicador='populacao' AND periodo='2022' AND territorio='BA' AND faixa_etaria='total';
11) Dois indicadores lado a lado:
   SELECT t.nome, MAX(CASE WHEN v.indicador='idhm' THEN v.valor END) AS idhm, MAX(CASE WHEN v.indicador='indice_gini' THEN v.valor END) AS gini
   FROM valores v JOIN territorios t ON t.codigo=v.territorio WHERE v.indicador IN ('idhm','indice_gini') AND v.periodo='2010' AND t.tipo='municipio' AND t.uf='PB'
   GROUP BY t.codigo ORDER BY idhm DESC LIMIT 5;
12) Posição no grupo ("está entre os piores?"): conte maiores e menores na consulta.
   SELECT SUM(v.valor > x.valor) AS com_valor_maior, SUM(v.valor < x.valor) AS com_valor_menor, COUNT(*) AS total, x.valor FROM valores v JOIN territorios t ON t.codigo=v.territorio,
   (SELECT valor FROM valores WHERE indicador='mortalidade_infantil' AND periodo='2025' AND territorio='2504009') x
   WHERE v.indicador='mortalidade_infantil' AND v.periodo='2025' AND t.tipo='municipio' AND t.uf='PB';
13) Municípios de uma região: territorios com cd_rgint ou cd_rgi; o valor da região inteira é o território 'rgint_2502'.`;
