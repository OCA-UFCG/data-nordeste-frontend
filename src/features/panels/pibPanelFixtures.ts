// Shared test fixtures for the PIB panel: the backend payload (snake_case, as
// GET /paineis/pib answers) and a ready model. Only imported by *.test.* files.

const vab = (servicos: number) => ({
  agropecuaria: 1e9,
  industria: 2e9,
  servicos,
  adm_publica: 1e9,
});

export const PIB_PANEL_PAYLOAD = {
  fonte: "IBGE",
  recorte: { area: "ne", uf: "PB", municipio: null },
  opcoes: {
    areas: [
      { id: "aas_21", nome: "Área de atuação da SUDENE" },
      { id: "ne", nome: "Nordeste" },
    ],
    ufs: ["PB", "PE"],
    municipios: [{ codigo: 2504009, nome: "Campina Grande" }],
  },
  serie: [
    { ano: 2021, pib_total: 70e9, pib_per_capita: 18_000 },
    { ano: 2022, pib_total: 80e9, pib_per_capita: 20_000 },
    { ano: 2023, pib_total: 90e9, pib_per_capita: 22_000 },
  ],
  vab: [
    { ano: 2020, ...vab(4e9) },
    { ano: 2021, ...vab(6e9) },
  ],
  atividades: [
    {
      ano: 2021,
      atividade: "Demais serviços",
      municipios: 8,
      vab: 20e9,
      participacao_pib: 0.5,
    },
    {
      ano: 2021,
      atividade: "Administração pública",
      municipios: 208,
      vab: 15e9,
      participacao_pib: 0.29,
    },
  ],
};
