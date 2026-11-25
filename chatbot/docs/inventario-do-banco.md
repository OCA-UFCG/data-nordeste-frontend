# Inventário do oca_db para o tabelão

Feito em 24/11/2026 lendo o catálogo do Postgres (31 schemas, 388 tabelas e
views) e perfilando a view final de cada tema. "Final" = a view que o portal
usa, com as colunas de território (`cd_mun`, `ne`, `aas_21`, `semi_21`...).

## Já no tabelão

| Tema | View | Desde |
|---|---|---|
| População, densidade | `dem_demografia.final_demografia` | proposta |
| PIB | `eco_pib.vw_pib` | proposta |
| IDHM | `des_idhm.vw_idhm` | proposta |
| Analfabetismo | `edu_analfabetismo.vw_analfabetismo` | proposta |
| Mortalidade infantil | `sau_mortalidade.vw_mortalidade` | proposta |
| Vacinação | `sau_imunizacao.vw_imunizacao_anual` | proposta |
| População em situação de rua | `dem_rua.vw_pop` | proposta |
| Cisternas | `hidr_cisternas.view_cisternas_todos_anos` | proposta |
| Lixo, esgoto | `infra_destino_lixo.*`, `infra_esgotamento_sanitario.*` | proposta |
| Monitor de Secas | `meio_seco.monitor_seca_municipal` | proposta |
| Estabelecimentos de saúde | `sau_estabelecimento_de_saude.estabelecimento_saude_geral` | c12 |
| Desmatamento | `meio_desmatamento.vw_desmat_geral_municipios` (INC-19) | c12 |
| População indígena | `dem_demografia_indigena.vw_populacao_indigena_geral` | c12 |
| População quilombola | `dem_demografia_quilombola.vw_demografia_quilombola_faixas_agrupadas` | c12 |
| Nível de instrução | `edu_nivel_de_instrucao.niveis_instrucao_geral` (INC-20) | c12 |
| Área de formação | `edu_nivel_de_instrucao.vw_area_formacao_geral` | c12 |
| Alfabetização indígena e quilombola | `edu_alfabetizacao_*.vw_alfabetizacao_*` | c12 |
| Aridez (regras do painel `/demo/aridez`) | `meio_aridez.vw_aridez` | c12 |
| Ameaça de escassez hídrica (INC-21) | `hidr_escassez.vw_ameaca_publicavel` | c12 |

## Ainda fora (por dificuldade)

| Tema | View | Linhas | Anos | Formato e cuidado |
|---|---|---|---|---|
| Degradação da terra | `meio_degradacao_da_terra.vw_degradacao_terra`, `vw_ods_2021` | 4 mil | 2001, 2021 | áreas por nível de degradação; soma de área. |
| Usinas de energia | `infra_matriz_eletrica.v_usinas_sudene_completa` | 3,8 mil | ano de vigência | uma linha por usina; contagem e potência (texto, converter) por origem e combustível. |
| Unidades de conservação | `meio_ucs.vw_ucs` | 2,8 mil | ano de criação | uma linha por UC × município: a mesma UC aparece em vários municípios; somar área duplica. |
| IDH estadual (PNAD) | `des_idh.idh_geral_novo_view`, `idh_sexo_novo_view`, `idh_cor_novo_view` | 180–360 | 2012 a 2021 | só estados e regiões metropolitanas; colunas trocadas em `idh_sexo` (`agregacao` tem o nome do estado). Outro índice, não o IDHM. |
| Comércio exterior | `eco_comercio_exterior.impexp_completa` | 21 milhões | mensal | município × mês × país × produto (SH4); pré-agregar por município × ano × tipo e por país/SH2 para estados. O maior. |
| Importação | `eco_importacao.vw_importacao_completa` | 12 milhões | mensal | parece um subconjunto do anterior; conferir antes de usar. |
| CAGED | `relatorios_auto.mv_caged_municipal`, `_detalhe` | 2 mil | só o último trimestre | foto do trimestre feita para o relatório automático, sem série. |
| Bolsa Família | `des_bolsa_familia.pessoas_pbf` | 5,6 mil | só "12/2013" | Brasil todo, um mês: parece incompleto. |

Motivo de cada um ainda não ter entrado: degradação (falta saber o que é cada nível, 1 a 5); usinas (é um cadastro sem data de referência, só o ano de início); UCs (somar duplica UCs de vários municípios: precisa de contagem distinta por recorte); IDH estadual (o tabelão é montado a partir de municípios, e este índice só existe por estado); comércio exterior (tamanho; pede pré-agregação própria).

Não estão no `oca_db`: FNE (o painel nativo usa outra base, `DATA_DB_URL`).
