import type { ReactElement } from "react";

export type ReportPreviewDocument = {
  fileName: string;
  url: string;
};

/** Displays the generated report or its empty state. Example: `<ReportPreview preview={document} />`. */
export function ReportPreview({
  preview,
}: {
  preview: ReportPreviewDocument | null;
}): ReactElement {
  if (!preview) return <EmptyReportPreview />;

  return (
    <div className="min-w-0 lg:sticky lg:top-6 lg:self-start">
      {/* The generation endpoint returns HTML. The iframe keeps its
          print-oriented styles isolated from the portal. */}
      <iframe
        className="h-[calc(100vh-48px)] min-h-[520px] w-full rounded-md border border-grey-300 bg-white"
        src={preview.url}
        title={`Relatório ${preview.fileName}`}
      />
    </div>
  );
}

function EmptyReportPreview(): ReactElement {
  return (
    <div className="flex min-h-[320px] items-center justify-center rounded-md border border-dashed border-grey-300 bg-grey-100 px-6 py-10 text-center text-sm leading-6 text-grey-700 lg:min-h-[520px] lg:sticky lg:top-6 lg:h-[calc(100vh-48px)] lg:max-h-[900px]">
      Selecione um município e os temas para visualizar o relatório.
    </div>
  );
}
