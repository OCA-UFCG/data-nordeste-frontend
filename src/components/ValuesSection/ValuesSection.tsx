import { IValues } from "@/utils/interfaces";
import { Icon } from "../Icon/Icon";
import { documentToReactComponents } from "@contentful/rich-text-react-renderer";
import { sortContentByDesiredOrder } from "@/utils/functions";

const ValuesSection = ({ content }: { content: { fields: IValues }[] }) => {
  const orderedContent = sortContentByDesiredOrder<IValues>(content, [
    "mission",
    "vision",
    "values",
  ]);

  return (
    <section className="flex items-center flex-col w-full px-6 py-9 lg:px-[80px] lg:py-[32px]">
      <div className="flex flex-col w-full lg:max-w-[1440px] h-fit gap-[24px]">
        <h1 className="text-[24px] lg:text-[30px] font-bold">
          Missão, Visão e Valor
        </h1>

        <div className="flex flex-col items-center gap-[24px] ">
          {orderedContent.map(({ fields: { title, details, id } }, index) => (
            <div
              key={index}
              className="flex flex-col lg:flex-row items-stretch w-full h-fit rounded-lg overflow-hidden border border-[#EFEFEF] shadow-sm"
            >
              <div className="flex items-center px-[24px] py-[24px] bg-green-900 gap-[10px] lg:items-center lg:justify-center w-full lg:w-[162px] lg:min-h-[198px] lg:gap-4">
                <div className="block lg:hidden">
                  <Icon id={id} size={64} />
                </div>

                <div className="hidden lg:block">
                  <Icon id={id} size={114} />
                </div>
                <h2 className="text-[32px] text-white font-bold lg:hidden">
                  {title}
                </h2>
              </div>

              <div className="flex flex-col justify-center w-full gap-[6px] p-[24px]">
                <h2 className="text-[20px] font-bold hidden lg:block">
                  {title}
                </h2>
                <div className="text-grey-800 [&_ul]:list-disc [&_ul]:list-outside [&_ul]:pl-5 [&_li]:m-1">
                  {documentToReactComponents(details)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ValuesSection;
