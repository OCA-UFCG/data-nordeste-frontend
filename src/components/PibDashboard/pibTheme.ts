import { CircleDollarSign } from "lucide-react";
import type { ReportData } from "@/utils/interfaces";
import { plainTextToRichText } from "@/utils/richText";

// Fora do módulo "use client": a página server também usa no estado de erro.
export const PIB_TITLE = "Produto Interno Bruto (PIB)";
export const PIB_ICON = CircleDollarSign;

// Medida "Texto Tooltip" do Power BI, no ⓘ do gráfico de participação.
export const PIB_ATIVIDADE_TOOLTIP =
  "Enquanto nenhum município estiver selecionado, o gráfico apresenta um ranking das atividades com maior Valor Adicionado Bruto (VAB). Ao selecionar um município específico, o gráfico passa a mostrar a participação da atividade de maior VAB no Produto Interno Bruto (PIB) do município selecionado.";

// Cópia da entrada "pib" do Contentful (painel em /data-panel/pib), lida em
// 28/10/2026. Atualizar à mão se o texto mudar lá.
export const PIB_PANEL_TEXTS: ReportData = {
  title: "pib",
  source: "",
  macroTheme: "Economia e Renda",
  date: "2026-02-25T00:00-03:00",
  abovePanelDescription:
    "Os dados reunidos neste painel permitem explorar diferentes indicadores da atividade econômica dos estados e municípios que compõem as áreas de abrangência do DATA NE. As informações incluem o Produto Interno Bruto (PIB) total e per capita desses territórios, o total de impostos, o Valor Adicionado Bruto (VAB) por setor e as atividades econômicas que mais têm participação no PIB. Tais conteúdos podem subsidiar decisões relacionadas ao planejamento econômico, à definição de prioridades de investimento, ao fortalecimento de setores estratégicos e à redução das desigualdades entre os territórios.",
  descriptionTitle: "Saiba mais",
  description: plainTextToRichText(
    [
      "O Produto Interno Bruto (PIB) é um indicador que representa a riqueza gerada em um território a partir da produção de bens e serviços em determinado período. Sua análise permite acompanhar a evolução econômica dos estados e municípios, identificar diferenças regionais e compreender como as atividades produtivas contribuem para o desenvolvimento local.",
      "Além do valor total produzido, o painel apresenta o PIB per capita, que relaciona a riqueza gerada ao número de habitantes, e o Valor Adicionado Bruto (VAB), indicador que mostra a contribuição dos diferentes setores econômicos, para a formação do PIB. A comparação entre esses setores permite identificar quais atividades exercem maior influência sobre a economia local e como essa estrutura produtiva se transforma ao longo do tempo.",
      "Outro aspecto importante é a participação da atividade com maior VAB no PIB, que evidencia o grau de concentração econômica do território. Quanto maior essa participação, maior tende a ser a dependência da economia em relação a um setor específico. A análise conjunta desses indicadores ajuda a compreender as potencialidades, especializações produtivas e desafios econômicos de cada setor, ou de cada localidade..",
      "Os dados apresentados no painel têm como fonte o Instituto Brasileiro de Geografia e Estatística (IBGE), responsável pelo cálculo do PIB e de seus componentes para estados e municípios. Em conjunto, essas informações oferecem uma visão mais ampla da dinâmica econômica local, e contribuem para o planejamento de políticas públicas, a atração de investimentos e o fomento e acompanhamento das transformações econômicas nos territórios.",
    ].join("\n"),
  ),
};
