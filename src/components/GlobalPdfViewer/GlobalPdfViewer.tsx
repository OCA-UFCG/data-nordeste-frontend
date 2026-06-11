"use client";

import * as React from "react";
import dynamic from "next/dynamic";

const PdfViewerModal = dynamic(
  () =>
    import("../PdfViewModal/PdfViewModal").then((mod) => mod.PdfViewerModal),
  { ssr: false },
);

function extractPdfTitle(anchor: HTMLAnchorElement): string {
  const titleAttr = anchor.getAttribute("title");
  if (titleAttr) return titleAttr;

  const srOnly = anchor.querySelector(".sr-only");
  if (srOnly?.textContent) return srOnly.textContent.trim();

  const p = anchor.querySelector("p");
  const fallback =
    p?.textContent?.trim() || anchor.textContent?.trim() || "Documento PDF";

  return fallback.startsWith("Acessar Painel")
    ? fallback.replace("Acessar Painel", "").trim() || "Painel de Dados"
    : fallback;
}

function isPdfLink(anchor: HTMLAnchorElement): boolean {
  if (anchor.getAttribute("data-pdf") === "true") return true;

  const href = anchor.getAttribute("href");
  if (!href) return false;

  const isPdf = href.toLowerCase().includes(".pdf");
  if (!isPdf) return false;

  const isDownload =
    anchor.hasAttribute("download") || anchor.hasAttribute("data-no-embed");

  return !isDownload;
}

export default function GlobalPdfViewer() {
  const [activePdf, setActivePdf] = React.useState<{
    url: string;
    title: string;
  } | null>(null);

  React.useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest("a");

      if (!anchor || !isPdfLink(anchor)) return;

      e.preventDefault();
      e.stopPropagation();

      const href = anchor.getAttribute("href") || "";
      const title = extractPdfTitle(anchor);
      setActivePdf({ url: href, title });
    };

    document.addEventListener("click", handleGlobalClick, true);

    return () => {
      document.removeEventListener("click", handleGlobalClick, true);
    };
  }, []);

  return (
    <PdfViewerModal
      isOpen={activePdf !== null}
      onClose={() => setActivePdf(null)}
      pdfUrl={activePdf?.url || ""}
      title={activePdf?.title || ""}
    />
  );
}
