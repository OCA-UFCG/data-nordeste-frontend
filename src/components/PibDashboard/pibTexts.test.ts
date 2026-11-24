import { describe, expect, it } from "vitest";
import {
  PIB_ATIVIDADE_INFO,
  PIB_ATIVIDADE_UNIT,
  PIB_CARD_INFO,
  PIB_MAP_INFO,
  PIB_VAB_TERM,
} from "@/components/PibDashboard/pibTexts";

describe("PIB_CARD_INFO", () => {
  it("explains the VAB card with the content team wording", () => {
    expect(PIB_CARD_INFO.vab).toBe(
      "Valor Adicionado Bruto (VAB) por setor representa o quanto cada setor da economia contribui para a geração de riqueza, ou seja, para o Produto Interno Bruto (PIB).",
    );
    expect(PIB_CARD_INFO.vab.startsWith(PIB_VAB_TERM)).toBe(true);
  });
});

describe("PIB_MAP_INFO", () => {
  it("opens with how the map filters the panel", () => {
    const [usage] = PIB_MAP_INFO;

    expect(usage.term).toBeUndefined();
    expect(usage.rest).toContain("clique em um estado ou município");
    expect(usage.rest).toContain(
      "clicar de novo no município escolhido volta ao estado",
    );
    expect(usage.rest).toContain("legenda");
  });

  it("keeps the content team paragraphs verbatim", () => {
    const paragraphs = PIB_MAP_INFO.slice(1);

    expect(paragraphs.map(({ term = "", rest }) => term + rest)).toEqual([
      "Produto Interno Bruto (PIB) é a soma de todos os bens e serviços finais produzidos em um país, estado ou município durante um determinado período.",
      "PIB per capita indica a produção econômica média por habitante. É obtido dividindo-se o PIB total pela população do município. Em 2023, foi usada a população do Censo Demográfico de 2022, segundo nota do Instituto Brasileiro de Geografia e Estatística (IBGE).",
      "Obs.: Os valores do PIB são apresentados a preços correntes de cada ano. A evolução nominal incorpora tanto variações na produção quanto nos preços.",
    ]);
  });
});

describe("PIB_ATIVIDADE_INFO", () => {
  it("keeps the content team paragraphs verbatim", () => {
    expect(
      PIB_ATIVIDADE_INFO.map(({ term = "", rest }) => term + rest),
    ).toEqual([
      "Participação da atividade com maior Valor Adicionado Bruto (VAB) no Produto Interno Bruto (PIB) representa o percentual do PIB que é gerado pela atividade econômica de maior VAB no local selecionado. Esse indicador mostra o quanto a principal atividade econômica contribui para a geração de riqueza local.",
      "Obs.: Enquanto nenhum município estiver selecionado, o gráfico apresenta um ranking das atividades com maior VAB. Ao selecionar um município, o gráfico passa a mostrar a participação da atividade de maior VAB no PIB do município selecionado.",
    ]);
    expect(PIB_ATIVIDADE_UNIT).toBe("Percentual do PIB (%)");
  });
});
