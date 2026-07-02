import { IPublication } from "@/utils/interfaces";
import { POST_TYPE_LABELS } from "@/features/posts/postTypes";
import Link from "next/link";
import Image from "next/image";
import { Icon } from "@/components/Icon/Icon";
import { getArcGisInternalEmbedHref } from "@/features/embeds/arcgis";

const ContentPost = ({ content }: { content: IPublication }) => {
  const { title, thumb, link, date, type, sys } = content;
  const dateObj = date ? new Date(date) : null;
  const formattedDate = dateObj ? dateObj.toLocaleDateString("pt-BR") : "";

  const { href, openInNewTab } = resolvePostHref({ type, link, sys });

  return (
    <Link
      href={href}
      target={openInNewTab ? "_blank" : undefined}
      rel={openInNewTab ? "noopener noreferrer" : undefined}
      className="group flex flex-col overflow-hidden rounded-lg w-full bg-white hover:bg-grey-100 border border-[#EFEFEF] hover:border-grey-300 cursor-pointer transition duration-300 shadow-md h-full"
    >
      <div className="w-full overflow-hidden">
        <Image
          width={300}
          height={300}
          alt=""
          src={thumb?.url || ""}
          className="w-full aspect-7/4 block object-cover object-top transition-transform group-hover:scale-102 duration-300"
        />
      </div>

      <div className="flex flex-col grow-1 justify-between">
        <div className="flex flex-row justify-between items-center bg-[#DCDBDC] px-4 py-1">
          <p className="font-semibold text-xs text-[#0F172A] leading-4">
            {POST_TYPE_LABELS[type]}
          </p>
          <p className="text-[#595557] text-[10px] leading-3">
            {formattedDate}
          </p>
        </div>

        <div className="py-3 px-4 flex gap-4 justify-between h-full items-center box-border bg-[#F8F7F8]">
          <span className="sr-only">{title}</span>
          <p className="line-clamp-2 text-sm font-medium leading-5 tracking-[-0.03em] text-[#292829]">
            {type === "data-panel" || type === "newsletter" ? "Acessar" : title}
          </p>
          <Icon className="md:flex size-2 min-w-2" id="expand-black" size={9} />
        </div>
      </div>
    </Link>
  );
};

// INTENTIONAL: newsletters with a sys.id route to the local /boletim/ PDF
// viewer page. All other post types preserve the previous routing behavior
// (ArcGIS embed detection, or external link fallback).
const resolvePostHref = ({
  type,
  link,
  sys,
}: Pick<IPublication, "type" | "link" | "sys">): {
  href: string;
  openInNewTab: boolean;
} => {
  if (type === "newsletter" && sys?.id) {
    return { href: `/boletim/${sys.id}`, openInNewTab: false };
  }

  const embedHref = getArcGisInternalEmbedHref(link);

  return embedHref
    ? { href: embedHref, openInNewTab: false }
    : { href: link, openInNewTab: true };
};

export default ContentPost;
