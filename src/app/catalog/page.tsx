import { DataRecords } from "@/components/DataRecords/DataRecords";
import PageHeader from "@/components/PageHeader/PageHeader";
import HubTemplate from "@/templates/HubTemplate";
import { getContent } from "@/utils/contentful";
import { FILTERS_QUERY } from "@/utils/queries";
import { Suspense } from "react";

interface IFilterDataPage {
  filterDataPageCollection: {
    items: {
      title: string;
      type: string;
      optionsCollection: {
        items: {
          title: string;
          slug: string;
        }[];
      };
    }[];
  };
  pageHeadersCollection: {
    items: {
      title: string;
      subtitle?: string;
      richSubtitle?: { json: any };
    }[];
  };
}

export default async function CatalogPage() {
  const data: IFilterDataPage = await getContent(FILTERS_QUERY);

  const header = data.pageHeadersCollection?.items?.[0];
  const filters = data.filterDataPageCollection.items.map((item) => ({
    title: item.title,
    type: item.type,
    options: item.optionsCollection.items.map((opt) => ({
      slug: opt.slug,
      title: opt.title,
    })),
  }));

  return (
    <HubTemplate>
      <PageHeader
        content={{
          title: header?.title || "Catálogo de dados",
          subtitle:
            header?.subtitle ||
            "Aqui você encontra todas as bases de dados utilizadas nos painéis e publicações do Data Nordeste.",
          richSubtitle: header?.richSubtitle,
        }}
      />
      <Suspense>
        <DataRecords filters={filters} />
      </Suspense>
    </HubTemplate>
  );
}
