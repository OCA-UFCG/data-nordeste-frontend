import { IPreviewCard } from "@/utils/interfaces";
import { Icon } from "../Icon/Icon";
import { macroThemes } from "@/utils/constants";
import Link from "next/link";

const PreviewCard = ({ content }: { content: IPreviewCard }) => {
  const { title, subtitle, data, note, link, category, iconsvg } = content;

  return (
    <Link href={link || ""} className="flex-none">
      <div className="group w-[268px] md:w-full rounded-lg shadow h-full flex flex-col">
        <div className="px-4 py-3 flex gap-2 w-full items-start bg-grey-100 group-hover:bg-grey-200 rounded-t-lg transition duration-300 min-h-[68px]">
          <div
            className="flex size-[40px] shrink-0 items-center justify-center rounded-sm"
            style={{ backgroundColor: category.color }}
          >
            {iconsvg?.url ? (
              <img
                src={
                  iconsvg.url.startsWith("//")
                    ? `https:${iconsvg.url}`
                    : iconsvg.url
                }
                alt=""
                className="h-5 w-5 object-contain"
              />
            ) : (
              <Icon
                className="text-white"
                id={macroThemes[category.id] || "default"}
                size={20}
              />
            )}
          </div>
          <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
            <h3 className="min-h-10 text-sm font-medium leading-5">
              {title}
            </h3>
            <p className="text-xs text-grey-600">{subtitle}</p>
          </div>
          <Icon className="hidden md:flex" id="expand-black" size={9} />
        </div>
        <div className="flex flex-col justify-center px-4 py-3 flex-1">
          <p
            className="font-bold text-[32px] leading-6 tracking-[-0.015em]"
            style={{ color: category.color }}
          >
            {data}
          </p>
          <p className="text-grey-600 text-xs leading-4 mt-2">{note}</p>
        </div>
      </div>
    </Link>
  );
};

export default PreviewCard;
