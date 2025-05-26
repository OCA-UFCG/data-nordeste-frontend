import { IPublication } from "@/utils/interfaces";
import { POST_TYPES } from "@/utils/constants";
import Link from "next/link";
import Image from "next/image";
import { Icon } from "@/components/Icon/Icon";

const ContentPost = ({ content }: { content: { fields: IPublication } }) => {
  const { title, thumb, link, date, type } = content.fields;
  const dateObj = date ? new Date(date) : null;
  const formattedDate = dateObj ? dateObj.toLocaleDateString("pt-BR") : "";

  return (
    <Link
      href={link}
      className="group flex flex-col overflow-hidden rounded-md w-full bg-grey-100 hover:bg-grey-200 border border-grey-200 hover:border-grey-300 cursor-pointer transition duration-300 shadow-md h-full"
    >
      <Image
        width={300}
        height={300}
        alt=""
        src={`https:${thumb?.fields?.file?.url || ""}`}
        className="w-full aspect-7/4 block object-cover object-top transition-transform group-hover:scale-102 duration-300"
      />
      <div className="flex flex-row justify-between bg-gray-200 px-2 py-1">
        <p className="font-semibold text-xs">
          {
            POST_TYPES[
              type as "additional-content" | "data-panel" | "newsletter"
            ]
          }
        </p>
        <p className="text-grey-600 text-xs">{formattedDate}</p>
      </div>

      <div className="py-4 px-5 flex gap-3 justify-between items-center h-full box-border">
        <p className="line-clamp-2 text-sm font-medium text-wrap">{title}</p>
        <Icon
          className="md:flex rotate-270 size-2 min-w-2"
          id="expand"
          size={9}
        />
      </div>
    </Link>
  );
};

export default ContentPost;
