import { IFeedbackQuestion } from "@/utils/interfaces";

export const TextArea = ({
  item,
  currentValue,
  handleChange,
}: {
  item: IFeedbackQuestion;
  currentValue: string | number;
  handleChange: (id: string, value: string) => void;
}) => {
  return (
    <textarea
      rows={4}
      className="w-full mt-1 p-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
      placeholder="Deixe seu comentário..."
      value={(currentValue as string) || ""}
      onChange={(e) => handleChange(item.id, e.target.value)}
    />
  );
};
