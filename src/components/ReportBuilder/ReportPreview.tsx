"use client";

import type { ReactElement } from "react";
import { useEffect, useState } from "react";
import { Icon } from "@/components/Icon/Icon";
import { PdfViewer } from "@/components/PdfViewer/PdfViewer";
import "./ReportPreview.css";

export type ReportPreviewDocument = {
  fileName: string;
  url: string;
};

// Report generation is a single request/response with no server-reported
// progress, so completion is simulated: ease toward 99% while waiting and
// hold at 100% for a beat once the response lands, so the ring never jumps
// straight from a low number to the finished report.
//
// The step is proportional to the remaining distance to the cap (not a fixed
// amount), so the climb decelerates the closer it gets — spreading visible
// progress across the whole real wait instead of hitting 99% in the first
// couple seconds and then appearing frozen until the response lands.
const SIMULATED_PROGRESS_CAP = 99;
const SIMULATED_PROGRESS_INTERVAL_MS = 400;
const SIMULATED_PROGRESS_EASE_FACTOR = 0.05;
const COMPLETE_HOLD_MS = 500;

function useSimulatedReportProgress(loading: boolean): {
  showLoading: boolean;
  percent: number;
} {
  const [percent, setPercent] = useState(0);
  const [showLoading, setShowLoading] = useState(loading);

  useEffect(() => {
    if (!loading) {
      setPercent(100);
      const timeout = setTimeout(() => setShowLoading(false), COMPLETE_HOLD_MS);

      return () => clearTimeout(timeout);
    }

    setShowLoading(true);
    setPercent(0);
    const interval = setInterval(() => {
      setPercent((prev) => {
        const remaining = SIMULATED_PROGRESS_CAP - prev;

        return prev + remaining * SIMULATED_PROGRESS_EASE_FACTOR < 1
          ? prev + 1
          : prev + remaining * SIMULATED_PROGRESS_EASE_FACTOR;
      });
    }, SIMULATED_PROGRESS_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [loading]);

  return { showLoading, percent: Math.round(percent) };
}

export function ReportPreview({
  loading,
  preview,
}: {
  loading: boolean;
  preview: ReportPreviewDocument | null;
}): ReactElement {
  const { showLoading, percent } = useSimulatedReportProgress(loading);

  if (showLoading) {
    return (
      <PdfViewer
        emptyState={<LoadingPreviewState percent={percent} />}
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

const PROGRESS_RING_RADIUS = 54;
const PROGRESS_RING_CIRCUMFERENCE = 2 * Math.PI * PROGRESS_RING_RADIUS;

function LoadingPreviewState({ percent }: { percent: number }): ReactElement {
  const offset =
    PROGRESS_RING_CIRCUMFERENCE * (1 - Math.min(percent, 100) / 100);

  return (
    <div
      aria-label={`Carregando o seu relatório: ${percent}%`}
      aria-live="polite"
      className="report-preview-loading"
      role="status"
    >
      <div className="report-preview-loading-ring">
        <svg height="124" viewBox="0 0 124 124" width="124">
          <circle
            className="report-preview-loading-ring-track"
            cx="62"
            cy="62"
            fill="none"
            r={PROGRESS_RING_RADIUS}
            strokeWidth="14"
          />
          <circle
            className="report-preview-loading-ring-progress"
            cx="62"
            cy="62"
            fill="none"
            r={PROGRESS_RING_RADIUS}
            strokeDasharray={PROGRESS_RING_CIRCUMFERENCE}
            strokeDashoffset={offset}
            strokeLinecap="round"
            strokeWidth="14"
          />
        </svg>
        <span aria-hidden="true" className="report-preview-loading-percent">
          {percent}%
        </span>
      </div>
      <p>Carregando seu Relatório</p>
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
