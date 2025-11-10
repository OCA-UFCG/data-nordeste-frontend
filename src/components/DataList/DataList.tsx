import { IMetadata, MacroTheme } from "@/utils/interfaces";
import { DataCard } from "../DataCard/DataCard";
import { POSTS_PER_PAGE } from "@/utils/constants";
import { Skeleton } from "../ui/skeleton";
import { Icon } from "../Icon/Icon";
import { PaginationBar } from "../PaginationBar/PaginationBar";

export const DataList = ({
  posts,
  loading,
  currentPage,
  pages,
  themes,
}: {
  posts: (IMetadata & { tags?: { name: string; slug: string }[] })[];
  loading: boolean;
  currentPage: number;
  pages: number;
  themes: MacroTheme[];
}) => (
  <div className="flex flex-col items-center gap-8 w-full max-w-[1440px]">
    <div className="flex flex-col gap-4 w-full">
      {loading ? (
        [...Array(POSTS_PER_PAGE)].map((_, i) => (
          <Skeleton className="w-full h-[200px] rounded-lg" key={i} />
        ))
      ) : posts.length > 0 ? (
        posts.map((post, i) => <DataCard key={i} post={post} themes={themes} />)
      ) : (
        <div className="flex flex-col gap-4 justify-center items-center w-full py-12 bg-gray-50 rounded-lg">
          <Icon id="no-mail" size={48} />
          <span>Nenhum dado encontrado</span>
        </div>
      )}
    </div>
    <PaginationBar
      currentPage={currentPage}
      totalPages={pages}
      loading={loading}
    />
  </div>
);
