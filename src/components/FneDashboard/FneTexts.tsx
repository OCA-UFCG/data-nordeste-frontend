import { ExternalLink } from "lucide-react";
import { PanelInfo } from "@/components/Panel/layout/PanelInfo";

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

const InfoSection = ({
  title,
  paragraphs,
}: {
  title: string;
  paragraphs: string[];
}) => (
  <>
    <p className="text-base font-semibold text-[#018f39]">{title}</p>
    {paragraphs.map((paragraph) => (
      <p key={paragraph}>{paragraph}</p>
    ))}
  </>
);

// Os textos "Sobre" e "O que é o FNE?" do ArcGIS ficam no ⓘ do cabeçalho,
// como o "Saiba mais" dos outros painéis; acima do painel vão os do Contentful.
export const FneSaibaMais = () => (
  <PanelInfo label="Saiba mais">
    <div className="flex max-h-[60vh] flex-col gap-3 overflow-y-auto">
      <InfoSection title="Sobre o painel" paragraphs={ABOUT_PANEL} />
      <InfoSection title="O que é o FNE?" paragraphs={WHAT_IS_FNE} />
      <a
        href={BNB_FNE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex h-11 items-center justify-center gap-2 self-start rounded-md bg-green-800 px-5 text-base font-medium text-white transition hover:bg-green-900"
      >
        Saiba mais no Banco do Nordeste
        <ExternalLink aria-hidden className="size-4" />
        <span className="sr-only">(abre em nova aba)</span>
      </a>
    </div>
  </PanelInfo>
);
