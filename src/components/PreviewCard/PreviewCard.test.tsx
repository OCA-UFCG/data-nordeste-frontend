import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { IPreviewCard } from "@/utils/interfaces";
import PreviewCard from "./PreviewCard";

const previewWithContentfulIcon = {
  title: "Indicador de saúde",
  subtitle: "Nordeste",
  data: "42%",
  note: "Valor de referência",
  link: "/explore",
  category: {
    id: "saude",
    name: "Saúde",
    color: "#007A33",
  },
  iconsvg: { url: "//cdn.example.com/health.svg" },
} satisfies IPreviewCard;

describe("PreviewCard", () => {
  it("renders the custom Contentful icon with an HTTPS URL", () => {
    const { container } = render(
      <PreviewCard content={previewWithContentfulIcon} />,
    );

    expect(container.querySelector("img")).toHaveAttribute(
      "src",
      "https://cdn.example.com/health.svg",
    );
  });
});
