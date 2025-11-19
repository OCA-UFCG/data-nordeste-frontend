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
    <section className="bg-grey-100 w-full" id={title}>
      <div className="max-w-[1440px] px-4 lg:px-20 py-10 mx-auto my-0 lg:my-8 box-border">
        <div className="flex items-center justify-between gap-6">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-3 max-w-[1110px]">
              <h1 className="font-semibold text-3xl">{title}</h1>
              <h2 className="font-medium">{subtitle}</h2>
            </div>

            <Button asChild variant="primary" className="max-w-[300px]">
              <Link href="/catalog">Catálogo de dados</Link>
            </Button>
          </div>
          <Icon
            id="database"
            size={116}
            className="hidden lg:block flex-shrink-0"
          />{" "}
        </div>
      </div>
    </section>
  );
};
export default CatalogSection;
