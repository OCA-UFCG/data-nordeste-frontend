"use client";

import { IPublication } from "@/utils/interfaces";
import {
  Home,
  LeftIcon,
  Menu,
  MenuContainer,
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

const PAGINATION_SIZE = 3;

export const PostsGrid = ({ totalPages }: { totalPages: number }) => {
  const [pages, setpages] = useState(totalPages);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<{ [x: string]: any }>({});
  const [sorting, setSorting] = useState("Data de publicação");
  const [posts, setPosts] = useState<{ fields: IPublication }[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagesRange, setPagesRange] = useState(
    Array.from({ length: pages }, (_, i) => i + 1).slice(0, PAGINATION_SIZE),
  );

  useEffect(() => {
    const updatePaginationButtons = async () => {
      console.log("pages", pages);

      if (pages <= PAGINATION_SIZE) {
        setPagesRange(Array.from({ length: pages }, (_, i) => i + 1));

        return;
      }

      let init = currentPage - PAGINATION_SIZE - 2;
      let end = currentPage + PAGINATION_SIZE - 2;

      if (currentPage + PAGINATION_SIZE > pages) {
        init = pages - PAGINATION_SIZE;
        end = pages;
      } else if (currentPage - PAGINATION_SIZE <= 0) {
        init = 0;
        end = PAGINATION_SIZE;
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

      const newPages = (await getTotalPages(filter)) || 1;
      setpages(newPages);
      setPosts(newPosts);
      setLoading(false);
    };

    updatePosts();
    console.log(pages);
    updatePaginationButtons();
  }, [currentPage, pages, sorting, filter]);

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
      <PostsContainer>
        {loading
          ? [...Array(POSTS_PER_PAGE)].map((_, i) => (
              <Post key={i}>
                <SkeletonCard></SkeletonCard>
              </Post>
            ))
          : posts.map((post, i) => (
              <Post key={i}>
                <ContentPost content={post} />
              </Post>
            ))}
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
