"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  getDocument,
  GlobalWorkerOptions,
  type PDFDocumentProxy,
  type PDFPageProxy,
} from "pdfjs-dist";
import "./PdfViewer.css";

// IMPORTANT: pdf.js requires a web worker to parse PDFs off the main thread.
// The CDN URL must match the installed pdfjs-dist version exactly.
GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs";

type PdfViewerProps = {
  pdfUrl: string;
  fileName: string;
};

const ZOOM_STEP = 0.25;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3;
const INITIAL_ZOOM = 1;

/**
 * Renders a PDF inline with page navigation, zoom, fullscreen, and download.
 *
 * Usage: <PdfViewer pdfUrl="https://example.com/doc.pdf" fileName="report.pdf" />
 */
export const PdfViewer = ({ pdfUrl, fileName }: PdfViewerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [pages, setPages] = useState<number[]>([]);
  const [zoom, setZoom] = useState(INITIAL_ZOOM);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const loadDocument = async () => {
      try {
        const doc = await getDocument({ url: pdfUrl, cMapPacked: true })
          .promise;
        if (cancelled) return;
        setPdfDoc(doc);
        setTotalPages(doc.numPages);
        setPages(Array.from({ length: doc.numPages }, (_, i) => i + 1));
      } catch {
        if (!cancelled) setError(true);
      }
    };

    loadDocument();

    return () => {
      cancelled = true;
    };
  }, [pdfUrl]);

  const goToPage = (p: number) => {
    const el = document.getElementById(`pdf-page-${p}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const goToPreviousPage = () => goToPage(Math.max(1, currentPage - 1));
  const goToNextPage = () => goToPage(Math.min(totalPages, currentPage + 1));

  const zoomIn = () => setZoom((z) => Math.min(MAX_ZOOM, z + ZOOM_STEP));
  const zoomOut = () => setZoom((z) => Math.max(MIN_ZOOM, z - ZOOM_STEP));

  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      containerRef.current.requestFullscreen();
    }
  };

  const handlePageVisible = useCallback((pageNum: number) => {
    setCurrentPage(pageNum);
  }, []);

  if (error) {
    return (
      <div className="pdf-viewer-error" role="alert">
        Um erro ocorreu ao tentar carregar o conteúdo
      </div>
    );
  }

  if (!pdfDoc) {
    return (
      <div className="pdf-viewer-loading" aria-live="polite">
        <div className="pdf-viewer-spinner" />
        <span>Carregando documento...</span>
      </div>
    );
  }

  return (
    <div className="pdf-viewer" ref={containerRef}>
      <div className="hidden sm:block">
        <PdfToolbar
          fileName={fileName}
          currentPage={currentPage}
          totalPages={totalPages}
          zoom={zoom}
          pdfUrl={pdfUrl}
          onPreviousPage={goToPreviousPage}
          onNextPage={goToNextPage}
          onZoomIn={zoomIn}
          onZoomOut={zoomOut}
          onToggleFullscreen={toggleFullscreen}
        />
      </div>
      <div className="pdf-viewer-overlay">
        <div className="pdf-viewer-page-indicator">
          <input
            type="text"
            readOnly
            value={currentPage}
            className="pdf-viewer-page-input"
          />
          <span> / {totalPages}</span>
        </div>
        <button
          onClick={toggleFullscreen}
          className="pdf-viewer-fullscreen-btn"
          aria-label="Tela cheia"
          title="Tela cheia"
        >
          <FullscreenIcon />
        </button>
      </div>
      <div
        className="pdf-viewer-canvas-wrapper"
        style={{ scrollBehavior: "smooth" }}
      >
        <div className="pdf-viewer-pages-column">
          {pages.map((pageNum) => (
            <PdfPage
              key={pageNum}
              pdfDoc={pdfDoc}
              pageNumber={pageNum}
              scale={zoom}
              onVisible={handlePageVisible}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

type PdfToolbarProps = {
  fileName: string;
  currentPage: number;
  totalPages: number;
  zoom: number;
  pdfUrl: string;
  onPreviousPage: () => void;
  onNextPage: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onToggleFullscreen: () => void;
};

const PdfToolbar = ({
  fileName,
  currentPage,
  totalPages,
  zoom,
  pdfUrl,
  onPreviousPage,
  onNextPage,
  onZoomIn,
  onZoomOut,
  onToggleFullscreen,
}: PdfToolbarProps) => (
  <div className="pdf-toolbar">
    <span className="pdf-toolbar-filename" title={fileName}>
      {fileName}
    </span>

    <div className="pdf-toolbar-controls">
      <div className="pdf-toolbar-pages">
        <button
          onClick={onPreviousPage}
          disabled={currentPage <= 1}
          aria-label="Página anterior"
          className="pdf-toolbar-btn"
        >
          ‹
        </button>
        <span className="pdf-toolbar-page-info">
          {currentPage} / {totalPages}
        </span>
        <button
          onClick={onNextPage}
          disabled={currentPage >= totalPages}
          aria-label="Próxima página"
          className="pdf-toolbar-btn"
        >
          ›
        </button>
      </div>

      <div className="pdf-toolbar-separator" />

      <div className="pdf-toolbar-zoom">
        <button
          onClick={onZoomOut}
          disabled={zoom <= MIN_ZOOM}
          aria-label="Diminuir zoom"
          className="pdf-toolbar-btn"
        >
          −
        </button>
        <span className="pdf-toolbar-zoom-level">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={onZoomIn}
          disabled={zoom >= MAX_ZOOM}
          aria-label="Aumentar zoom"
          className="pdf-toolbar-btn"
        >
          +
        </button>
      </div>

      <div className="pdf-toolbar-separator" />

      <button
        onClick={onToggleFullscreen}
        aria-label="Tela cheia"
        className="pdf-toolbar-btn"
        title="Tela cheia"
      >
        <FullscreenIcon />
      </button>
    </div>

    <a
      href={pdfUrl}
      download={fileName}
      target="_blank"
      rel="noopener noreferrer"
      className="pdf-toolbar-download"
    >
      ↓ Baixar PDF
    </a>
  </div>
);

type PdfPageProps = {
  pdfDoc: PDFDocumentProxy | null;
  pageNumber: number;
  scale: number;
  onVisible: (pageNum: number) => void;
};

const PdfPage = ({ pdfDoc, pageNumber, scale, onVisible }: PdfPageProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const renderTaskRef = useRef<ReturnType<PDFPageProxy["render"]> | null>(null);

  // PERF: Lazy render — the canvas is only drawn when the page enters the
  // pre-load window. Once true, this never reverts to false so that scrolling
  // back does not trigger a re-render and the canvas stays in memory.
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    // Guard: skip the entire render pipeline until the page is near the viewport.
    if (!shouldRender) return;

    let cancelled = false;

    const renderPage = async () => {
      if (!pdfDoc || !canvasRef.current || !containerRef.current) return;

      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
        renderTaskRef.current = null;
      }

      try {
        const page = await pdfDoc.getPage(pageNumber);
        if (cancelled) return;

        // INTENTIONAL: On narrow screens, scale the PDF to fit the container
        // width instead of using CSS overrides, which break canvas rendering.
        // We derive the scale from the unscaled (scale=1) page dimensions to
        // avoid floating-point drift that causes sub-pixel distortion.
        const containerWidth = containerRef.current.clientWidth;
        const unscaledViewport = page.getViewport({ scale: 1 });
        const scaledWidth = unscaledViewport.width * scale;
        const needsFit = containerWidth > 0 && scaledWidth > containerWidth;
        const displayWidth = needsFit ? containerWidth : scaledWidth;
        const effectiveScale = displayWidth / unscaledViewport.width;

        const canvas = canvasRef.current;
        const context = canvas.getContext("2d");

        if (!context) return;

        // PERF: Render at a higher resolution (DPR × 2) for sharp images on
        // high-DPI mobile screens, then scale down via CSS for display.
        const devicePixelRatio = window.devicePixelRatio || 1;
        const renderScale = effectiveScale * devicePixelRatio;
        const renderViewport = page.getViewport({ scale: renderScale });
        const displayViewport = page.getViewport({ scale: effectiveScale });

        canvas.width = Math.round(renderViewport.width);
        canvas.height = Math.round(renderViewport.height);
        canvas.style.width = `${Math.round(displayViewport.width)}px`;
        canvas.style.height = `${Math.round(displayViewport.height)}px`;
        context.setTransform(1, 0, 0, 1, 0, 0);

        const task = page.render({
          canvasContext: context,
          viewport: renderViewport,
        });
        renderTaskRef.current = task;
        await task.promise;
      } catch (err: unknown) {
        if (err instanceof Error && err.message.includes("Rendering cancelled"))
          return;
      }
    };

    renderPage();

    return () => {
      cancelled = true;
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }
    };
  }, [pdfDoc, pageNumber, scale, shouldRender]);

  useEffect(() => {
    if (!containerRef.current) return;

    // PERF: Pre-load observer — starts rendering when the page enters a 500px
    // window around the viewport, so the canvas is ready before the user
    // scrolls to it. Using a separate observer from the visibility one below
    // keeps the two concerns independent.
    const preloadObserver = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setShouldRender(true);

          // Once triggered, no need to keep watching this page.
          preloadObserver.disconnect();
        }
      },
      { rootMargin: "500px" },
    );

    // Visibility observer — fires when the page is actually on screen (≥50%
    // visible) to update the page indicator in the toolbar/overlay.
    const visibilityObserver = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onVisible(pageNumber);
        }
      },
      { threshold: 0.5 },
    );

    preloadObserver.observe(containerRef.current);
    visibilityObserver.observe(containerRef.current);

    return () => {
      preloadObserver.disconnect();
      visibilityObserver.disconnect();
    };
  }, [pageNumber, onVisible]);

  return (
    <div
      id={`pdf-page-${pageNumber}`}
      ref={containerRef}
      style={{ width: "100%" }}
    >
      {shouldRender ? (
        <canvas ref={canvasRef} className="pdf-viewer-canvas" />
      ) : (
        <>
          {/* Placeholder preserves the approximate page height so the scroll
	          position doesn't jump when the canvas mounts. A4 ratio (1:1.414)
	          covers the vast majority of PDF documents. */}
          <div className="pdf-viewer-placeholder" aria-hidden="true" />
        </>
      )}
    </div>
  );
};

const FullscreenIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M1 1h5v1.5H2.5V5H1V1zm14 0h-5v1.5h3.5V5H15V1zM1 15h5v-1.5H2.5V11H1v4zm14 0h-5v-1.5h3.5V11H15v4z" />
  </svg>
);
