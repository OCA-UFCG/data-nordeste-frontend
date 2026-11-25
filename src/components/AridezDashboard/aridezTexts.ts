// Textos do painel de aridez do protótipo (aridez.html). Ficam fora dos
// componentes para a página (servidor) e o painel (cliente) lerem a mesma redação.

// Fallback da capa: cópia do `abovePanelDescription` do Contentful.
export const ARIDEZ_LEAD =
  "O painel de Índice de Aridez reúne dados sobre a disponibilidade hídrica e a suscetibilidade à desertificação nos territórios abrangidos pelo Data Nordeste. As informações permitem analisar a classificação climática dos municípios, a extensão das áreas suscetíveis à desertificação e sua distribuição territorial. O exame desses dados possibilita entender os padrões de disponibilidade hídrica dos territórios, identificar áreas sob maior pressão ambiental e subsidiar estratégias de convivência com a seca e de mitigação dos processos de desertificação.";

// Fonte da imagem baixada; na página, ela fica só na seção "Fonte dos dados".
export const ARIDEZ_CARD_SOURCE =
  "Fonte: XAVIER et al. (2019) · Observatório da Caatinga e Desertificação";

export const ARIDEZ_MAP_TITLE = "Índice de aridez";

export const ARIDEZ_MAP_MOBILE_TITLE = "Índice de aridez";

export const ARIDEZ_CARD_INFO = {
  classes:
    "Área do território em cada classe do índice de aridez. Quanto menor o índice, mais seco é o clima: árido, semiárido, subúmido seco e úmido, em ordem crescente de disponibilidade hídrica.",
  map: "O mapa mostra o raster do índice de aridez da década do ano escolhido (1991 usa 1990, 2001 usa 2000 e assim por diante), com as classes árido, semiárido, subúmido seco e úmido. Passe o mouse sobre um estado (ou, com um estado escolhido, sobre um município) para ver o % da sua área na área de interesse que é suscetível à desertificação (classes árido, semiárido e subúmido seco, índice abaixo de 0,65) e a posição dele no ranking da área. Aproximar o mapa ou clicar nele filtra o painel: o primeiro clique escolhe o estado e o seguinte, um município desse estado (clicar de novo no município escolhido volta ao estado, e clicar fora do estado escolhido volta à área); a legenda conta os municípios em que cada classe predomina.",
  municipios:
    "Para cada município, a divisão da sua área entre as classes do índice de aridez, em %. Passe o mouse sobre um trecho da barra para ver a área em km².",
} as const;

// Definição do índice (texto do revisor, UNCCD), mostrada no ⓘ dos três cards.
// Mantida palavra por palavra: é a redação aprovada, não um resumo.
export const ARIDEZ_INDEX_DEFINITION: {
  intro: readonly string[];
  classes: readonly string[];
  outro: readonly string[];
} = {
  intro: [
    "Índice de Aridez (IA) é um indicador climático que mensura a relação entre precipitação e evaporação potencial em uma região específica, variando de 0 a 1.",
    "Valores próximos de 0 indicam regiões muito secas, onde a evapotranspiração potencial é muito superior à precipitação.",
    "Valores próximos de 1 indicam regiões mais úmidas, onde a precipitação se aproxima da demanda evaporativa da atmosfera.",
    "De acordo com os critérios estabelecidos pela Convenção das Nações Unidas de Combate à Desertificação (UNCCD), as classificações baseadas no IA são as seguintes:",
  ],
  classes: [
    "Hiperárido: IA abaixo de 0,05;",
    "Árido: IA entre 0,05 e 0,20;",
    "Semiárido: IA entre 0,20 e 0,50;",
    "Subúmido seco: IA entre 0,50 e 0,65; e",
    "Úmido: IA superior a 0,65.",
  ],
  outro: [
    "As áreas suscetíveis à desertificação (ASD) ocorrem quando o IA é inferior a 0,65.",
    "Evapotranspiração potencial (ETP) é a quantidade máxima de água que poderia ser transferida da superfície terrestre para a atmosfera por evaporação e transpiração, se houver água disponível em quantidade ilimitada no solo.",
    'Obs.: Os campos com valor "sem dados" se referem majoritariamente à regiões costeiras, onde a cobertura da terra predominante é água, de modo que a classificação de cobertura da vegetação é afetada.',
  ],
};

export const ARIDEZ_SAIBA_MAIS_TITLE = "Saiba mais";

export const ARIDEZ_SAIBA_MAIS_SUMMARY =
  "O Índice de Aridez (IA) é um indicador utilizado para avaliar o grau de disponibilidade hídrica de uma região, considerando a relação entre a quantidade de chuva e a perda de água para a atmosfera por evaporação e transpiração. Esse índice permite compreender as condições climáticas de um território e sua maior ou menor suscetibilidade à escassez de água.";

export const ARIDEZ_SAIBA_MAIS_PARAGRAPHS: readonly string[] = [
  "Quanto menor o valor do índice, mais secas tendem a ser as condições ambientais. Já valores mais elevados indicam maior disponibilidade hídrica e condições mais favoráveis à manutenção da vegetação e das atividades produtivas. Com base nessa relação, os territórios podem ser classificados em diferentes categorias climáticas: hiperárido, árido, semiárido, subúmido seco e úmido.",
  "O Índice de Aridez também é uma importante ferramenta para identificar Áreas Suscetíveis à Desertificação (ASD), fenômeno caracterizado pela degradação das terras em regiões secas. Segundo os critérios adotados pela Convenção das Nações Unidas de Combate à Desertificação (UNCCD), áreas com índice inferior a 0,65 são consideradas mais vulneráveis a esse processo, exigindo maior atenção no planejamento ambiental e na gestão dos recursos naturais.",
  "Os dados sobre o Índice permitem monitorar as condições climáticas, identificar áreas mais vulneráveis à escassez hídrica e subsidiar estratégias de adaptação às secas. Essas informações apoiam ações voltadas à conservação ambiental, ao planejamento territorial e ao desenvolvimento sustentável dos territórios.",
];
