// Textos do painel de aridez do protótipo (aridez.html). Ficam fora dos
// componentes para a página (servidor) e o painel (cliente) lerem a mesma redação.

export const ARIDEZ_LEAD =
  "O painel de Índice de Aridez reúne dados sobre a disponibilidade hídrica e a suscetibilidade à desertificação nos territórios abrangidos pelo Data Nordeste. As informações permitem analisar a classificação climática dos municípios, a extensão das áreas suscetíveis à desertificação e sua distribuição territorial. O exame desses dados possibilita entender os padrões de disponibilidade hídrica dos territórios, identificar áreas sob maior pressão ambiental e subsidiar estratégias de convivência com a seca e de mitigação dos processos de desertificação.";

export const ARIDEZ_CARD_SOURCE =
  "Fonte: XAVIER et al. (2019) · Observatório da Caatinga e Desertificação";

// INTENTIONAL: sem "Atualizado em". O protótipo traz "14/05/2025" fixo e o
// banco não informa quando os dados foram carregados (mesma regra do PIB).
export const ARIDEZ_CARD_FOOTER = { source: ARIDEZ_CARD_SOURCE } as const;

export const ARIDEZ_MAP_TITLE = "Índice de aridez por município";

export const ARIDEZ_MAP_MOBILE_TITLE = "Aridez por município";

export const ARIDEZ_CARD_INFO = {
  classes:
    "Área do território em cada classe do índice de aridez. Quanto menor o índice, mais seco é o clima: árido, semiárido, subúmido seco e úmido, em ordem crescente de disponibilidade hídrica.",
  map: "O mapa mostra o raster do índice de aridez da década do ano escolhido (1991 usa 1990, 2001 usa 2000 e assim por diante), com as classes árido, semiárido, subúmido seco e úmido. Passe o mouse sobre um município para ver o % da sua área suscetível à desertificação (classes árido, semiárido e subúmido seco, índice abaixo de 0,65) e a posição dele no ranking da área. Aproximar o mapa ou clicar em um município filtra o painel (clicar de novo volta um nível); a legenda conta os municípios em que cada classe predomina.",
  municipios:
    "Para cada município, a divisão da sua área entre as classes do índice de aridez, em %. Passe o mouse sobre um trecho da barra para ver a área em km².",
} as const;

export const ARIDEZ_SAIBA_MAIS_TITLE = "Saiba mais sobre o Índice de Aridez";

export const ARIDEZ_SAIBA_MAIS_SUMMARY =
  "O Índice de Aridez (IA) é um indicador utilizado para avaliar o grau de disponibilidade hídrica de uma região, considerando a relação entre a quantidade de chuva e a perda de água para a atmosfera por evaporação e transpiração. Esse índice permite compreender as condições climáticas de um território e sua maior ou menor suscetibilidade à escassez de água.";

export const ARIDEZ_SAIBA_MAIS_PARAGRAPHS: readonly string[] = [
  "Quanto menor o valor do índice, mais secas tendem a ser as condições ambientais. Já valores mais elevados indicam maior disponibilidade hídrica e condições mais favoráveis à manutenção da vegetação e das atividades produtivas. Com base nessa relação, os territórios podem ser classificados em diferentes categorias climáticas: hiperárido, árido, semiárido, subúmido seco e úmido.",
  "O Índice de Aridez também é uma importante ferramenta para identificar Áreas Suscetíveis à Desertificação (ASD), fenômeno caracterizado pela degradação das terras em regiões secas. Segundo os critérios adotados pela Convenção das Nações Unidas de Combate à Desertificação (UNCCD), áreas com índice inferior a 0,65 são consideradas mais vulneráveis a esse processo, exigindo maior atenção no planejamento ambiental e na gestão dos recursos naturais.",
  "Os dados sobre o Índice permitem monitorar as condições climáticas, identificar áreas mais vulneráveis à escassez hídrica e subsidiar estratégias de adaptação às secas. Essas informações apoiam ações voltadas à conservação ambiental, ao planejamento territorial e ao desenvolvimento sustentável dos territórios.",
];
