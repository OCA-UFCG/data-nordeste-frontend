import { CircleDollarSign } from "lucide-react";

// Fora do módulo "use client": a página server também usa no estado de erro.
export const PIB_TITLE = "Produto Interno Bruto (PIB)";
export const PIB_ICON = CircleDollarSign;

// Texto do rodapé do Power BI, sem alterações (página, erro e esqueleto).
export const PIB_SOURCE =
  "Fonte dos dados: Instituto Brasileiro de Geografia e Estatística (IBGE) e Secretaria do Tesouro Nacional (STN) Finanças do Brasil (FINBRA) e Sistema de Informações Contábeis e Fiscais do Setor Público Brasileiro (SICONFI).";

// Medida "Texto Tooltip" do Power BI, no ⓘ do gráfico de participação.
export const PIB_ATIVIDADE_TOOLTIP =
  "Enquanto nenhum município estiver selecionado, o gráfico apresenta um ranking das atividades com maior Valor Adicionado Bruto (VAB). Ao selecionar um município específico, o gráfico passa a mostrar a participação da atividade de maior VAB no Produto Interno Bruto (PIB) do município selecionado.";
