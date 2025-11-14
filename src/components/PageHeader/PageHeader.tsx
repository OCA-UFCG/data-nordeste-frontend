import { IPageHeader } from "@/utils/interfaces";
import { documentToReactComponents } from "@contentful/rich-text-react-renderer";

const PageHeader = ({ content }: { content: IPageHeader }) => {
  const { title, subtitle, richSubtitle } = content;

  return (
    <section className="flex items-center justify-center bg-grey-100 w-full min-h-[200px] px-6 pt-9 lg:px-20 lg:pt-12 pb-9 border-box">
      <div className="flex flex-col items-start gap-6 max-w-[1440px] w-full">
        <h1 className="font-extrabold text-[30px] lg:text-[48px]">{title}</h1>

        {richSubtitle ? (
          <div className="text-[16px]">
            {documentToReactComponents(richSubtitle.json)}
          </div>
        ) : (
          subtitle && <h2 className="text-[16px]">{subtitle}</h2>
        )}
      </div>
    </section>
  );
};

export default PageHeader;
