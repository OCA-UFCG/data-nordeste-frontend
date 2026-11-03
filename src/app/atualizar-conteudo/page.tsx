import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { buildMetadata } from "@/config/seo";
import {
  CONTENT_CACHE_PAGE_PATH,
  CONTENT_CACHE_STATUS_MESSAGES,
  isContentCacheStatus,
} from "@/features/contentCache/status";
import HubTemplate from "@/templates/HubTemplate";
import { refreshContentCache } from "./actions";

export const metadata: Metadata = {
  ...buildMetadata({
    title: "Atualizar conteúdo",
    description:
      "Página interna para atualizar o conteúdo do Contentful exibido no site.",
    path: CONTENT_CACHE_PAGE_PATH,
  }),
  robots: { index: false, follow: false },
};

export default async function RefreshContentPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { resultado } = await searchParams;
  const status = isContentCacheStatus(resultado) ? resultado : null;

  return (
    <HubTemplate>
      <section className="mx-auto flex w-full max-w-[560px] flex-col gap-6 px-4 py-16">
        <h1 className="text-3xl font-semibold leading-tight text-[#292829]">
          Atualizar conteúdo
        </h1>
        <p className="text-base leading-7 text-[#4D4B4D]">
          O site guarda o conteúdo do Contentful para não consultá-lo a cada
          visita. Depois de publicar uma alteração, informe a senha e clique em
          &quot;Atualizar site&quot; para que ela apareça.
        </p>

        {status && (
          <p
            role="status"
            className={
              status === "atualizado"
                ? "rounded-md border border-green-800 bg-green-50 p-4 text-green-900"
                : "rounded-md border border-red-700 bg-red-50 p-4 text-red-800"
            }
          >
            {CONTENT_CACHE_STATUS_MESSAGES[status]}
          </p>
        )}

        <form action={refreshContentCache} className="flex flex-col gap-4">
          <label htmlFor="senha" className="text-sm font-medium text-[#292829]">
            Senha
          </label>
          <input
            id="senha"
            name="senha"
            type="password"
            required
            autoComplete="current-password"
            className="h-10 rounded-md border border-grey-200 px-3 text-base focus-visible:outline-2 focus-visible:outline-green-800"
          />
          <Button type="submit" className="self-start">
            Atualizar site
          </Button>
        </form>
      </section>
    </HubTemplate>
  );
}
