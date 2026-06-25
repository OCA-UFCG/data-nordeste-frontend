import { SectionHeader } from "@/utils/interfaces";
import { Button } from "../ui/button";
import Link from "next/link";

const CatalogSection = ({ header }: { header?: SectionHeader }) => {
  const { title, subtitle } = header || {
    title: "",
    subtitle: "",
  };

  return (
    <section className="w-full bg-grey-100" id={title}>
      <div className="max-w-[1440px] px-4 py-10 mx-auto box-border text-grey-1100 lg:px-20 lg:py-14">
        <div className="flex max-w-[760px] flex-col items-start gap-6">
          <div className="flex flex-col gap-3">
            <h2 className="text-3xl font-semibold">{title}</h2>
            <p className="text-sm leading-6">{subtitle}</p>
          </div>
          <Button asChild variant="primary" className="w-fit min-w-[220px]">
            <Link href="/catalog">Acessar</Link>
          </Button>
        </div>
      </div>
    </section>
  );
};
export default CatalogSection;
