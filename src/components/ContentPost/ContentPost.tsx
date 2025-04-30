import { IPublication } from "@/utils/interfaces";
import { POST_TYPES } from "@/utils/constants";
import Link from "next/link";
import { Icon } from "@/components/Icon/Icon";

const ContentPost = ({ content }: { content: { fields: IPublication } }) => {
  const { title, thumb, link, date, type } = content.fields;
  const dateObj = date ? new Date(date) : null;
  const formattedDate = dateObj ? dateObj.toLocaleDateString("pt-BR") : "";

  return (
    <Link
      href={link}
      className="flex flex-col overflow-hidden rounded-md w-full bg-grey-100 hover:bg-grey-200 border border-grey-200 hover:border-grey-300 cursor-pointer transition duration-300 shadow-sm"
    >
      <div className="relative group">
        <img
          alt=""
          src={`https:${thumb.fields.file.url}`}
          className="h-[180px] w-full block object-cover transition-transform group-hover:scale-102 duration-300"
        />
        <div className="absolute top-4 left-4 rounded-lg px-2 py-0.5 bg-gray-100">
          <p className="font-semibold text-xs">
            {
              POST_TYPES[
                type as "additional-content" | "data-panel" | "newsletter"
              ]
            }
          </p>
        </div>
      </div>

      <div className="p-5 flex justify-between items-center md:max-h-[76px]">
        <div className="flex flex-col gap-0.5 md:max-w-[95%]">
          <p className="line-clamp-2 leading-tight font-semibold text-base text-wrap">
            {title}
          </p>
          <p className="text-[#7E797B] text-xs">{formattedDate}</p>
        </div>
        <Icon className="hidden md:flex rotate-270" id="expand" size={9} />
      </div>
    </Link>
  );
};

export default ContentPost;
