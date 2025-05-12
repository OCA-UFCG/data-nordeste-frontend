import { IPageHeader } from "@/utils/interfaces";

const PageHeader = ({ content }: { content: { fields: IPageHeader } }) => {
  const { title, subtitle } = content.fields;

  return (
    <section className="flex items-center justify-center bg-grey-100 w-full min-h-[200px] px-6 pt-9 lg:px-20 lg:pt-12 pb-9">
      <div className="flex flex-col items-left gap-6 max-w-[1440px]">
        <h1 className="font-extrabold text-[30px] lg:text-4xl">{title}</h1>

        <h2 className="font-medium">{subtitle}</h2>
      </div>
    </section>
  );
};

export default PageHeader;
