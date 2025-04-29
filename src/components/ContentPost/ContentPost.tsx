import { IPublication } from "@/utils/interfaces";
import { POST_TYPES } from "@/utils/constants";
import Link from "next/link";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";

const ContentPost = ({ content }: { content: { fields: IPublication } }) => {
  const { title, thumb, link, date, type, description } = content.fields;
  const dateObj = date ? new Date(date) : null;
  const formattedDate = dateObj ? dateObj.toLocaleDateString("pt-BR") : "";

  return (
    <Link href={link} className="block">
      <div className="rounded-t-md overflow-hidden m-0 border border-gray-200 shadow-sm">
        <div className="relative group">
          <img
            alt=""
            src={`https:${thumb.fields.file.url}`}
            className="h-[225px] w-full block object-cover transition-opacity duration-300 group-hover:opacity-75"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black opacity-0 group-hover:opacity-70 transition-opacity duration-300">
            <p className="text-white text-sm p-4 text-center drop-shadow-sm">
              {description || "Acessar conteúdo"}
            </p>
          </div>
          <div className="absolute top-2 left-2 bg-white rounded-lg px-2 bg-gray-50">
            <span className="font-bold">
              {
                POST_TYPES[
                  type as "additional-content" | "data-panel" | "newsletter"
                ]
              }
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between bg-gray-50 px-4 py-3 h-[95px]">
          <div className="flex flex-col gap-2">
            <p className="block break-words whitespace-normal leading-tight overflow-hidden font-bold">
              {title}
            </p>
            <p className="text-[#7E797B] text-xs">{formattedDate}</p>
          </div>
          <ArrowForwardIosIcon sx={{ fontSize: "1rem" }} />
        </div>
      </div>
    </Link>
  );
};

export default ContentPost;
