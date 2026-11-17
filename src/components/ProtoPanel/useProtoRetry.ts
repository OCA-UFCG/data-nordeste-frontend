"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

/**
 * "Tentar de novo" dos cards: o server component consulta o banco outra vez
 * (`router.refresh`). `retrying` liga o estado de carregamento dos cards.
 *
 * @example const { retrying, retry } = useProtoRetry(); <ProtoCard onRetry={retry} state={retrying ? "loading" : "ok"} />
 */
export const useProtoRetry = () => {
  const router = useRouter();
  const [retrying, startRetry] = useTransition();

  return { retrying, retry: () => startRetry(() => router.refresh()) };
};
