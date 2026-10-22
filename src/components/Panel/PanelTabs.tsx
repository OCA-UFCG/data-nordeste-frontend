import type { KeyboardEvent } from "react";

export type PanelTab = { key: string; label: string };

const STEP_BY_KEY: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1 };

// Padrão WAI-ARIA de abas: só a ativa entra no Tab; setas, Home e End trocam.
const nextTabIndex = (key: string, current: number, total: number) => {
  if (key === "Home") return 0;
  if (key === "End") return total - 1;
  if (!(key in STEP_BY_KEY)) return null;

  return (current + STEP_BY_KEY[key] + total) % total;
};

export const PanelTabs = ({
  tabs,
  activeKey,
  idPrefix,
  onSelect,
}: {
  tabs: readonly PanelTab[];
  activeKey: string;
  idPrefix: string;
  onSelect: (key: string) => void;
}) => {
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const current = tabs.findIndex((tab) => tab.key === activeKey);
    const next = nextTabIndex(event.key, current, tabs.length);

    if (next === null) return;
    event.preventDefault();
    onSelect(tabs[next].key);
    document.getElementById(`${idPrefix}-tab-${tabs[next].key}`)?.focus();
  };

  return (
    <div
      role="tablist"
      aria-label="Visão do painel"
      onKeyDown={handleKeyDown}
      className="flex gap-4 overflow-x-auto rounded-lg border-b border-grey-400 bg-white px-3 pt-2 shadow-sm sm:px-6"
    >
      {tabs.map((tab) => {
        const isActive = tab.key === activeKey;

        return (
          <button
            key={tab.key}
            type="button"
            role="tab"
            id={`${idPrefix}-tab-${tab.key}`}
            aria-selected={isActive}
            aria-controls={isActive ? `${idPrefix}-panel` : undefined}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onSelect(tab.key)}
            className="shrink-0 whitespace-nowrap border-b-2 px-3 py-4 text-sm font-medium aria-selected:border-green-800 aria-selected:text-green-800 aria-[selected=false]:border-transparent aria-[selected=false]:text-grey-600"
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};
