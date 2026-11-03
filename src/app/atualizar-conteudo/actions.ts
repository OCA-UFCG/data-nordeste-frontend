"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { CONTENTFUL_CACHE_TAG } from "@/config/revalidation";
import { isContentCachePasswordValid } from "@/features/contentCache/password";
import {
  CONTENT_CACHE_PAGE_PATH,
  type ContentCacheStatus,
} from "@/features/contentCache/status";

// Atrasa a resposta de senha errada para dificultar tentativas em sequência.
const WRONG_PASSWORD_DELAY_MS = 1000;

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
    await new Promise((resolve) =>
      setTimeout(resolve, WRONG_PASSWORD_DELAY_MS),
    );

    return redirectWithStatus("senha-incorreta");
  }

  updateTag(CONTENTFUL_CACHE_TAG);
  revalidatePath("/", "layout");

  return redirectWithStatus("atualizado");
}
