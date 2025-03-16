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
import { getPosts } from "@/utils/functions";
import { POSTS_PER_PAGE } from "@/utils/constants";
import { Filter } from "../Filter/Filter";
import { SortMenu } from "../SortMenu/SortMenu";

const PAGINATION_SIZE = 3;

export const PostsGrid = ({ pages }: { pages: number }) => {
  const [loading, setLoading] = useState(true);
  const [sorting, setSorting] = useState("Data de publicação");
  const [posts, setPosts] = useState<{ fields: IPublication }[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagesRange, setPagesRange] = useState(
    Array.from({ length: pages }, (_, i) => i + 1).slice(0, PAGINATION_SIZE),
  );

  useEffect(() => {
    const updatePaginationButtons = async () => {
      if (pages <= PAGINATION_SIZE) {
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
      const newPosts = await getPosts(sorting, currentPage, POSTS_PER_PAGE);
      setPosts(newPosts);
      setLoading(false);
    };

    updatePosts();
    updatePaginationButtons();
  }, [currentPage, pages, sorting]);

  return (
    <Wrapper>
      <MenuContainer>
        <Home href="/">
          <LeftIcon id="expand" size={10} />
          <span>Início</span>
        </Home>
        <Menu>
          <Filter />
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
