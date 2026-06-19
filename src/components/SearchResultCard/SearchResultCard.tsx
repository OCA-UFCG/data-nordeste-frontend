import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/Icon/Icon";
import { getSearchTypeLabel } from "@/features/search/search";
import type { SearchResult } from "@/features/search/types";

export const SearchResultCard = ({ result }: { result: SearchResult }) => (
  <Link
    className="group flex h-full w-full flex-col overflow-hidden rounded-md border border-grey-200 bg-grey-100 shadow-md transition duration-300 hover:border-grey-300 hover:bg-grey-200"
    href={result.href}
  >
    <SearchResultImage result={result} />
    <SearchResultContent result={result} />
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

const SearchResultContent = ({ result }: { result: SearchResult }) => (
  <div className="flex flex-1 flex-col justify-between">
    <SearchResultMeta result={result} />
    <SearchResultSummary result={result} />
  </div>
);

const SearchResultMeta = ({ result }: { result: SearchResult }) => (
  <div className="flex flex-row items-center justify-between bg-gray-200 px-5 py-1">
    <p className="text-xs font-semibold text-grey-1100">
      {getSearchTypeLabel(result)}
    </p>
    {result.date && (
      <p className="text-xs text-grey-600">
        {new Date(result.date).toLocaleDateString("pt-BR")}
      </p>
    )}
  </div>
);

const SearchResultSummary = ({ result }: { result: SearchResult }) => (
  <div className="flex h-full items-center justify-between gap-3 px-5 py-4">
    <div className="flex min-w-0 flex-1 flex-col gap-2">
      <p className="line-clamp-2 text-sm font-medium text-grey-1100">
        {result.title}
      </p>
      <SearchResultDescription result={result} />
    </div>

    <Icon className="size-2 min-w-2 rotate-270 md:flex" id="expand" size={9} />
  </div>
);

const SearchResultDescription = ({ result }: { result: SearchResult }) => {
  const description = result.description || result.themes.join(", ");

  if (!description) return null;

  return <p className="line-clamp-2 text-xs text-grey-700">{description}</p>;
};
