import { SectionHeader } from "@/utils/interfaces";
import { Button } from "../ui/button";
import { Icon } from "../Icon/Icon";
import Image from "next/image";
import Link from "next/link";

const CatalogSection = ({ header }: { header?: SectionHeader }) => {
  const { title, subtitle, thumb } = header || {
    title: "",
    subtitle: "",
  };

  return (
    <section className="relative w-full overflow-hidden bg-grey-100" id={title}>
      {thumb?.url ? (
        <Image
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          fill
          sizes="100vw"
          src={thumb.url}
        />
      ) : null}
      <div
        className="absolute inset-0 bg-gradient-to-b from-black via-black/65 to-
  black/40"
      />
      <div className="relative z-10 max-w-[1440px] px-4 lg:px-20 py-4 mx-auto my-0 lg:my-8 box-border text-white">
        <div className="flex items-center justify-between gap-6">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-3 max-w-[1110px]">
              <h1 className="font-semibold text-6xl">{title}</h1>
              <h2 className="font-medium">{subtitle}</h2>
            </div>
            <Button asChild variant="primary" className="w-full">
              <Link href="/catalog">Acessar catálogo</Link>
            </Button>
          </div>
          <Icon
            id="database"
            size={116}
            className="hidden lg:block flex-shrink-0 filter brightness-0 invert"
          />{" "}
        </div>
      </div>
    </section>
  );
};
export default CatalogSection;
