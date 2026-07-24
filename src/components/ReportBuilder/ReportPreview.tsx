import type { ReactElement } from "react";
import { Icon } from "@/components/Icon/Icon";
import { PdfViewer } from "@/components/PdfViewer/PdfViewer";

export type ReportPreviewDocument = {
  fileName: string;
  url: string;
};

/** Displays the generated PDF or its empty state. Example: `<ReportPreview preview={document} />`. */
export function ReportPreview({
  preview,
}: {
  preview: ReportPreviewDocument | null;
}): ReactElement {
  if (!preview) return <EmptyReportPreview />;

  return (
    <div className="min-w-0 lg:sticky lg:top-6 lg:self-start">
      {/* Botão de download visível só no mobile (<lg): a toolbar do PdfViewer
          fica `hidden sm:block`, então no mobile esse botão dá acesso ao PDF. */}
      <div className="mt-4 lg:mt-0 flex px-6 lg:hidden">
        <ReportDownloadButton fileName={preview.fileName} url={preview.url} />
      </div>
      <div className="mt-4 mb-6 lg:mt-0">
        <PdfViewer fileName={preview.fileName} pdfUrl={preview.url} />
      </div>
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

function EmptyReportPreview(): ReactElement {
  return (
    <div className="flex min-h-[320px] items-center justify-center rounded-md border border-dashed border-grey-300 bg-grey-100 px-6 py-10 text-center text-sm leading-6 text-grey-700 lg:min-h-[520px] lg:sticky lg:top-6 lg:h-[calc(100vh-48px)] lg:max-h-[900px]">
      Selecione um município e os temas para visualizar o relatório em PDF.
    </div>
  );
}
