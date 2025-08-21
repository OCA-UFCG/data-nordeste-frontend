import { SectionHeader } from "@/utils/interfaces";
import { Icon } from "../Icon/Icon";

export const SurveySubmitted = ({ header }: { header?: SectionHeader }) => {
  return (
    <div className="flex flex-col md:flex-row justify-center items-center gap-8">
      <div className="flex justify-center">
        <Icon id="user-check" className="text-green-700 w-32" />
      </div>
      <div className="flex flex-col gap-4 w-full text-center md:text-start">
        <h3 className="text-3xl font-semibold">{header?.title}</h3>
        <p>{header?.subtitle}</p>
      </div>
    </div>
  );
};
