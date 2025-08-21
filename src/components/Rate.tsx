import { IFeedbackQuestion } from "@/utils/interfaces";
import { documentToPlainTextString } from "@contentful/rich-text-plain-text-renderer";

const RATING_OPTIONS = [1, 2, 3, 4, 5];

export const Rate = ({
  item,
  currentValue,
  handleChange,
}: {
  item: IFeedbackQuestion;
  currentValue: string | number;
  handleChange: (id: string, value: number, text: string) => void;
}) => {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-6">
        <span className="text-sm text-gray-500 hidden sm:block">
          Muito Ruim
        </span>
        <div className="flex w-full sm:w-fit gap-x-2 justify-between sm:justify-start sm:gap-x-6">
          {RATING_OPTIONS.map((rateValue) => {
            const inputId = `rating-${item.id}-${rateValue}`;
            const isSelected = currentValue == rateValue;

            return (
              <div key={rateValue}>
                <input
                  type="radio"
                  required
                  id={inputId}
                  name={`rating-${item.id}`}
                  value={rateValue}
                  checked={isSelected}
                  onChange={() =>
                    handleChange(
                      item.id,
                      rateValue,
                      documentToPlainTextString(item.question.json),
                    )
                  }
                  className="sr-only"
                />
                <label
                  htmlFor={inputId}
                  className={`
                              flex items-center justify-center w-10 h-10 rounded-md border text-sm font-semibold 
                              transition-colors cursor-pointer
                              ${
                                isSelected
                                  ? "bg-green-800 border-green-900 text-white"
                                  : "bg-white border-gray-300 text-gray-700 hover:bg-green-neutro"
                              }
                            `}
                >
                  {rateValue}
                </label>
              </div>
            );
          })}
        </div>
        <span className="text-sm text-gray-500 hidden sm:block">Muito Boa</span>
      </div>
      <div className="flex sm:hidden justify-between">
        <span className="text-sm text-gray-500">Muito Ruim</span>
        <span className="text-sm text-gray-500">Muito Boa</span>
      </div>
    </div>
  );
};
