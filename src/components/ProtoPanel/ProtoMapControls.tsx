import { ProtoIcon } from "@/components/ProtoPanel/ProtoIcon";
import { ICON_BUTTON } from "@/components/ProtoPanel/protoStyles";
import type { ChoroplethBucket } from "@/features/panels/choropleth";

/**
 * Botão "Tela cheia" do cabeçalho de um card de mapa. `disabled` enquanto o
 * card carrega ou mostra erro, quando não há mapa para abrir.
 *
 * @example <ProtoFullscreenButton disabled={state !== "ok"} onClick={() => setFullscreen(true)} />
 */
export const ProtoFullscreenButton = ({
  disabled,
  onClick,
}: {
  disabled: boolean;
  onClick: () => void;
}) => (
  <button
    type="button"
    aria-haspopup="dialog"
    aria-label="Abrir mapa em tela cheia"
    title="Tela cheia"
    disabled={disabled}
    onClick={onClick}
    className={ICON_BUTTON}
  >
    <ProtoIcon name="fullscreen" size={18} stroke={1.7} />
  </button>
);

/**
 * Legenda das faixas de um mapa coroplético (`.mleg` do protótipo): um ponto
 * na cor e o rótulo de cada faixa.
 *
 * @example <ProtoBinLegend bins={ARIDEZ_STATE_BINS} />
 */
export const ProtoBinLegend = ({
  bins,
  className = "mt-3",
}: {
  bins: readonly ChoroplethBucket[];
  className?: string;
}) => (
  <div
    className={`flex flex-wrap gap-x-4 gap-y-1 text-[11.5px] text-grey-1100 ${className}`}
  >
    {bins.map((bin) => (
      <span key={bin.label} className="inline-flex items-center gap-1.5">
        <i
          className="inline-block size-[9px] rounded-full"
          style={{ background: bin.color }}
        />
        {bin.label}
      </span>
    ))}
  </div>
);
