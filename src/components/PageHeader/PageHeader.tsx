import { IPageHeader } from "@/utils/interfaces";
import { documentToReactComponents } from "@contentful/rich-text-react-renderer";

const PageHeader = ({ content }: { content: IPageHeader }) => {
  const { title, subtitle, richSubtitle, banner } = content;

  return (
    <section
      className="w-full bg-grey-100 bg-cover bg-center bg-no-repeat"
      style={
        banner?.url
          ? {
              backgroundImage: `url(${banner.url})`,
            }
          : undefined
      }
    >
      <div className="bg-black/40">
        <div className="flex items-center justify-center min-h-[300px] px-6 pt-9 lg:px-20 lg:pt-12 pb-9 max-w-[1440px] mx-auto">
          <div className="flex flex-col items-start gap-6 max-w-[1440px] w-full text-white">
            <h1 className="font-extrabold text-3xl lg:text-5xl">{title}</h1>

            {richSubtitle ? (
              <div className="text-[16px]">
                {documentToReactComponents(richSubtitle.json)}
              </div>
            ) : (
              subtitle && <h2 className="text-[16px]">{subtitle}</h2>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default PageHeader;
