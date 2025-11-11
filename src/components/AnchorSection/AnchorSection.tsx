import Link from "next/link";
import { Button } from "../ui/button";
import { themes } from "@/utils/constants";

const AnchorSection = ({ macroTheme }: { macroTheme: string }) => {
  const isValidTheme = Object.keys(themes).includes(macroTheme);
  const themeSlug = isValidTheme
    ? themes[macroTheme as keyof typeof themes]
    : "";

  return (
    <section className="flex justify-center items-center bg-grey-100 w-full min-h-[260px] border-box">
      <div className="flex flex-col lg:items-start gap-6 px-6 py-9 lg:px-28 lg:py-12 max-w-[1440px]">
        <h1 className="font-extrabold text-[30px]">
          Veja os conjuntos de dados relacionados
        </h1>
        <h2 className="text-[16px]">
          Os dados utilizados neste painel estão disponíveis para download no
          Catálogo de Dados do Data Nordeste. Acesse para explorar as fontes
          originais, metadados e outras bases relacionadas.
        </h2>
        <Button asChild variant="primary" className="min-w-[300px]">
          <Link href={`/catalog?category=${themeSlug}`}>
            Ir para o catálogo de dados
          </Link>
        </Button>
      </div>
    </section>
  );
};

export default AnchorSection;
