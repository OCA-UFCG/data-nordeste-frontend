"use client";

// Cliente porque a resposta é uma lista Doc por Doc (useActionState), e não um dos
// status fixos que o formulário do Contentful passa por ?resultado=.
import { useActionState } from "react";
import { refreshReportDocsAction } from "@/app/atualizar-conteudo/actions";
import { Button } from "@/components/ui/button";
import { ReportDocsRefreshResult } from "./ReportDocsRefreshResult";

/** Formulário do botão "Atualizar relatórios". Ex.: `<ReportDocsRefresh />`. */
export function ReportDocsRefresh() {
  const [outcome, refreshAction, isPending] = useActionState(
    refreshReportDocsAction,
    null,
  );

  return (
    <form action={refreshAction} className="flex flex-col gap-4">
      <label
        htmlFor="senha-relatorios"
        className="text-sm font-medium text-[#292829]"
      >
        Senha
      </label>
      <input
        id="senha-relatorios"
        name="senha"
        type="password"
        required
        autoComplete="current-password"
        className="h-10 rounded-md border border-grey-200 px-3 text-base focus-visible:outline-2 focus-visible:outline-green-800"
      />
      <Button type="submit" className="self-start" disabled={isPending}>
        {isPending ? "Conferindo os documentos…" : "Atualizar relatórios"}
      </Button>
      {outcome && <ReportDocsRefreshResult outcome={outcome} />}
    </form>
  );
}
