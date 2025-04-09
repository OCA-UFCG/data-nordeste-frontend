"use client";
import { IPublication } from "@/utils/interfaces";
import {
  Home,
  LeftIcon,
  Menu,
  MenuContainer,
  NoContent,
  Pagination,
  PaginationButton,
  Post,
  PostsContainer,
  RightIcon,
  SkeletonCard,
  Wrapper,
} from "./PostsGrid.styles";
import ContentPost from "../ContentPost/ContentPost";
import { useEffect, useState } from "react";
import { getPosts, getTotalPages } from "@/utils/functions";
import { POSTS_PER_PAGE } from "@/utils/constants";
import { SortMenu } from "../SortMenu/SortMenu";
import { FilterMenu } from "../FilterMenu/FilterMenu";
import { Icon } from "../Icon/Icon";

const PAGINATION_SIZE = 3;

export const PostsGrid = ({ totalPages }: { totalPages: number }) => {
  const [pages, setpages] = useState(totalPages);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<{ [x: string]: string }>({});
  const [sorting, setSorting] = useState("Data de publicação");
  const [posts, setPosts] = useState<{ fields: IPublication }[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagesRange, setPagesRange] = useState(
    Array.from({ length: pages }, (_, i) => i + 1).slice(0, PAGINATION_SIZE),
  );

  useEffect(() => {
    const updatePaginationButtons = async () => {
      let init = 0;
      let end = pages;

      if (pages >= PAGINATION_SIZE) {
        init = currentPage - PAGINATION_SIZE - 2;
        end = currentPage + PAGINATION_SIZE - 2;

        if (currentPage + PAGINATION_SIZE > pages) {
          init = pages - PAGINATION_SIZE;
          end = pages;
        } else if (currentPage - PAGINATION_SIZE <= 0) {
          init = 0;
          end = PAGINATION_SIZE;
        }
      }

      setPagesRange(
        Array.from({ length: pages }, (_, i) => i + 1).slice(init, end),
      );
    };

    const updatePosts = async () => {
      setLoading(true);
      const newPosts = await getPosts(
        sorting,
        currentPage,
        POSTS_PER_PAGE,
        filter,
      );
      setPosts(newPosts);

      const newPages = (await getTotalPages(filter)) || 1;
      setpages(newPages);
      setLoading(false);
    };

    updatePosts();
    updatePaginationButtons();
  }, [currentPage, pages, sorting, filter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [sorting, filter]);

  return (
    <Wrapper>
      <MenuContainer>
        <Home href="/">
          <LeftIcon id="expand" size={10} />
          <span>Início</span>
        </Home>
        <Menu>
          <FilterMenu onSubmit={(form) => setFilter(form)} />
          <SortMenu onClick={(sortType: string) => setSorting(sortType)} />
        </Menu>
      </MenuContainer>
      <PostsContainer $posts={(!loading && posts.length > 0).toString()}>
        {loading ? (
          [...Array(POSTS_PER_PAGE)].map((_, i) => (
            <Post key={i}>
              <SkeletonCard></SkeletonCard>
            </Post>
          ))
        ) : posts.length > 0 ? (
          posts.map((post, i) => (
            <Post key={i}>
              <ContentPost content={post} />
            </Post>
          ))
        ) : (
          <NoContent>
            <Icon id="no-mail" size={48} />
            <span>Nenhum post encontrado</span>
          </NoContent>
        )}
      </PostsContainer>
      <Pagination>
        <PaginationButton
          disabled={currentPage === 1}
          onClick={() => setCurrentPage(currentPage - 1)}
        >
          <LeftIcon id="expand" size={10} />
        </PaginationButton>

        {pagesRange.map((i) => (
          <PaginationButton
            key={i}
            onClick={() => setCurrentPage(i)}
            disabled={currentPage === i}
            selected={i === currentPage ? "selected" : ""}
          >
            {i}
          </PaginationButton>
        ))}
        <PaginationButton
          disabled={currentPage === pages}
          onClick={() => setCurrentPage(currentPage + 1)}
        >
          <RightIcon id="expand" size={10} />
        </PaginationButton>
      </Pagination>
    </Wrapper>
  );
};
