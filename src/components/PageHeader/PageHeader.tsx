import { IPageHeader } from "@/utils/interfaces";
import {
  documentToReactComponents,
  type Options,
} from "@contentful/rich-text-react-renderer";
import { BLOCKS } from "@contentful/rich-text-types";
import type { ReactNode } from "react";

const renderAsParagraph = (_node: unknown, children: ReactNode) => (
  <p>{children}</p>
);

// The subtitle is a lead paragraph under the page h1. Editors sometimes style
// it as a heading in Contentful, which breaks heading order for screen
// readers (axe "heading-order"), so headings render as plain paragraphs.
const SUBTITLE_RENDER_OPTIONS: Options = {
  renderNode: {
    [BLOCKS.HEADING_1]: renderAsParagraph,
    [BLOCKS.HEADING_2]: renderAsParagraph,
    [BLOCKS.HEADING_3]: renderAsParagraph,
    [BLOCKS.HEADING_4]: renderAsParagraph,
    [BLOCKS.HEADING_5]: renderAsParagraph,
    [BLOCKS.HEADING_6]: renderAsParagraph,
  },
};

const PageHeader = ({ content }: { content: IPageHeader }) => {
  const { title, subtitle, richSubtitle, banner } = content;

  // The dark fallback keeps the white title readable (WCAG 1.4.3) when
  // there is no banner or it has not loaded; the image covers it otherwise.
  return (
    <section
      className="w-full bg-grey-1100 bg-cover bg-center bg-no-repeat"
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
              <div className="text-[18px]">
                {documentToReactComponents(
                  richSubtitle.json,
                  SUBTITLE_RENDER_OPTIONS,
                )}
              </div>
            ) : (
              subtitle && <h2 className="text-[18px]">{subtitle}</h2>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default PageHeader;
