import { IPreviewCard } from "@/utils/interfaces";
import { Icon } from "../Icon/Icon";
import { macroThemes } from "@/utils/constants";
import Link from "next/link";

const PreviewCard = ({ content }: { content: IPreviewCard }) => {
  const { title, subtitle, data, note, link, category } = content;

  return (
    <Link href={link || ""} className="flex-none">
      <div className="group w-[268px] md:w-full rounded-lg shadow h-full flex flex-col">
        <div className="px-4 py-3 flex gap-2 w-full items-center bg-grey-100 group-hover:bg-grey-200 rounded-t-lg transition duration-300 min-h-[68px]">
          <div
            className="flex items-center justify-center rounded-sm min-w-[40px] w-[40px] h-[40px]"
            style={{ backgroundColor: category.color }}
          >
            <Icon
              className="text-white"
              id={macroThemes[category.id]}
              size={20}
            />
          </div>
          <div className="flex flex-col w-full overflow-hidden">
            <h3 className="text-sm font-medium">{title}</h3>
            <p className="text-xs text-grey-600">{subtitle}</p>
          </div>
          <Icon className="hidden md:flex rotate-270" id="expand" size={9} />
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
