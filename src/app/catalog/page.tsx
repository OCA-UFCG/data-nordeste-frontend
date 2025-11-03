import { DataRecords } from "@/components/DataRecords/DataRecords";
import HubTemplate from "@/templates/HubTemplate";
import { getContent } from "@/utils/contentful";
import { FILTERS_QUERY } from "@/utils/queries";

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
}

export default async function CatalogPage() {
  const filterDataPage: IFilterDataPage = await getContent(FILTERS_QUERY);

  const filters = filterDataPage.filterDataPageCollection.items.map((item) => ({
    title: item.title,
    type: item.type,
    options: item.optionsCollection.items.map((opt) => ({
      slug: opt.slug,
      title: opt.title,
    })),
  }));

  return (
    <HubTemplate>
      <DataRecords filters={filters} />
    </HubTemplate>
  );
}
