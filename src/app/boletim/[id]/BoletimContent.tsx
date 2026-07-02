"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { RelatedBoletinsSection } from "@/components/RelatedBoletinsSection/RelatedBoletinsSection";
import type { BoletimDetail, RelatedBoletim } from "@/features/boletim/types";
import { documentToReactComponents } from "@contentful/rich-text-react-renderer";
import type { ContentfulRichTextField } from "@/utils/interfaces";

// PERF: pdf.js is one of the largest client dependencies. Keep it out of the
// initial boletim bundle and show stable space while its chunk is requested.
const PdfViewer = dynamic(
  () =>
    import("@/components/PdfViewer/PdfViewer").then(
      (module) => module.PdfViewer,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="pdf-viewer-loading" aria-live="polite">
        <div className="pdf-viewer-spinner" />
        <span>Carregando visualizador...</span>
      </div>
    ),
  },
);

type BoletimContentProps = {
  boletim: BoletimDetail;
  pdfFileName: string;
  relatedBoletins: RelatedBoletim[];
};

export const BoletimContent = ({
  boletim,
  pdfFileName,
  relatedBoletins,
}: BoletimContentProps) => {
  const dateObj = boletim.date ? new Date(boletim.date) : null;
  const formattedDate = dateObj ? dateObj.toLocaleDateString("pt-BR") : "";

  const finalPdfUrl = `/api/pdf-proxy?url=${encodeURIComponent(boletim.link)}`;

  const category = boletim.categoryCollection?.items?.[0];
  const categoryId = category?.sys?.id;
  const categoryName = category?.name;

  return (
    <>
      <section className="w-full bg-white overflow-x-hidden">
        <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-20 py-8">
          <BoletimHeader
            title={boletim.title}
            description={boletim.description}
            formattedDate={formattedDate}
            pdfUrl={finalPdfUrl}
            pdfFileName={pdfFileName}
          />
          <div className="mt-6 -mx-4 sm:mx-0">
            <PdfViewer pdfUrl={finalPdfUrl} fileName={pdfFileName} />
          </div>

          {categoryName && categoryId && (
            <Link
              href={`/explore?category=${categoryId}&page=1`}
              className="mt-8 flex w-full items-center justify-center gap-2 rounded-md bg-[#078f39] px-4 py-4 text-sm font-medium text-white transition hover:bg-[#067430]"
            >
              Ver mais sobre o tema
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M6 3.5L10.5 8L6 12.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
          )}
        </div>
      </section>

      <RelatedBoletinsSection items={relatedBoletins} />
    </>
  );
};

type BoletimHeaderProps = {
  title: string;
  description?: ContentfulRichTextField;
  formattedDate: string;
  pdfUrl: string;
  pdfFileName: string;
};

const BoletimHeader = ({
  title,
  description,
  formattedDate,
  pdfUrl,
  pdfFileName,
}: BoletimHeaderProps) => (
  <div className="flex flex-col gap-3">
    <div className="flex items-start justify-between gap-4 flex-wrap">
      <h1 className="text-2xl md:text-3xl font-semibold text-[#292829]">
        {title}
      </h1>
      <div className="flex items-center gap-3 shrink-0">
        {formattedDate && (
          <span className="text-sm font-medium text-[#292829]">
            <span className="hidden sm:inline">Publicado em: </span>
            {formattedDate}
          </span>
        )}
      </div>
    </div>
    {description?.json && (
      <div className="text-base text-[#525659] leading-relaxed">
        {documentToReactComponents(description.json)}
      </div>
    )}
    <a
      href={pdfUrl}
      download={pdfFileName}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-4 flex w-full sm:hidden items-center justify-center gap-2 rounded-md bg-[#078f39] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#067430]"
    >
      <DownloadIcon />
      Baixar PDF
    </a>
  </div>
);

const DownloadIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M8 12l-4-4h2.5V1h3v7H12L8 12zm5 2H3v-2H1v3.5A1.5 1.5 0 002.5 17h11a1.5 1.5 0 001.5-1.5V12h-2v2z" />
  </svg>
);
