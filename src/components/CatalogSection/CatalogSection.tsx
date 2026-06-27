import { SectionHeader } from "@/utils/interfaces";
import { Button } from "../ui/button";
import { Icon } from "../Icon/Icon";
import Link from "next/link";

const CatalogSection = ({ header }: { header?: SectionHeader }) => {
  const { title, subtitle } = header || {
    title: "",
    subtitle: "",
  };

  return (
    <section className="w-full bg-grey-100" id={title}>
      <div className="mx-auto box-border max-w-[1440px] px-4 py-10 text-grey-1100 lg:h-[266px] lg:px-20 lg:py-12">
        <div className="flex h-full items-center justify-between gap-6">
          <div className="flex max-w-[1116px] flex-col items-start gap-6">
            <h2 className="text-3xl font-semibold leading-9 tracking-[-0.0075em] text-[#292829]">
              {title}
            </h2>

            <div className="flex flex-col items-start gap-6">
              <p className="max-w-[1116px] text-base font-medium leading-6 text-[#292829]">
                {subtitle}
              </p>

              <Button
                asChild
                variant="primary"
                className="h-10 w-full lg:w-auto lg:min-w-[304px] rounded-md px-4 py-2 text-sm font-medium"
              >
                <Link href="/catalog">Acessar catálogo</Link>
              </Button>
            </div>
          </div>

          <Icon
            id="database"
            width={140}
            height={140}
            className="hidden shrink-0 text-[#00BD47] lg:block"
          />
        </div>
      </div>
    </section>
  );
};

export default CatalogSection;
