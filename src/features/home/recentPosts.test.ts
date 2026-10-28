import { describe, expect, it } from "vitest";
import { RECENT_POSTS_BY_TAB_QUERY } from "@/utils/queries";
import { fetchRecentPostsByTab } from "./recentPosts";

const recentPost = (title: string) => ({
  title,
  link: `/posts/${title}`,
  thumb: { url: "/thumb.png" },
  type: "newsletter",
  date: "2024-01-01",
});

class FakeRecentPostsContentfulClient {
  calls: { query: string; variables: object | undefined }[] = [];

  request = async <T>(query: string, variables?: object): Promise<T> => {
    this.calls.push({ query, variables });

    return {
      all: { items: [recentPost("todos")] },
      panels: { items: [recentPost("painel")] },
      stories: { items: [recentPost("narrativa")] },
      newsletters: { items: [recentPost("boletim")] },
      publications: { items: [recentPost("publicacao")] },
    } as T;
  };
}

describe("fetchRecentPostsByTab", () => {
  it("loads every tab with one Contentful operation", async () => {
    const fakeClient = new FakeRecentPostsContentfulClient();

    const result = await fetchRecentPostsByTab(fakeClient.request);

    expect(fakeClient.calls).toHaveLength(1);
    expect(fakeClient.calls[0].query).toBe(RECENT_POSTS_BY_TAB_QUERY);
    expect(fakeClient.calls[0].variables).toEqual({
      allFilter: {
        type_in: [
          "data-panel",
          "newsletter",
          "additional-content",
          "data-story",
        ],
      },
      panelsFilter: { type_in: ["data-panel"] },
      storiesFilter: { type_in: ["data-story"] },
      newslettersFilter: { type_in: ["newsletter"] },
      publicationsFilter: { type_in: ["data-story", "newsletter"] },
    });
    expect(result.panels[0].title).toBe("painel");
    expect(result.publications[0].title).toBe("publicacao");
  });
});
