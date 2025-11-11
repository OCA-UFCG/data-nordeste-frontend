import { IPageHeader } from "@/utils/interfaces";

const PageHeader = ({ content }: { content: IPageHeader }) => {
  const { title, subtitle } = content;

  return (
    <section className="flex items-center justify-center bg-grey-100 w-full min-h-[200px] px-6 pt-9 lg:px-20 lg:pt-12 pb-9 border-box">
      <div className="flex flex-col items-left gap-6 max-w-[1440px]">
        <h1 className="font-extrabold text-[30px] lg:text-[48px]">{title}</h1>

        <h2 className="text-[16px] whitespace-pre-line">{subtitle}</h2>
      </div>
    </section>
  );
};

export default PageHeader;
