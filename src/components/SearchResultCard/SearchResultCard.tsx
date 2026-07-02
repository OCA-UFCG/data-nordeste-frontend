import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/Icon/Icon";
import { getSearchTypeLabel } from "@/features/search/search";
import type { SearchResult } from "@/features/search/types";

type SearchResultCardProps = {
  result: SearchResult;
  showAccessAction?: boolean;
};

export const SearchResultCard = ({
  result,
  showAccessAction = false,
}: SearchResultCardProps) => (
  <Link
    className="group flex h-full w-full flex-col overflow-hidden rounded-lg border border-[#EFEFEF] bg-white shadow-md transition duration-300 hover:border-grey-300 hover:bg-grey-100"
    href={result.href}
  >
    <SearchResultImage result={result} />
    <SearchResultContent result={result} showAccessAction={showAccessAction} />
  </Link>
);

const SearchResultImage = ({ result }: { result: SearchResult }) => {
  if (!result.thumb) return <div className="aspect-7/4 w-full bg-grey-200" />;

  return (
    <div className="w-full overflow-hidden">
      <Image
        alt=""
        className="block aspect-7/4 w-full object-cover object-top transition-transform duration-300 group-hover:scale-102"
        height={300}
        src={result.thumb}
        width={300}
      />
    </div>
  );
};

const SearchResultContent = ({
  result,
  showAccessAction,
}: SearchResultCardProps) => (
  <div className="flex flex-1 flex-col justify-between">
    <SearchResultMeta result={result} />
    <SearchResultSummary result={result} showAccessAction={showAccessAction} />
  </div>
);

const SearchResultMeta = ({ result }: { result: SearchResult }) => (
  <div className="flex flex-row items-center justify-between bg-[#DCDBDC] px-4 py-1">
    <p className="text-xs font-semibold text-[#0F172A]">
      {getSearchTypeLabel(result)}
    </p>
    {result.date && (
      <p className="text-[10px] leading-3 text-[#595557]">
        {new Date(result.date).toLocaleDateString("pt-BR")}
      </p>
    )}
  </div>
);

const SearchResultSummary = ({
  result,
  showAccessAction,
}: SearchResultCardProps) => (
  <div className="flex h-full items-center justify-between gap-3 bg-[#F8F7F8] px-4 py-3">
    <div className="flex min-w-0 flex-1 flex-col gap-2">
      {showAccessAction && <span className="sr-only">{result.title}</span>}
      <p className="line-clamp-2 text-sm font-medium leading-5 tracking-[-0.03em] text-[#292829]">
        {showAccessAction ? "Acessar" : result.title}
      </p>
      {!showAccessAction && <SearchResultDescription result={result} />}
    </div>

    <Icon className="md:flex size-2 min-w-2" id="expand-black" size={9} />
  </div>
);

const SearchResultDescription = ({ result }: { result: SearchResult }) => {
  const description = result.description || result.themes.join(", ");

  if (!description) return null;

  return <p className="line-clamp-2 text-xs text-grey-700">{description}</p>;
};
