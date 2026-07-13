import type { ReactElement } from "react";
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
      <PdfViewer fileName={preview.fileName} pdfUrl={preview.url} />
    </div>
  );
}

function EmptyReportPreview(): ReactElement {
  return (
    <div className="flex min-h-[520px] items-center justify-center rounded-md border border-dashed border-grey-300 bg-grey-100 px-6 text-center text-sm leading-6 text-grey-700 lg:sticky lg:top-6 lg:h-[calc(100vh-48px)] lg:max-h-[900px]">
      Selecione um município e os temas para visualizar o relatório em PDF.
    </div>
  );
}
