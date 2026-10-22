export type PanelTab = { key: string; label: string };

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
}) => (
  <div
    role="tablist"
    aria-label="Visão do painel"
    className="flex gap-4 overflow-x-auto rounded-lg border-b border-grey-400 bg-white px-3 pt-2 shadow-sm sm:px-6"
  >
    {tabs.map((tab) => (
      <button
        key={tab.key}
        type="button"
        role="tab"
        id={`${idPrefix}-tab-${tab.key}`}
        aria-selected={tab.key === activeKey}
        aria-controls={`${idPrefix}-panel`}
        onClick={() => onSelect(tab.key)}
        className="shrink-0 whitespace-nowrap border-b-2 px-3 py-4 text-sm font-medium aria-selected:border-green-800 aria-selected:text-green-800 aria-[selected=false]:border-transparent aria-[selected=false]:text-grey-600"
      >
        {tab.label}
      </button>
    ))}
  </div>
);
