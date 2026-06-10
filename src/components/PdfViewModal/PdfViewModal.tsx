"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X, ExternalLink, Loader2, ZoomIn, ZoomOut } from "lucide-react";
import { Document, Page, pdfjs } from "react-pdf";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PdfViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  pdfUrl: string;
  title: string;
}

export function PdfViewerModal({
  isOpen,
  onClose,
  pdfUrl,
  title,
}: PdfViewerModalProps) {
  const [numPages, setNumPages] = React.useState<number | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isError, setIsError] = React.useState(false);
  const [showFallbackMessage, setShowFallbackMessage] = React.useState(false);
  const [containerWidth, setContainerWidth] = React.useState(800);
  const [scale, setScale] = React.useState(1.0);

  // Armazena a proporção de rolagem relativa (focal point) pelo topo
  const [scrollRatio, setScrollRatio] = React.useState<number | null>(null);

  const containerRef = React.useRef<HTMLDivElement>(null);

  const normalizedUrl = React.useMemo(() => {
    if (!pdfUrl) return "";

    return pdfUrl.startsWith("//") ? `https:${pdfUrl}` : pdfUrl;
  }, [pdfUrl]);

  const isContentfulUrl = React.useMemo(() => {
    return normalizedUrl.includes("ctfassets.net");
  }, [normalizedUrl]);

  // Se o PDF for externo, passa pelo proxy para evitar CORS bloqueando o fetch do react-pdf
  const pdfSource = React.useMemo(() => {
    if (!normalizedUrl) return "";
    if (isContentfulUrl) return normalizedUrl;

    return `/api/pdf?url=${encodeURIComponent(normalizedUrl)}`;
  }, [normalizedUrl, isContentfulUrl]);

  // Atualiza a largura para renderizar as páginas com responsividade
  React.useEffect(() => {
    if (!isOpen) return;

    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth - 32);
      }
    };

    updateWidth();
    window.addEventListener("resize", updateWidth);

    return () => window.removeEventListener("resize", updateWidth);
  }, [isOpen]);

  // Reseta estados quando o documento muda ou abre
  React.useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      setIsError(false);
      setNumPages(null);
      setShowFallbackMessage(false);
      setScale(1.0); // Reseta o zoom ao abrir novo PDF
      setScrollRatio(null); // Reseta proporção do scroll
    }
  }, [pdfSource, isOpen]);

  // Temporizador para fallback de carregamento lento
  React.useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isOpen && isLoading) {
      timer = setTimeout(() => {
        setShowFallbackMessage(true);
      }, 5000);
    } else {
      setShowFallbackMessage(false);
    }

    return () => clearTimeout(timer);
  }, [isOpen, isLoading]);

  // Restaura a posição de rolagem com base na nova escala das páginas (estabilizando pelo topo)
  React.useEffect(() => {
    const container = containerRef.current;
    if (container && scrollRatio !== null) {
      const newScrollHeight = container.scrollHeight;

      // Restaura a posição mantendo o topo visual estável
      container.scrollTop = scrollRatio * newScrollHeight;
      setScrollRatio(null); // Limpa o estado temporário
    }
  }, [scale, scrollRatio]);

  // Suporte a zoom por Trackpad (gesto de pinça)
  React.useEffect(() => {
    const container = containerRef.current;
    if (!container || !isOpen) return;

    const handleTrackpadZoom = (e: WheelEvent) => {
      // ctrlKey fica true quando faz gesto de pinça (pinch) no trackpad
      if (e.ctrlKey) {
        e.preventDefault(); // Impede o zoom nativo do navegador na página inteira

        const currentScrollTop = container.scrollTop;
        const currentScrollHeight = container.scrollHeight;

        // Salva a proporção de rolagem atual
        setScrollRatio(currentScrollTop / currentScrollHeight);

        setScale((prevScale) => {
          // deltaY negativo = Zoom In, positivo = Zoom Out
          const factor = e.deltaY < 0 ? 0.05 : -0.05;
          const newScale = prevScale + factor;

          return Math.min(2.5, Math.max(0.5, newScale));
        });
      }
    };

    container.addEventListener("wheel", handleTrackpadZoom, { passive: false });

    return () => {
      container.removeEventListener("wheel", handleTrackpadZoom);
    };
  }, [isOpen]);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setIsLoading(false);
    setIsError(false);
  }

  function onDocumentLoadError() {
    setIsLoading(false);
    setIsError(true);
  }

  // Função centralizada para controlar o zoom e gravar a proporção de rolagem pelo topo
  const handleZoom = (zoomDirection: "in" | "out") => {
    const container = containerRef.current;
    if (container) {
      const currentScrollTop = container.scrollTop;
      const currentScrollHeight = container.scrollHeight;

      // Guarda a proporção de rolagem com base no topo do viewport
      const relativeTop = currentScrollTop / currentScrollHeight;
      setScrollRatio(relativeTop);
    }

    setScale((s) => {
      if (zoomDirection === "in") return Math.min(2.5, s + 0.1);

      return Math.max(0.5, s - 0.1);
    });
  };

  // Multiplica a largura do container pelo fator de escala do zoom
  const pageWidth = Math.min(1000, containerWidth) * scale;

  return (
    <DialogPrimitive.Root
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-[2px] transition-opacity duration-300 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content className="fixed left-[50%] top-[50%] z-50 flex h-[90vh] w-[95vw] max-w-6xl translate-x-[-50%] translate-y-[-50%] flex-col gap-0 rounded-lg border border-[#EFEFEF] bg-white shadow-2xl transition-all duration-300 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 overflow-hidden">
          {/* Cabeçalho */}
          <div className="flex items-center justify-between border-b border-[#EFEFEF] px-6 py-4">
            <div className="flex flex-col gap-1 pr-6">
              <DialogPrimitive.Title className="text-lg font-semibold text-[#292829] line-clamp-1">
                {title}
              </DialogPrimitive.Title>
              <DialogPrimitive.Description className="sr-only">
                Visualizador de documento PDF para {title}
              </DialogPrimitive.Description>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {/* Controles de Zoom */}
              <div className="flex items-center gap-1 bg-[#F5F5F5] rounded-md px-2 py-1 mr-2">
                <button
                  type="button"
                  onClick={() => handleZoom("out")}
                  disabled={scale <= 0.5}
                  className="rounded p-1 text-gray-500 hover:bg-gray-200 hover:text-gray-700 transition disabled:opacity-30 cursor-pointer"
                  title="Diminuir zoom"
                >
                  <ZoomOut className="h-4 w-4" />
                </button>
                <span className="text-xs font-semibold text-gray-600 w-12 text-center select-none">
                  {Math.round(scale * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => handleZoom("in")}
                  disabled={scale >= 2.5}
                  className="rounded p-1 text-gray-500 hover:bg-gray-200 hover:text-gray-700 transition disabled:opacity-30 cursor-pointer"
                  title="Aumentar zoom"
                >
                  <ZoomIn className="h-4 w-4" />
                </button>
              </div>

              {normalizedUrl && (
                <button
                  type="button"
                  onClick={() =>
                    window.open(normalizedUrl, "_blank", "noopener,noreferrer")
                  }
                  className="flex items-center gap-2 rounded-md bg-[#EFEFEF] hover:bg-gray-200 text-gray-700 hover:text-gray-900 px-3 py-2 text-sm font-medium transition duration-200 cursor-pointer"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span className="hidden sm:inline">Abrir em nova aba</span>
                </button>
              )}
              <DialogPrimitive.Close className="rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition duration-200 cursor-pointer">
                <X className="h-5 w-5" />
                <span className="sr-only">Fechar</span>
              </DialogPrimitive.Close>
            </div>
          </div>

          {/* Área de Visualização */}
          <div
            ref={containerRef}
            className="relative w-full flex-1 bg-gray-50 rounded-b-lg overflow-auto p-4 flex flex-col items-center gap-4"
          >
            {/* CSS para redimensionamento instantâneo via GPU sem re-renderizar o canvas */}
            <style>{`
              .react-pdf__Page {
                width: 100% !important;
                height: auto !important;
                display: flex !important;
                justify-content: center !important;
              }
              .react-pdf__Page__canvas {
                width: 100% !important;
                height: auto !important;
                display: block !important;
              }
            `}</style>

            {/* Loading Indicator */}
            {isLoading && normalizedUrl && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 gap-3 p-6 text-center z-10 animate-fade-in">
                <Loader2 className="h-10 w-10 animate-spin text-[#0070f3] dark:text-gray-400" />
                <div className="flex flex-col gap-1">
                  <p className="text-sm text-gray-500 font-medium animate-pulse">
                    Carregando documento...
                  </p>
                  {showFallbackMessage && (
                    <p className="text-xs text-gray-400 mt-2 max-w-md animate-in fade-in duration-300">
                      O documento está demorando para carregar? Você pode{" "}
                      <button
                        type="button"
                        onClick={() =>
                          window.open(
                            normalizedUrl,
                            "_blank",
                            "noopener,noreferrer",
                          )
                        }
                        className="text-[#0070f3] hover:underline font-semibold cursor-pointer"
                      >
                        abri-lo diretamente em uma nova aba
                      </button>
                      .
                    </p>
                  )}
                </div>
              </div>
            )}

            {isError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 gap-2 p-6 text-center z-10">
                <p className="text-sm text-red-500 font-medium">
                  Não foi possível exibir o PDF diretamente nesta página.
                </p>
                {normalizedUrl && (
                  <button
                    type="button"
                    onClick={() =>
                      window.open(
                        normalizedUrl,
                        "_blank",
                        "noopener,noreferrer",
                      )
                    }
                    className="text-[#0070f3] hover:underline text-sm font-semibold mt-2 cursor-pointer"
                  >
                    Tente abrir o documento em uma nova aba
                  </button>
                )}
              </div>
            )}

            {pdfSource ? (
              <Document
                file={pdfSource}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={onDocumentLoadError}
                loading={null}
                error={null}
              >
                {Array.from(new Array(numPages), (el, index) => (
                  <div
                    key={`page_${index + 1}`}
                    className="shadow-md rounded bg-white overflow-hidden border border-gray-200 mb-4 transition-opacity duration-300"
                    style={{
                      width: `${pageWidth}px`,
                      opacity: isLoading ? 0 : 1,
                    }}
                  >
                    <Page
                      pageNumber={index + 1}
                      width={1000} // Resolução fixa de alta qualidade (evita recriação do canvas)
                      renderTextLayer={false}
                      renderAnnotationLayer={false}
                    />
                  </div>
                ))}
              </Document>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 gap-2 p-6 text-center">
                <p className="text-sm text-gray-500 font-medium">
                  Nenhum link de PDF disponível para visualização.
                </p>
              </div>
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
