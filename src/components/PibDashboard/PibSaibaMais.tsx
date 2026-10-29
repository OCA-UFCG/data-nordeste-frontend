import { PanelInfo } from "@/components/Panel/PanelInfo";

// Texto do balão "Saiba mais" do Power BI, sem alterações.
const SAIBA_MAIS = [
  "Produto Interno Bruto (PIB) é a soma de todos os bens e serviços finais produzidos em um país, estado ou município durante um determinado período.",
  "PIB per capita indica a produção econômica média por habitante. É obtido dividindo-se o PIB total pela população do município. Em 2023, foi usada a população do Censo 2022, segundo nota do IBGE",
  "Valor Adicionado Bruto (VAB) por setor representa o quanto cada setor da economia contribui para a geração de riqueza, ou seja, para o Produto Interno Bruto (PIB).",
  "Participação da atividade com maior VAB no PIB representa o percentual do PIB que é gerado pela atividade econômica de maior VAB no local selecionado. Esse indicador mostra o quanto a principal atividade econômica contribui para a geração de riqueza local.",
  "Os valores do PIB são apresentados a preços correntes de cada ano. A evolução nominal incorpora tanto variações na produção quanto nos preços.",
];

export const PibSaibaMais = () => (
  <PanelInfo label="Saiba mais">
    <p className="mb-2 font-semibold">Saiba mais</p>
    <ul className="flex list-disc flex-col gap-2 pl-5">
      {SAIBA_MAIS.map((text) => (
        <li key={text}>{text}</li>
      ))}
    </ul>
  </PanelInfo>
);
