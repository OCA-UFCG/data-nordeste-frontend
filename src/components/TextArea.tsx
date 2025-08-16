import { IFeedbackQuestion } from "@/utils/interfaces";
import { documentToPlainTextString } from "@contentful/rich-text-plain-text-renderer";

export const TextArea = ({
  item,
  currentValue,
  handleChange,
}: {
  item: IFeedbackQuestion;
  currentValue: string | number;
  handleChange: (id: string, value: string, text: string) => void;
}) => {
  return (
    <textarea
      rows={4}
      className="w-full mt-1 p-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
      placeholder="Deixe seu comentário..."
      value={(currentValue as string) || ""}
      onChange={(e) =>
        handleChange(
          item.id,
          e.target.value,
          documentToPlainTextString(item.question.json),
        )
      }
    />
  );
};
