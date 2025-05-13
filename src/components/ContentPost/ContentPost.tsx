import { IPublication } from "@/utils/interfaces";
import { POST_TYPES } from "@/utils/constants";
import Link from "next/link";
import { Icon } from "@/components/Icon/Icon";

const ContentPost = ({
  content,
  labeled,
}: {
  content: { fields: IPublication };
  labeled: boolean;
}) => {
  const { title, thumb, link, date, type } = content.fields;
  const dateObj = date ? new Date(date) : null;
  const formattedDate = dateObj ? dateObj.toLocaleDateString("pt-BR") : "";

  return (
    <Link
      href={link}
      className="group flex flex-col overflow-hidden rounded-md w-full bg-grey-100 hover:bg-grey-200 border border-grey-200 hover:border-grey-300 cursor-pointer transition duration-300 shadow-md h-full"
    >
      <div className="relative group">
        <img
          alt=""
          src={`https:${thumb?.fields?.file?.url || ""}`}
          className="w-full aspect-7/4 block object-cover object-top transition-transform group-hover:scale-102 duration-300"
        />
        {labeled && (
          <div className="absolute top-4 left-4 rounded-lg px-2 py-0.5 bg-gray-100">
            <p className="font-semibold text-xs">
              {
                POST_TYPES[
                  type as "additional-content" | "data-panel" | "newsletter"
                ]
              }
            </p>
          </div>
        )}
      </div>

      <div className="py-4 px-5 flex gap-3 justify-between items-center h-full box-border">
        <div className="flex flex-col gap-0.5">
          <p className="line-clamp-2 text-sm font-medium text-wrap">{title}</p>
          <p className="text-grey-600 text-xs">{formattedDate}</p>
        </div>
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
