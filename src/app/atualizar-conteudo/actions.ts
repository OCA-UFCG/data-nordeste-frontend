"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { CONTENTFUL_CACHE_TAG } from "@/config/revalidation";
import {
  isContentCachePasswordValid,
  waitAfterWrongPassword,
} from "@/features/contentCache/password";
import {
  CONTENT_CACHE_PAGE_PATH,
  type ContentCacheStatus,
} from "@/features/contentCache/status";
import {
  refreshReportDocs,
  type ReportDocsRefreshOutcome,
} from "@/features/reportDocs/reportDocsRefresh";
import { getAutomaticReportApiBaseUrl } from "@/features/reports/automaticReport";

const redirectWithStatus = (status: ContentCacheStatus): never =>
  redirect(`${CONTENT_CACHE_PAGE_PATH}?resultado=${status}`);

export async function refreshContentCache(formData: FormData) {
  const expected = process.env.CONTENT_CACHE_PASSWORD;

  if (!expected) return redirectWithStatus("indisponivel");

  const password = formData.get("senha");

  if (
    typeof password !== "string" ||
    !isContentCachePasswordValid(password, expected)
  ) {
    await waitAfterWrongPassword();

    return redirectWithStatus("senha-incorreta");
  }

  updateTag(CONTENTFUL_CACHE_TAG);
  revalidatePath("/", "layout");

  return redirectWithStatus("atualizado");
}

/**
 * Botão "Atualizar relatórios": confere os Google Docs dos relatórios e grava só
 * os que passaram (POST /docs/atualizar no Automatic-Reporting). Mesma senha da
 * atualização do Contentful; o token do serviço nunca sai do servidor.
 * Devolve o resultado em vez de redirecionar: a tela lista Doc por Doc.
 *
 * Ex.: `useActionState(refreshReportDocsAction, null)`
 */
export async function refreshReportDocsAction(
  _previous: ReportDocsRefreshOutcome | null,
  formData: FormData,
): Promise<ReportDocsRefreshOutcome> {
  const expected = process.env.CONTENT_CACHE_PASSWORD;
  const token = process.env.DOCS_ATUALIZAR_TOKEN;

  if (!expected || !token) return { kind: "indisponivel" };

  const password = formData.get("senha");

  if (
    typeof password !== "string" ||
    !isContentCachePasswordValid(password, expected)
  ) {
    await waitAfterWrongPassword();

    return { kind: "senha-incorreta" };
  }

  return refreshReportDocs({
    apiBaseUrl: getAutomaticReportApiBaseUrl(),
    token,
  });
}
