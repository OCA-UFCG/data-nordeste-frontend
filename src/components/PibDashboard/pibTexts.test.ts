import { describe, expect, it } from "vitest";
import {
  PIB_ATIVIDADE_INFO,
  PIB_ATIVIDADE_UNIT,
  PIB_CARD_INFO,
  PIB_BIG_NUMBER_INFO,
  PIB_LINE_INFO,
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

const flatten = (paragraphs: readonly { term?: string; rest: string }[]) =>
  paragraphs.map(({ term = "", rest }) => term + rest);

const PIB_DEFINITION =
  "Produto Interno Bruto (PIB) é a soma de todos os bens e serviços finais produzidos em um país, estado ou município durante um determinado período.";
const PIB_PER_CAPITA_DEFINITION =
  "PIB per capita indica a produção econômica média por habitante. É obtido dividindo-se o PIB total pela população do município. Em 2023, foi usada a população do Censo Demográfico de 2022, segundo nota do Instituto Brasileiro de Geografia e Estatística (IBGE).";
const PIB_CURRENT_PRICES_NOTE =
  "Obs.: Os valores do PIB são apresentados a preços correntes de cada ano. A evolução nominal incorpora tanto variações na produção quanto nos preços.";

describe("PIB_MAP_INFO", () => {
  it("keeps only the PIB definition and the Obs., verbatim", () => {
    expect(flatten(PIB_MAP_INFO)).toEqual([
      PIB_DEFINITION,
      PIB_CURRENT_PRICES_NOTE,
    ]);
  });
});

describe("PIB_LINE_INFO", () => {
  it("keeps the content team paragraphs verbatim", () => {
    expect(flatten(PIB_LINE_INFO)).toEqual([
      PIB_DEFINITION,
      PIB_PER_CAPITA_DEFINITION,
      PIB_CURRENT_PRICES_NOTE,
    ]);
    expect(PIB_LINE_INFO.map(({ term }) => term)).toEqual([
      "Produto Interno Bruto (PIB)",
      "PIB per capita",
      undefined,
    ]);
  });
});

describe("PIB_BIG_NUMBER_INFO", () => {
  it("gives each big number its own definition and the shared Obs.", () => {
    expect(flatten(PIB_BIG_NUMBER_INFO.pib)).toEqual([
      PIB_DEFINITION,
      PIB_CURRENT_PRICES_NOTE,
    ]);
    expect(flatten(PIB_BIG_NUMBER_INFO.perCapita)).toEqual([
      PIB_PER_CAPITA_DEFINITION,
      PIB_CURRENT_PRICES_NOTE,
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
