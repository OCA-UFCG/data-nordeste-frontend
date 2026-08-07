import type { ReactElement } from "react";
import { Icon } from "@/components/Icon/Icon";
import { PdfViewer } from "@/components/PdfViewer/PdfViewer";
import "./ReportPreview.css";

export type ReportPreviewDocument = {
  fileName: string;
  url: string;
};

export function ReportPreview({
  loading,
  preview,
}: {
  loading: boolean;
  preview: ReportPreviewDocument | null;
}): ReactElement {
  if (loading) {
    return (
      <PdfViewer
        emptyState={<LoadingPreviewState />}
        fileName="relatorio.pdf"
        pdfUrl=""
      />
    );
  }

  if (!preview) {
    return (
      <PdfViewer
        emptyState={<EmptyPreviewCard />}
        fileName="relatorio.pdf"
        pdfUrl=""
      />
    );
  }

  return (
    <div className="min-w-0 h-full">
      <div className="mt-4 lg:mt-0 flex px-6 lg:hidden">
        <ReportDownloadButton fileName={preview.fileName} url={preview.url} />
      </div>
      <div className="mt-4 mb-6 lg:mt-0 lg:mb-0 h-full">
        <PdfViewer fileName={preview.fileName} pdfUrl={preview.url} />
      </div>
    </div>
  );
}

function LoadingPreviewState(): ReactElement {
  return (
    <div
      aria-label="Carregando o seu relatório"
      aria-live="polite"
      className="report-preview-loading"
      role="status"
    >
      <span aria-hidden="true" className="report-preview-loading-spinner" />
      <p>Carregando o seu relatório</p>
    </div>
  );
}

function ReportDownloadButton({
  fileName,
  url,
}: {
  fileName: string;
  url: string;
}): ReactElement {
  return (
    <a
      className="flex h-10 w-full flex-1 items-center justify-center gap-2 rounded bg-[#018F39] px-4 text-sm font-medium leading-6 text-[#F8F7F8] transition-colors hover:bg-[#077432]"
      download={fileName}
      href={url}
      rel="noopener noreferrer"
      target="_blank"
    >
      <Icon id="download" size={16} />
      Baixar PDF
    </a>
  );
}

function EmptyPreviewCard(): ReactElement {
  return (
    <div className="pdf-viewer-empty-card">
      <Icon id="info" size={20} className="pdf-viewer-empty-icon" />
      <p className="pdf-viewer-empty-text">
        Selecione as informações ao lado primeiro para gerar um relatório
      </p>
    </div>
  );
}
