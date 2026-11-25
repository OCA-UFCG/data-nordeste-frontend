import { ProtoIcon } from "@/components/ProtoPanel/ProtoIcon";
import { ICON_BUTTON } from "@/components/ProtoPanel/protoStyles";

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
