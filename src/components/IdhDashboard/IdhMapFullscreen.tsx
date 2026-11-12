"use client";

import {
  type Dispatch,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
  type RefObject,
  type SetStateAction,
  useEffect,
  useRef,
  useState,
} from "react";
import { IdhIcon, type IdhIconName } from "@/components/IdhDashboard/IdhIcon";
import {
  IdhMapLegend,
  IdhStateMap,
} from "@/components/IdhDashboard/IdhStateMap";
import { ICON_BUTTON } from "@/components/IdhDashboard/idhStyles";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ChoroplethRegion } from "@/features/panels/chartOptions";
import { IDH_MAP_BOX } from "@/features/panels/idh/idhStateShapes";
import {
  MAX_MAP_ZOOM,
  panViewBox,
  type ViewBox,
  viewBoxAttribute,
  zoomViewBox,
} from "@/features/panels/mapViewBox";

const BASE: ViewBox = { x: 0, y: 0, ...IDH_MAP_BOX };

// Passo dos botões e das teclas (1,5×) e da roda do mouse (1,2×).
const BUTTON_STEP = 1.5;
const WHEEL_STEP = 1.2;

// Arrastar menos que isso ainda conta como clique num estado.
const DRAG_THRESHOLD = 5;

// Escala e margens do SVG na tela (preserveAspectRatio "meet"), para converter
// pixels do ponteiro em unidades do mapa.
const svgMetrics = (svg: SVGSVGElement, view: ViewBox) => {
  const rect = svg.getBoundingClientRect();
  const scale = Math.min(rect.width / view.width, rect.height / view.height);

  return {
    rect,
    scale,
    offsetX: (rect.width - view.width * scale) / 2,
    offsetY: (rect.height - view.height * scale) / 2,
  };
};

const focusAt = (
  svg: SVGSVGElement,
  view: ViewBox,
  clientX: number,
  clientY: number,
) => {
  const { rect, scale, offsetX, offsetY } = svgMetrics(svg, view);

  return {
    x: (clientX - rect.left - offsetX) / (view.width * scale),
    y: (clientY - rect.top - offsetY) / (view.height * scale),
  };
};

const useWheelZoom = (
  svgRef: RefObject<SVGSVGElement | null>,
  setView: Dispatch<SetStateAction<ViewBox>>,
) => {
  useEffect(() => {
    const svg = svgRef.current;

    if (!svg) return;

    // Fora do React: o onWheel dele é passivo e não deixa impedir a rolagem.
    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      setView((view) =>
        zoomViewBox(
          view,
          BASE,
          event.deltaY < 0 ? WHEEL_STEP : 1 / WHEEL_STEP,
          focusAt(svg, view, event.clientX, event.clientY),
        ),
      );
    };

    svg.addEventListener("wheel", handleWheel, { passive: false });

    return () => svg.removeEventListener("wheel", handleWheel);
  }, [svgRef, setView]);
};

type Drag = { x: number; y: number; view: ViewBox; moved: boolean };

