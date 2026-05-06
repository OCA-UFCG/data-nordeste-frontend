import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ReactNode, createContext, useContext } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import PreviewContent from "./PreviewContent";
import { IPreviewCard, IPreviewCards } from "@/utils/interfaces";

vi.mock("@/components/ui/select", () => {
  const SelectContext = createContext<(value: string) => void>(() => {});

  return {
    Select: ({
      children,
      onValueChange,
    }: {
      children: ReactNode;
      onValueChange: (value: string) => void;
    }) => (
      <SelectContext.Provider value={onValueChange}>
        <div>{children}</div>
      </SelectContext.Provider>
    ),
    SelectContent: ({ children }: { children: ReactNode }) => (
      <div>{children}</div>
    ),
    SelectGroup: ({ children }: { children: ReactNode }) => (
      <div>{children}</div>
    ),
    SelectItem: ({
      children,
      value,
    }: {
      children: ReactNode;
      value: string;
    }) => {
      const onValueChange = useContext(SelectContext);

      return (
        <button type="button" onClick={() => onValueChange(value)}>
          {children}
        </button>
      );
    },
    SelectLabel: ({ children }: { children: ReactNode }) => (
      <span>{children}</span>
    ),
    SelectTrigger: ({ children }: { children: ReactNode }) => (
      <div>{children}</div>
    ),
    SelectValue: ({ placeholder }: { placeholder: string }) => (
      <span>{placeholder}</span>
    ),
  };
});

vi.mock("@/components/CardCarousel/CardCarousel", () => ({
  CardCarousel: ({ items }: { items: IPreviewCard[] }) => (
    <div>
      {items.map((item) => (
        <article key={`${item.title}-${item.data}`}>
          <h3>{item.title}</h3>
          <p>{item.data}</p>
          <p>{item.note}</p>
        </article>
      ))}
    </div>
  ),
}));

const cards = [
  {
    title: "ignored",
    category: {
      name: "Saúde",
      id: "saude",
      color: "#018F39",
      sys: { id: "theme-saude" },
      description: { json: {} },
      article: { json: {} },
      articleTitle: "",
      banner: { url: "" },
      tags: [],
    },
    jsonFile: {
      region: "Nordeste",
      title: "Cobertura vacinal",
      subtitle: "2024",
      data: "85%",
      link: "/regional",
      note: "Dado regional",
      states: [
        {
          name: "Pernambuco",
          data: "91%",
          link: "/pe",
          note: "Dado estadual",
        },
      ],
    },
  },
] satisfies IPreviewCards[];

describe("PreviewContent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updates displayed preview cards when a state is selected", async () => {
    render(
      <PreviewContent
        header={{ id: "preview", title: "Indicadores", subtitle: "" }}
        cards={cards}
      />,
    );

    expect(screen.getByText("Indicadores")).toBeInTheDocument();
    expect(screen.getByText("85%")).toBeInTheDocument();
    expect(screen.getByText("Dado regional")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Pernambuco" }));

    expect(screen.getByText("91%")).toBeInTheDocument();
    expect(screen.getByText("Dado estadual")).toBeInTheDocument();
  });
});
