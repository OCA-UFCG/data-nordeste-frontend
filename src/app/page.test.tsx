import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { getContent } from "@/utils/contentful";

vi.mock("@/utils/contentful", () => ({
  getContent: vi.fn(),
}));

vi.mock("@/templates/HubTemplate", () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <main>{children}</main>
  ),
}));

vi.mock("@/components/BannerCarousel/BannerCarousel", () => ({
  default: ({ content }: { content: { title: string }[] }) => (
    <section>Banner: {content[0]?.title}</section>
  ),
}));

vi.mock("@/components/PreviewSection/PreviewSection", () => ({
  default: ({ header }: { header?: { title: string } }) => (
    <section>Preview: {header?.title}</section>
  ),
}));

vi.mock("@/components/RecentSection/RecentSection", () => ({
  RecentSection: ({ header }: { header?: { title: string } }) => (
    <section>Recentes: {header?.title}</section>
  ),
}));

vi.mock("@/components/DataSection/DataSection", () => ({
  default: ({ header }: { header?: { title: string } }) => (
    <section>Dados: {header?.title}</section>
  ),
}));

vi.mock("@/components/AboutSection/AboutSection", () => ({
  AboutSection: ({ header }: { header?: { title: string } }) => (
    <section>Sobre: {header?.title}</section>
  ),
}));

vi.mock("@/components/ProjectSection/ProjectSection", () => ({
  ProjectSection: ({ header }: { header?: { title: string } }) => (
    <section>Projetos: {header?.title}</section>
  ),
}));

vi.mock("@/components/FeedbackSurvey/FeedbackSurvey", () => ({
  FeedbackSurvey: ({
    header,
    submitHeader,
  }: {
    header?: { title: string };
    submitHeader?: { title: string };
  }) => (
    <section>
      Survey: {header?.title} / {submitHeader?.title}
    </section>
  ),
}));

const sectionHeadItems = [
  { id: "preview", title: "Indicadores", subtitle: "" },
  { id: "new", title: "Novidades", subtitle: "" },
  { id: "panels", title: "Painéis", subtitle: "" },
  { id: "about", title: "Sobre", subtitle: "" },
  { id: "projects", title: "Projetos", subtitle: "" },
  { id: "survey", title: "Pesquisa", subtitle: "" },
  { id: "survey-thank-u", title: "Obrigado", subtitle: "" },
];

describe("Home page", () => {
  it("renders homepage sections from fake Contentful data", async () => {
    vi.mocked(getContent).mockResolvedValue({
      partnersCollection: { items: [] },
      postCollection: { items: [] },
      themeCollection: { items: [] },
      mainBannerCollection: { items: [{ title: "Data Nordeste" }] },
      previewCardsCollection: { items: [] },
      sectionHeadCollection: { items: sectionHeadItems },
      feedbackCollection: { items: [] },
    });
    const { default: Home } = await import("./page");

    render(await Home());

    expect(screen.getByText("Banner: Data Nordeste")).toBeInTheDocument();
    expect(screen.getByText("Preview: Indicadores")).toBeInTheDocument();
    expect(screen.getByText("Recentes: Novidades")).toBeInTheDocument();
    expect(screen.getByText("Dados: Painéis")).toBeInTheDocument();
    expect(screen.getByText("Survey: Pesquisa / Obrigado")).toBeInTheDocument();
  });
});