const useDragPan = (
  svgRef: RefObject<SVGSVGElement | null>,
  view: ViewBox,
  setView: (view: ViewBox) => void,
) => {
  const drag = useRef<Drag | null>(null);
  const moved = useRef(false);

  return {
    onPointerDown: (event: PointerEvent<HTMLDivElement>) => {
      if ((event.target as Element).closest("[data-map-controls]")) return;
      drag.current = { x: event.clientX, y: event.clientY, view, moved: false };
      moved.current = false;
    },
    onPointerMove: (event: PointerEvent<HTMLDivElement>) => {
      const start = drag.current;
      const svg = svgRef.current;

      if (!start || !svg) return;
      const dx = event.clientX - start.x;
      const dy = event.clientY - start.y;

      if (!start.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
      start.moved = moved.current = true;
      const { scale } = svgMetrics(svg, start.view);

      setView(panViewBox(start.view, BASE, { x: -dx / scale, y: -dy / scale }));
    },
    onPointerEnd: () => {
      drag.current = null;
    },

    // Soltar o arrasto em cima de um estado não pode filtrar o painel.
    onClickCapture: (event: MouseEvent<HTMLDivElement>) => {
      if (!moved.current) return;
      event.stopPropagation();
      moved.current = false;
    },
  };
};

const ZoomButton = ({
  label,
  icon,
  disabled,
  onClick,
}: {
  label: string;
  icon: IdhIconName;
  disabled: boolean;
  onClick: () => void;
}) => (
  <button
    type="button"
    aria-label={label}
    title={label}
    disabled={disabled}
    onClick={onClick}
    className="grid size-10 place-items-center border-b border-grey-300 bg-white text-grey-800 last:border-b-0 hover:not-disabled:bg-grey-200 hover:not-disabled:text-grey-1100 disabled:cursor-not-allowed disabled:opacity-40"
  >
    <IdhIcon name={icon} size={20} stroke={1.75} />
  </button>
);

type ZoomStep = "in" | "out" | "fit";

const ZOOM_KEYS: Record<string, ZoomStep> = {
  "+": "in",
  "=": "in",
  "-": "out",
  "0": "fit",
};

const useMapView = () => {
  const [view, setView] = useState<ViewBox>(BASE);
  const zoom = (step: ZoomStep) =>
    setView((current) =>
      step === "fit"
        ? BASE
        : zoomViewBox(
            current,
            BASE,
            step === "in" ? BUTTON_STEP : 1 / BUTTON_STEP,
          ),
    );

  return { view, setView, zoom };
};

type MapProps = {
  mapa: ChoroplethRegion[];
  selectedUf?: string;
  onSelect: (code: string) => void;
};

const ZoomControls = ({
  view,
  zoom,
}: {
  view: ViewBox;
  zoom: (step: ZoomStep) => void;
}) => (
  <div
    data-map-controls
    role="group"
    aria-label="Controles de zoom"
    className="absolute top-4 right-4 flex flex-col overflow-hidden rounded-[8px] shadow-[0_2px_6px_rgba(0,0,0,0.14)]"
  >
    <ZoomButton
      label="Ampliar"
      icon="zoomIn"
      disabled={view.width <= BASE.width / MAX_MAP_ZOOM + 0.01}
      onClick={() => zoom("in")}
    />
    <ZoomButton
      label="Reduzir"
      icon="zoomOut"
      disabled={view.width >= BASE.width - 0.01}
      onClick={() => zoom("out")}
    />
    <ZoomButton
      label="Ajustar à tela"
      icon="fit"
      disabled={false}
      onClick={() => zoom("fit")}
    />
  </div>
);

const MapStage = ({
  map,
  mapView,
}: {
  map: MapProps;
  mapView: ReturnType<typeof useMapView>;
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const pan = useDragPan(svgRef, mapView.view, mapView.setView);

  useWheelZoom(svgRef, mapView.setView);

  return (
    <div
      onPointerDown={pan.onPointerDown}
      onPointerMove={pan.onPointerMove}
      onPointerUp={pan.onPointerEnd}
      onPointerCancel={pan.onPointerEnd}
      onPointerLeave={pan.onPointerEnd}
      onClickCapture={pan.onClickCapture}
      className="relative h-[min(640px,calc(100vh-250px))] min-h-[300px] cursor-grab touch-none overflow-hidden rounded-[8px] bg-[#d6f1fa] select-none active:cursor-grabbing max-[700px]:h-auto max-[700px]:flex-1"
    >
      <IdhStateMap
        {...map}
        svgRef={svgRef}
        viewBox={viewBoxAttribute(mapView.view)}
        fullscreen
        className="block size-full"
      />
      <ZoomControls view={mapView.view} zoom={mapView.zoom} />
      <div className="pointer-events-none absolute bottom-4 left-4 rounded-full border border-grey-300 bg-white px-3 py-1.5 text-[13px] text-grey-800 max-[700px]:hidden">
        Arraste para mover o mapa · use + e − ou a roda do mouse para ampliar
      </div>
    </div>
  );
};

// Só existe com o diálogo aberto: cada abertura começa no mapa inteiro.
const FullscreenContent = ({
  subtitle,
  map,
}: {
  subtitle: string;
  map: MapProps;
}) => {
  const mapView = useMapView();
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const step = ZOOM_KEYS[event.key];

    if (!step) return;
    event.preventDefault();
    mapView.zoom(step);
  };

  return (
    <DialogContent
      showCloseButton={false}
      onKeyDown={handleKeyDown}
      className="flex max-h-full w-[min(1200px,calc(100%-48px))] max-w-none flex-col gap-0 rounded-[12px] border-0 bg-white px-4 pt-5 pb-3 shadow-[0_12px_32px_rgba(0,0,0,0.25)] sm:max-w-none max-[700px]:inset-0 max-[700px]:h-full max-[700px]:w-full max-[700px]:translate-x-0 max-[700px]:translate-y-0 max-[700px]:rounded-none max-[700px]:p-3"
    >
      <div className="mx-1 mb-3 flex items-start justify-between gap-2">
        <div>
          <DialogTitle className="text-lg font-semibold text-grey-1100">
            Mapa do IDH por estado
          </DialogTitle>
          <DialogDescription className="mt-0.5 text-[13px] text-grey-800">
            {subtitle}
          </DialogDescription>
        </div>
        <DialogClose
          aria-label="Fechar tela cheia"
          title="Fechar (Esc)"
          className={ICON_BUTTON}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M4.5 4.5l9 9M13.5 4.5l-9 9" />
          </svg>
        </DialogClose>
      </div>
      <MapStage map={map} mapView={mapView} />
      <IdhMapLegend mapa={map.mapa} className="mx-1 mt-3" />
      <div className="mx-1 mt-3 flex justify-between gap-3 border-t border-grey-200 pt-3 text-[13px] text-grey-800">
        <span>Fonte: PNAD/IBGE · Data Nordeste</span>
        <span className="max-[700px]:hidden">
          Clique em um estado para filtrar o painel
        </span>
      </div>
    </DialogContent>
  );
};

/**
 * Mapa do IDH em tela cheia (`.mmodal` do protótipo): ampliar, reduzir,
 * ajustar (botões, roda do mouse ou teclas + − 0), arrastar e clicar num
 * estado para filtrar o painel.
 *
 * @example <IdhMapFullscreen open={open} onOpenChange={setOpen} subtitle="…" mapa={panel.mapa} selectedUf="PE" onSelect={toggleUf} />
 */
export const IdhMapFullscreen = ({
  open,
  onOpenChange,
  subtitle,
  ...map
}: MapProps & {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subtitle: string;
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    {open ? <FullscreenContent subtitle={subtitle} map={map} /> : null}
  </Dialog>
);
