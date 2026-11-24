// Textos do perfil demográfico do protótipo. Ficam fora dos componentes para
// a página (servidor) e o painel (cliente) lerem a mesma redação.

// Fallback da capa: cópia do `abovePanelDescription` do Contentful.
export const PERFIL_LEAD =
  "No painel são reunidos indicadores da população residente das áreas abrangidas pelo Data Nordeste. Nele, é possível consultar o total de habitantes, a distribuição por sexo, faixa etária e cor ou raça, acompanhar a evolução da população entre os Censos de 2000, 2010 e 2022, visualizar rankings municipais e explorar mapa temático que evidencia a distribuição populacional nos diferentes territórios. Os dados podem ser filtrados por ano, área de interesse, estado e município. Essas informações permitem analisar fenômenos demográficos e subsidiar a formulação de políticas públicas voltadas para o desenvolvimento regional.";

// Fonte da imagem baixada; na página, ela fica só na seção "Fonte dos dados".
export const PERFIL_CARD_SOURCE = "Fonte: IBGE · Data Nordeste";

export const PERFIL_SAIBA_MAIS_TITLE = "Saiba mais";

export const PERFIL_SAIBA_MAIS_SUMMARY =
  "O perfil demográfico corresponde ao conjunto de características que ajudam a compreender a composição e a estrutura da população em um determinado território. Essas informações estão organizadas por faixa etária, sexo e cor ou raça, sendo esta última baseada na autodeclaração da população registrada nos Censos Demográficos do Instituto Brasileiro de Geografia e Estatística (IBGE). O conjunto desses elementos contribui para a construção de retratos populacionais que evidenciam a diversidade existente entre municípios, estados e regiões.";

export const PERFIL_SAIBA_MAIS_PARAGRAPHS: readonly string[] = [
  "Para apoiar análises territoriais mais precisas, os municípios são agrupados conforme seu porte populacional. Essa classificação permite distinguir realidades marcadas por diferentes níveis de concentração populacional, o que contribui para uma melhor compreensão da diversidade demográfica dos territórios e das particularidades presentes em cada contexto regional.",
  "Por meio dessas informações, é possível observar mudanças ocorridas ao longo do tempo e compreender aspectos que influenciam a dinâmica populacional e social das localidades. O conhecimento sobre esses dados é fundamental para a identificação de tendências populacionais e demandas sociais, bem como para subsidiar a elaboração de pesquisas, diagnósticos territoriais e políticas públicas mais alinhadas às necessidades dos territórios e ao desenvolvimento regional.",
];
