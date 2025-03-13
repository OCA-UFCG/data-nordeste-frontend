"use client";

import { IPublication } from "@/utils/interfaces";
import {
  LeftIcon,
  Pagination,
  PaginationButton,
  Post,
  PostsContainer,
  RightIcon,
  Wrapper,
} from "./PostsGrid.styles";
import ContentPost from "../ContentPost/ContentPost";
import { useEffect, useState } from "react";

const PAGINATION_SIZE = 3;

export const PostsGrid = ({
  loading = false,
  pages,
  posts,
}: {
  loading?: boolean;
  pages: number;
  posts: { fields: IPublication }[];
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pagesRange, setPagesRange] = useState(
    Array.from({ length: pages }, (_, i) => i + 1).slice(0, 3),
  );

  useEffect(() => {
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
  }, [currentPage, pages]);

  return (
    <Wrapper>
      <PostsContainer>
        {loading ? (
          <></>
        ) : (
          posts.map((post, i) => (
            <Post key={i}>
              <ContentPost content={post} />
            </Post>
          ))
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
