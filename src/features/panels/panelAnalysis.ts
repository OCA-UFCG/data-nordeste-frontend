// Texto do "Veja mais" de um painel (`ANALISE()` do protótipo): blocos com
// título e parágrafo, gerados a partir dos filtros, e a nota de rodapé que diz
// de quais filtros o texto saiu.
export type PanelAnalysisBlock = { title: string; text: string };

export type PanelAnalysis = { blocks: PanelAnalysisBlock[]; footnote: string };
