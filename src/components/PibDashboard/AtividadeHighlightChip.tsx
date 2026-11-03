import { X } from "lucide-react";

// Âncora do card do mapa: o "Ver no mapa" da lista rola até ele.
export const PIB_MAP_ID = "pib-mapa";

const scrollToPibMap = () => {
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  document
    .getElementById(PIB_MAP_ID)
    ?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
};

const ShowMapButton = () => (
  <button
    type="button"
    onClick={scrollToPibMap}
    className="min-h-11 shrink-0 rounded-md px-2 font-medium text-green-900 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-green-800"
  >
    Ver no mapa
  </button>
);

// `withMapLink`: cópia abaixo da lista (celular), longe do mapa. Ela não usa
// aria-live para o leitor de tela não anunciar o destaque duas vezes.
export const AtividadeHighlightChip = ({
  atividade,
  onClear,
  withMapLink = false,
}: {
  atividade: string;
  onClear: () => void;
  withMapLink?: boolean;
}) => (
  <p
    aria-live={withMapLink ? undefined : "polite"}
    className="flex items-center gap-2 rounded-md bg-orange-100 py-1 pl-3 pr-1 text-sm text-grey-1100"
  >
    <span className="min-w-0 flex-1">
      Destacando no mapa: <strong>{atividade}</strong>
    </span>
    {withMapLink ? <ShowMapButton /> : null}
    <button
      type="button"
      onClick={onClear}
      aria-label="Limpar destaque"
      title="Limpar destaque"
      className="inline-flex size-11 shrink-0 items-center justify-center rounded-md hover:bg-orange-200"
    >
      <X aria-hidden className="size-4" />
    </button>
  </p>
);
