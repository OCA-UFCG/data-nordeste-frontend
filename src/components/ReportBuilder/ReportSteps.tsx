"use client";

import type { ReactElement, ReactNode } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

export type ReportStepId = "municipality" | "themes";

type ReportStepsProps = {
  children: ReactNode;
  onStepChange: (step: ReportStepId | "") => void;
  openStep: ReportStepId | "";
};

/** Keeps exactly one report step open. Example: `<ReportSteps openStep="municipality">...</ReportSteps>`. */
export function ReportSteps({
  children,
  onStepChange,
  openStep,
}: ReportStepsProps): ReactElement {
  return (
    <Accordion
      className="flex flex-col gap-6"
      collapsible
      onValueChange={(value) => onStepChange(value as ReportStepId | "")}
      type="single"
      value={openStep}
    >
      {children}
    </Accordion>
  );
}

type ReportStepProps = {
  children: ReactNode;
  completed: boolean;
  number: 1 | 2;
  stepId: ReportStepId;
  title: string;
};

/** Renders one selectable report step. Example: `<ReportStep number={1} stepId="municipality" ... />`. */
export function ReportStep({
  children,
  completed,
  number,
  stepId,
  title,
}: ReportStepProps): ReactElement {
  return (
    <AccordionItem
      className="overflow-hidden border border-[#DCDBDC] bg-white shadow-sm"
      value={stepId}
    >
      <AccordionTrigger className="h-24 items-center rounded-none bg-[#EFEFEF] px-6 py-0 text-xl font-semibold text-[#292829] hover:no-underline data-[state=open]:bg-[#EFEFEF] [&>svg]:size-5">
        <span className="flex items-center gap-4">
          <span
            aria-label={`Etapa ${number}${completed ? " concluída" : " pendente"}`}
            className={cn(
              "flex size-12 shrink-0 items-center justify-center rounded-full border-[3px] text-lg font-semibold transition-colors",
              completed
                ? "border-[#018F39] bg-transparent text-[#018F39]"
                : "border-[#858284] text-[#737073]",
            )}
          >
            {number}
          </span>
          {title}
        </span>
      </AccordionTrigger>
      <AccordionContent className="px-6 pt-5 pb-4">{children}</AccordionContent>
    </AccordionItem>
  );
}
