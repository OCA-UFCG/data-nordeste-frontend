import type { Metadata } from "next";
import Link from "next/link";
import {
  LINKED_CARD_CLASS_NAME,
  PostCardBody,
} from "@/components/ContentPost/ContentPost";
import { buildMetadata } from "@/config/seo";
import {
  EXPERIMENTAL_PANELS,
  pickExperimentalPanels,
} from "@/features/experimental/panels";
import HubTemplate from "@/templates/HubTemplate";
import { getContent } from "@/utils/contentful";
import type { IPublication } from "@/utils/interfaces";
import { EXPERIMENTAL_PANELS_QUERY } from "@/utils/queries";

// Catálogo do que está em teste. Herda de layout.tsx o 404 sem DEMOS_HABILITADAS.
export const metadata: Metadata = {
  ...buildMetadata({
    title: "Experimental",
    description: "Novidades do Data Nordeste que ainda estão em teste.",
    path: "/demo",
  }),
  robots: { index: false, follow: false },
};

const loadPosts = async (): Promise<IPublication[]> => {
  try {
    const { postCollection } = await getContent<{
      postCollection: { items: IPublication[] };
    }>(EXPERIMENTAL_PANELS_QUERY, {
      links: EXPERIMENTAL_PANELS.map((panel) => panel.link),
    });

    return postCollection.items;
  } catch (error) {
    console.error(
      JSON.stringify({
        event: "experimental_panels_contentful_failed",
        message: error instanceof Error ? error.message : String(error),
      }),
    );

    return [];
  }
};

export default async function ExperimentalPage() {
  const panels = pickExperimentalPanels(await loadPosts());

  return (
    <HubTemplate>
      <section className="bg-grey-100 w-full py-12 flex-1">
        <div className="max-w-[1440px] mx-auto my-0 flex flex-col gap-6 px-4 lg:px-20">
          <div className="flex flex-col gap-4">
            <h1 className="text-3xl font-semibold">Experimental</h1>
            <p className="text-base font-medium leading-6 text-[#292829] max-w-[880px]">
              Novidades do Data Nordeste que ainda estão em teste. Aqui você
              conhece primeiro as novas formas de explorar os dados e pode nos
              ajudar a melhorá-las antes que elas cheguem ao restante do portal.
            </p>
          </div>

          <h2 className="text-xl font-semibold mt-2">Painéis</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {panels.map(({ href, post }) => (
              <Link key={href} href={href} className={LINKED_CARD_CLASS_NAME}>
                <PostCardBody
                  content={post}
                  actionLabel="Acessar"
                  label="Painel experimental"
                />
              </Link>
            ))}
          </div>
        </div>
      </section>
    </HubTemplate>
  );
}
