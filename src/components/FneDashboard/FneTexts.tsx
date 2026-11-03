import { ChevronDown, ExternalLink } from "lucide-react";

// Textos do painel do FNE no ArcGIS (Experience e tela "Sobre" do dashboard).
export const FNE_SOURCE =
  "Fonte dos dados: base de contratações do FNE, do Banco do Nordeste (BNB), anos de referência 2021 a 2025. Esse formato agregado das contratações é enviado mensalmente pelo BNB e acumula os dados desde janeiro até dezembro de cada ano. Consultado ao vivo no banco do Data Nordeste.";

const ABOUT_PANEL = [
  "Este painel apresenta informações sobre as contratações realizadas no âmbito do Fundo Constitucional de Financiamento do Nordeste (FNE), com o objetivo de apoiar a visualização e o acompanhamento da distribuição territorial dos recursos.",
  "Os dados apresentados são provenientes da base de contratações do Banco do Nordeste (BNB) e abrangem o período de 2021 a 2025. A base é encaminhada mensalmente, em formato agregado, contendo o acumulado das contratações realizadas entre janeiro e dezembro de cada ano de referência.",
  "As informações disponibilizadas neste painel têm caráter informativo e analítico, permitindo analisar a distribuição espacial e temporal das contratações do FNE.",
  "Utilize os filtros e ferramentas de navegação para explorar os dados por diferentes recortes territoriais e temporais.",
];

const WHAT_IS_FNE = [
  "O Fundo Constitucional de Financiamento do Nordeste (FNE) é um dos principais instrumentos de desenvolvimento regional do Brasil, voltado ao financiamento de atividades produtivas na região Nordeste. Atendendo a mais de 2 mil municípios, o FNE integra a Política Nacional de Desenvolvimento Regional (PNDR) e é um dos pilares do Plano Regional de Desenvolvimento do Nordeste (PRDNE).",
  "Como um dos instrumentos de ação da Sudene, o FNE desempenha papel estratégico na execução das políticas de desenvolvimento regional. A atuação da autarquia orienta a aplicação dos recursos do fundo, garantindo alinhamento com as prioridades regionais e com as diretrizes de redução das desigualdades econômicas e sociais. A operacionalização financeira é realizada pelo Banco do Nordeste.",
  "Seu principal objetivo é fomentar o desenvolvimento econômico e social por meio da oferta de crédito com condições diferenciadas para empreendedores, empresas e produtores rurais. O fundo estimula a geração de emprego e renda, fortalece setores produtivos e contribui para a interiorização do desenvolvimento, reduzindo as disparidades interregionais e intrarregionais.",
  "Com foco em inclusão produtiva e inovação, o FNE apoia projetos estratégicos em áreas como infraestrutura, agronegócio, indústria, turismo e energia renovável, consolidando-se como uma ferramenta essencial para o fortalecimento da economia nordestina.",
];

const BNB_FNE_URL = "https://www.bnb.gov.br/fne";

export const FneIntro = () => (
  <div className="flex flex-col gap-3">
    <div className="flex flex-col gap-1">
      <p className="text-sm font-semibold uppercase tracking-wide text-green-800">
        Instrumentos da Sudene
      </p>
      <h2 className="text-xl font-bold leading-snug text-grey-1100 sm:text-2xl">
        Distribuição dos Investimentos do FNE no Nordeste e Territórios
        Estratégicos (2021–2025)
      </h2>
      <p className="text-sm text-grey-800">Publicado em 11/03/2026</p>
    </div>
    <details className="group rounded-lg bg-white shadow-sm">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 text-base font-semibold text-green-900">
        Sobre o painel de contratações do FNE
        <ChevronDown
          aria-hidden
          className="size-5 shrink-0 transition group-open:rotate-180"
        />
      </summary>
      <div className="flex flex-col gap-3 px-4 pb-4 text-base leading-relaxed text-grey-1100">
        {ABOUT_PANEL.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
    </details>
  </div>
);

export const WhatIsFne = () => (
  <section className="flex flex-col gap-4 rounded-lg bg-white p-4 shadow-sm sm:p-6">
    <h2 className="text-xl font-bold text-grey-1100">O que é o FNE?</h2>
    <div className="flex flex-col gap-3 text-base leading-relaxed text-grey-1100">
      {WHAT_IS_FNE.map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}
    </div>
    <a
      href={BNB_FNE_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex h-11 items-center justify-center gap-2 self-start rounded-md bg-green-800 px-5 text-base font-medium text-white transition hover:bg-green-900"
    >
      Saiba mais
      <ExternalLink aria-hidden className="size-4" />
      <span className="sr-only">(abre o site do Banco do Nordeste)</span>
    </a>
  </section>
);
