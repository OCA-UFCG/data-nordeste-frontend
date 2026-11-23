import { ARIDEZ_CLASSES } from "@/features/panels/aridez/aridezClasses";

/**
 * Legenda das quatro classes do índice (`.clg` do protótipo), usada pelo card
 * de colunas e pelo de municípios.
 *
 * @example <AridezClassLegend />
 */
export const AridezClassLegend = () => (
  <div
    aria-label="Classes do índice de aridez"
    className="flex flex-wrap gap-x-4 gap-y-1 text-[11.5px] text-grey-1100"
  >
    {ARIDEZ_CLASSES.map((item) => (
      <span key={item.key} className="inline-flex items-center gap-1.5">
        <i
          className="inline-block size-[9px] rounded-full"
          style={{ background: item.color }}
        />
        {item.label}
      </span>
    ))}
  </div>
);
