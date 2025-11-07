import { IPublication } from "@/utils/interfaces";
import ContentPost from "../ContentPost/ContentPost";
import { POSTS_PER_PAGE } from "@/utils/constants";
import { Skeleton } from "../ui/skeleton";
import { Icon } from "../Icon/Icon";
import { PaginationBar } from "../PaginationBar/PaginationBar";
import { cn } from "@/lib/utils";

export const PostsGrid = ({
  currentPage,
  pages,
  posts = [],
  loading,
}: {
  currentPage: number;
  loading: boolean;
  pages: number;
  posts: IPublication[];
}) => (
  <div className="grow-1 flex flex-col items-center gap-8 w-full max-w-[1440px]">
    <div
      className={cn(
        !loading && posts.length == 0 ? "flex" : "grid",
        "grow-1 grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 w-full justify-center gap-6",
      )}
    >
      {loading ? (
        [...Array(POSTS_PER_PAGE)].map((_, i) => (
          <Skeleton className="w-full h-[250px] rounded-lg" key={i} />
        ))
      ) : posts.length > 0 ? (
        posts.map((post, i) => <ContentPost content={post} key={i} />)
      ) : (
        <div className="grow-1 flex flex-col gap-4 justify-center items-center w-full py-12 bg-gray-50 rounded-lg">
          <Icon id="no-mail" size={48} />
          <span>Nenhum post encontrado</span>
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
