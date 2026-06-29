import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/Icon/Icon";
import { MACROTHEME_ICON_BY_ID } from "@/features/macrothemes/constants";
import { THEMES_NAVIGATION_ORDER } from "@/features/macrothemes/constants";
import { sortContentByDesiredOrder } from "@/utils/functions";
import { normalizeKey } from "@/utils/functions";
import { SeeThemesModalProps } from "./types";
import { XIcon } from "lucide-react";

function SeeThemesModal({
  themes,
  selectedCategories,
  onToggleCategory,
  onSelectAll,
  onClose,
  onApply,
}: SeeThemesModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-lg w-full max-w-[393px] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col gap-6 p-6 flex-1 overflow-hidden">
          <div className="flex items-center justify-between flex-shrink-0">
            <h2 className="text-[24px] font-semibold leading-[36px] tracking-[-0.0075em] text-[#292829]">
              Veja por temas
            </h2>
            <button
              onClick={onClose}
              className="flex items-center justify-center w-11 h-11 rounded-md hover:bg-grey-100 transition-colors"
              aria-label="Fechar"
            >
              <XIcon className="w-5 h-5 text-[#077432]" />
            </button>
          </div>

          <div className="flex flex-col gap-4 overflow-y-auto flex-1">
            {sortContentByDesiredOrder(themes, THEMES_NAVIGATION_ORDER).map(
              (theme) => {
                const iconKey = normalizeKey(theme.name);
                const isChecked = selectedCategories.includes(theme.sys.id);

                return (
                  <div
                    key={theme.sys.id}
                    className="flex flex-row h-10 bg-[#F8F7F8] border border-[#EFEFEF] rounded-lg cursor-pointer hover:bg-[#F0EFEF] transition-colors flex-shrink-0"
                    onClick={() => onToggleCategory(theme.sys.id)}
                  >
                    <div className="flex items-center justify-center h-full w-10 rounded-l-lg hover:bg-[#DDEADF] transition-colors">
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={() => onToggleCategory(theme.sys.id)}
                        className="w-5 h-5 border-[#018F39] data-[state=checked]:bg-[#018F39] flex-shrink-0 rounded"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>

                    <div className="w-px h-full bg-[#EFEFEF]" />

                    <div className="flex items-center gap-2 flex-1 h-full px-3 rounded-r-lg hover:bg-[#DDEADF] transition-colors">
                      <Icon
                        id={MACROTHEME_ICON_BY_ID[iconKey] || "list"}
                        size={16}
                        style={{ color: theme.color || "#999999" }}
                      />

                      <span className="flex-1 text-base font-normal text-[#292829] truncate">
                        {theme.name}
                      </span>

                      <Icon
                        className="flex-shrink-0 rotate-[-90] text-[#018F39]"
                        id="expand"
                        size={10}
                      />
                    </div>
                  </div>
                );
              },
            )}
            <button
              className="flex items-center justify-center w-full h-10 px-4 py-2 rounded-md text-[#018F39] font-medium text-sm cursor-pointer transition-colors hover:bg-[#D6E9DB]"
              onClick={onSelectAll}
            >
              Selecionar todos
            </button>
          </div>

          <div className="flex flex-row gap-3 flex-shrink-0">
            <Button
              variant="secondary"
              className="flex-1 h-10 bg-white border border-[#EFEFEF] rounded-md text-[#E5333F] hover:bg-grey-100"
              onClick={onClose}
            >
              Voltar
            </Button>
            <Button
              className="flex-1 h-10 bg-[#018F39] hover:bg-[#018F39]/90 text-[#F8F7F8] rounded-md"
              onClick={onApply}
            >
              Aplicar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SeeThemesModal;
