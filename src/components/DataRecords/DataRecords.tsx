import { IMetadata, MacroTheme } from "@/utils/interfaces";
import { DataList } from "../DataList/DataList";

export const DataRecords = ({
  themes,
  initialRecords,
  currentPage,
  totalPages,
}: {
  themes: MacroTheme[];
  initialRecords: IMetadata[];
  currentPage: number;
  totalPages: number;
}) => {
  return (
    <section className="flex flex-col items-center w-full max-w-[1440px] mx-auto px-6 pt-10 pb-4 sm:px-10 md:px-10 lg:px-20">
      <DataList
        posts={initialRecords}
        pages={totalPages}
        currentPage={currentPage}
        loading={false}
        themes={themes}
      />
    </section>
  );
};
