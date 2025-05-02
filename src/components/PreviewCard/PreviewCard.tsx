import { IPreviewCard } from "@/utils/interfaces";
import { Icon } from "../Icon/Icon";
import { macroThemes } from "@/utils/constants";
import Link from "next/link";

const PreviewCard = ({ content }: { content: IPreviewCard }) => {
  const { title, subtitle, data, note, link, category } = content;

  return (
    <Link
      className="bg-red-600 mb-6 w-full rounded-lg shadow"
      href={link || ""}
    >
      <div className="h-full max-h-[280px]">
        <div className="px-4 py-3 flex gap-2 items-center bg-grey-100 grow-2">
          <div
            className="flex items-center justify-center rounded-sm min-w-[40px] w-[40px] h-[40px]"
            style={{ backgroundColor: category.fields.color }}
          >
            <Icon
              className="text-white"
              id={macroThemes[category.fields.id]}
              size={20}
            />
          </div>
          <div className="w-full">
            <h3 className="text-sm">{title}</h3>
            <p className="text-xs text-grey-600">{subtitle}</p>
          </div>
          <Icon className="hidden md:flex rotate-270" id="expand" size={9} />
        </div>
        <div className="h-full flex flex-col justify-center px-4 py-3 grow">
          <p
            className="font-bold text-[32px]"
            style={{ color: category.fields.color }}
          >
            {data}
          </p>
          <p className="text-grey-600 text-xs">{note}</p>
        </div>
      </div>
    </Link>
  );
};

export default PreviewCard;
