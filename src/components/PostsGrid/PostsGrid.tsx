import { IPublication } from "@/utils/interfaces";
import ContentPost from "../ContentPost/ContentPost";
import { POSTS_PER_PAGE } from "@/utils/constants";
import { Skeleton } from "../ui/skeleton";
import { Icon } from "../Icon/Icon";
import { PaginationBar } from "../PaginationBar/PaginationBar";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { exploreCardTransitionName } from "@/features/explore/viewTransition";

export const PostsGrid = ({
  currentPage,
  pages,
  posts = [],
  loading,
  searchQuery,
  preservePostsWhileLoading = false,
  clientSidePagination = false,
}: {
  currentPage: number;
  loading: boolean;
  pages: number;
  posts: IPublication[];
  searchQuery?: string;
  preservePostsWhileLoading?: boolean;
  clientSidePagination?: boolean;
}) => (
  <div
    aria-busy={loading}
    className="relative grow-1 flex flex-col items-center gap-8 w-full max-w-[1440px]"
  >
    {loading && preservePostsWhileLoading && (
      <div className="absolute inset-x-0 top-2 z-10 flex justify-center pointer-events-none">
        <span className="flex items-center gap-2 rounded-full bg-white px-3 py-2 text-sm text-grey-600 shadow-sm">
          <Loader2 aria-hidden className="size-4 animate-spin" />
          Atualizando resultados
        </span>
      </div>
    )}
    <div
      className={cn(
        !loading && posts.length == 0 ? "flex" : "grid",
        "grow-1 grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 w-full justify-center gap-6",
        loading && preservePostsWhileLoading && "opacity-55 transition-opacity",
      )}
    >
      {loading && !preservePostsWhileLoading ? (
        [...Array(POSTS_PER_PAGE)].map((_, i) => (
          <Skeleton className="w-full h-[250px] rounded-lg" key={i} />
        ))
      ) : posts.length > 0 ? (
        posts.map((post) => {
          const postId = post.sys?.id ?? `${post.type}-${post.link}`;

          return (
            <div
              className="h-full"
              key={postId}
              style={{ viewTransitionName: exploreCardTransitionName(postId) }}
            >
              <ContentPost content={post} />
            </div>
          );
        })
      ) : (
        <div className="grow-1 flex flex-col gap-4 justify-center items-center w-full py-12 bg-gray-50 rounded-lg">
          <Icon id="no-mail" size={48} />
          <span>
            {searchQuery
              ? `Nenhum resultado para "${searchQuery}"`
              : "Nenhum post encontrado"}
          </span>
        </div>
      )}
    </div>
    <PaginationBar
      currentPage={currentPage}
      totalPages={pages}
      loading={loading}
      clientSideNavigation={clientSidePagination}
    />
  </div>
);
