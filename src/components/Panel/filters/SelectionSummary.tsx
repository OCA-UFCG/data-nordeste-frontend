import { LoaderCircle } from "lucide-react";
import type { ReactNode } from "react";

// Spinner só do desktop: no celular, a barra fixa já o mostra. O `chip` fica
// aqui, e não sobre o mapa, para o mapa não mudar de tamanho; min-h-13 reserva
// a altura.
export const SelectionSummary = ({
  summary,
  isPending,
  chip,
}: {
  summary: string;
  isPending: boolean;
  chip?: ReactNode;
}) => (
  <div className="hidden min-h-13 items-center justify-between gap-4 lg:flex">
    <p
      aria-live="polite"
      className="flex items-center gap-2 text-base text-grey-900"
    >
      <span>
        Mostrando: <strong>{summary}</strong>
      </span>
      {isPending ? (
        <LoaderCircle
          aria-label="Atualizando"
          className="size-4 shrink-0 animate-spin text-green-800"
        />
      ) : null}
    </p>
    {chip}
  </div>
);
