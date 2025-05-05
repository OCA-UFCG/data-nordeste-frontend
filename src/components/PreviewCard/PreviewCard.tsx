import { IPreviewCard } from "@/utils/interfaces";
import { Icon } from "../Icon/Icon";
import { macroThemes } from "@/utils/constants";
import Link from "next/link";

const PreviewCard = ({ content }: { content: IPreviewCard }) => {
  const { title, subtitle, data, note, link, category } = content;

  return (
    <Link href={link || ""}>
      <div className="w-full rounded-lg shadow h-full">
        <div className="px-4 py-3 flex gap-2 w-full items-center bg-grey-100 min-h-[5rem]">
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
          <div className="flex flex-col w-full">
            <h3 className="text-sm">{title}</h3>
            <p className="text-xs text-grey-600">{subtitle}</p>
          </div>
          <Icon className="hidden md:flex rotate-270" id="expand" size={9} />
        </div>
        <div className="flex flex-col justify-center px-4 py-3">
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
