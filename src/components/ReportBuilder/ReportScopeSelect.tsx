"use client";

import type { ReactElement } from "react";
import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Icon } from "@/components/Icon/Icon";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  findReportScope,
  groupReportScopes,
  type ReportScope,
  type ReportScopeId,
} from "@/features/reports/reportScopes";

// Symbol ids in `public/sprite.svg`, drawn from the Figma "Recorte" icons.
const REPORT_SCOPE_ICON_IDS: Record<ReportScopeId, string> = {
  "municipio": "municipality",
  "estado": "state",
  "nordeste": "nordeste",
  "caatinga": "caatinga",
  "semiarido": "semiarido",
  "area-sudene": "area-sudene",
};

type ReportScopeSelectProps = {
  availableAreas: string[];
  onChange: (scopeId: ReportScopeId) => void;
  value: ReportScopeId | null;
};

/**
 * "Recorte" picker: a menu of radio options grouped as in the Figma.
 * Example: `<ReportScopeSelect value={scope} onChange={setScope} />`.
 */
export function ReportScopeSelect({
  availableAreas,
  onChange,
  value,
}: ReportScopeSelectProps): ReactElement {
  const [open, setOpen] = useState(false);

  const selectScope = (scopeId: string): void => {
    onChange(scopeId as ReportScopeId);
    setOpen(false);
  };

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <ReportScopeTrigger open={open} scope={findReportScope(value)} />
      <PopoverContent
        align="start"
        className="w-(--radix-popover-trigger-width) border border-grey-400 bg-white p-2"
        sideOffset={4}
      >
        <RadioGroup
          aria-label="Recorte"
          className="gap-1"
          onValueChange={selectScope}
          value={value ?? ""}
        >
          {groupReportScopes(availableAreas).map((group) => (
            <div key={group.id} className="flex flex-col">
              <p className="px-2 pt-1 pb-1 text-sm font-semibold text-[#292829]">
                {group.label}
              </p>
              {group.scopes.map((scope) => (
                <ReportScopeOption key={scope.id} scope={scope} />
              ))}
            </div>
          ))}
        </RadioGroup>
      </PopoverContent>
    </Popover>
  );
}

function ReportScopeTrigger({
  open,
  scope,
}: {
  open: boolean;
  scope: ReportScope | null;
}): ReactElement {
  const Chevron = open ? ChevronUp : ChevronDown;

  return (
    <PopoverTrigger
      aria-label={`Recorte: ${scope?.label ?? "nenhum selecionado"}`}
      className="flex h-12 w-full items-center gap-2 rounded-lg bg-[#EFEFEF] px-4 text-left text-sm text-[#292929]"
      type="button"
    >
      {scope ? (
        <ReportScopeLabel scope={scope} />
      ) : (
        <span className="flex-1 text-[#737373]">Selecione</span>
      )}
      <Chevron aria-hidden className="ml-auto size-4" />
    </PopoverTrigger>
  );
}

function ReportScopeOption({ scope }: { scope: ReportScope }): ReactElement {
  const optionId = `report-scope-${scope.id}`;

  return (
    <label
      className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-[#292929] hover:bg-[#DDEADF]"
      htmlFor={optionId}
    >
      <RadioGroupItem
        className="size-5 border-2 border-green-800"
        id={optionId}
        value={scope.id}
      />
      <ReportScopeLabel scope={scope} />
    </label>
  );
}

function ReportScopeLabel({ scope }: { scope: ReportScope }): ReactElement {
  return (
    <span className="flex items-center gap-2">
      <Icon
        aria-hidden
        className="shrink-0"
        id={REPORT_SCOPE_ICON_IDS[scope.id]}
        size={16}
      />
      {scope.label}
    </span>
  );
}
