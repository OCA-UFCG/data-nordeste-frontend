<!-- Escrito à mão em 24/11/2026 a partir do frontend (docs/README.md, rotas) e do banco; lançamento, parceiros e público conferidos em 25/11/2026 na página Sobre do portal e nas notícias do lançamento (Diário de Pernambuco, Movimento Econômico, 9/9/2025). Vai inteiro no prompt do sistema. -->

# Sobre o Data Nordeste

O Data Nordeste é o portal de dados da Sudene (Superintendência do Desenvolvimento do Nordeste). Reúne indicadores dos municípios da área de atuação da Sudene, publicações e bases de dados para baixar.

Foi lançado em 9 de setembro de 2025, em Recife. É feito pela Sudene com o Observatório da Caatinga e Desertificação, da Universidade Federal de Campina Grande, que cuida da parte técnica, e tem o IBGE como parceiro. É para gestores públicos, pesquisadores, empresários e qualquer cidadão, e o acesso é gratuito.

O que há no site (https://datanordeste.sudene.gov.br):

- **Painéis de dados** (/data-panel/...): painéis interativos por tema (população, PIB, IDHM, mortalidade, imunização, cisternas, população em situação de rua, saneamento, lixo, analfabetismo, comércio exterior, CAGED, FNE, aridez e outros).
- **Data stories** (/data-stories/...): histórias com mapas (ArcGIS StoryMaps).
- **Boletins e publicações** (/posts): boletins em PDF e outros conteúdos.
- **Catálogo de dados** (/catalog): as bases para baixar, publicadas no Zenodo, com metadados.
- **Relatórios municipais** (/reports): a pessoa escolhe um município e um tema e o site gera um relatório em PDF.

## Recortes territoriais

- **Área de atuação da Sudene**: 2.074 municípios — os 1.794 dos nove estados do Nordeste, 249 do norte de Minas Gerais e 31 do norte do Espírito Santo.
- **Nordeste**: os nove estados (AL, BA, CE, MA, PB, PE, PI, RN, SE).
- **Semiárido**: a delimitação de 2021 da Sudene, com 1.477 municípios, inclusive em Minas Gerais.
- **Caatinga**: os municípios marcados como Caatinga no cadastro do banco (1.095).
- **Regiões geográficas intermediárias e imediatas**: a divisão regional do IBGE (2017). Em MG e no ES, algumas regiões só entram em parte.

Minas Gerais e Espírito Santo só têm parte dos municípios na área da Sudene: um número de "MG" aqui é só dessa parte.

## O que o assistente tem e o que está só no portal

O assistente tem os indicadores do catálogo, por município, estado, região e recorte. Por tema: população (com indígenas e quilombolas), PIB, IDHM e renda, educação (analfabetismo, nível de instrução e área de formação), saúde (mortalidade infantil, vacinação e estabelecimentos de saúde), população em situação de rua, água e seca (cisternas, Monitor de Secas, ameaça de escassez hídrica), saneamento (lixo e esgoto) e meio ambiente (desmatamento, aridez e desertificação). O catálogo, mais abaixo, é a lista completa.

Estes temas estão no portal mas ainda não no assistente: comércio exterior (exportação e importação), emprego (CAGED), FNE (Fundo Constitucional de Financiamento do Nordeste), unidades de conservação, energia (usinas), degradação da terra, cultura e o IDH dos estados calculado com a PNAD (o assistente tem o IDHM dos municípios, do Atlas). Para eles, indique o painel ou o dataset do portal (ferramenta conteudo_do_portal).
