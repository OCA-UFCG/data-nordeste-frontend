"use client";

import {
  IFeedbackAnswer,
  IFeedbackQuestion,
  SectionHeader,
} from "@/utils/interfaces";
import { documentToPlainTextString } from "@contentful/rich-text-plain-text-renderer";
import { documentToReactComponents } from "@contentful/rich-text-react-renderer";
import { TextArea } from "../TextArea";
import { Rate } from "../Rate";
import { useState } from "react";
import { sendSurveyFeedback } from "@/lib/firebase";
import { STORAGE_KEY } from "@/utils/constants";
import { Icon } from "../Icon/Icon";
import { cn } from "@/lib/utils";

const EXPIRY_HOURS = 24;

export const Survey = ({
  header,
  content,
  onSubmit,
}: {
  header?: SectionHeader;
  content: IFeedbackQuestion[];
  onSubmit: () => void;
}) => {
  const [answers, setAnswers] = useState<Record<string, IFeedbackAnswer>>({});
  const [loading, setLoading] = useState<boolean>(false);

  const handleAnswerChange = (
    id: string,
    value: string | number,
    text: string,
  ) => {
    setAnswers((prevAnswers) => ({
      ...prevAnswers,
      [id]: { id: id, answer: value, text: text },
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const expiry = Date.now() + EXPIRY_HOURS * 60 * 60 * 1000; // add hours in ms
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ submitted: true, expiry }),
    );

    setLoading(true);
    await sendSurveyFeedback(Object.values(answers));
    setLoading(false);
    onSubmit();
  };

  return (
    <div>
      <p className="text-gray-600">{header?.subtitle}</p>
      <form onSubmit={handleSubmit} className="mt-6">
        <div className="space-y-8">
          {content
            .sort((a, b) =>
              documentToPlainTextString(a.question.json).localeCompare(
                documentToPlainTextString(b.question.json),
              ),
            )
            .map((item) => (
              <div key={item.id}>
                <label className="block text-md font-medium text-gray-700 mb-3">
                  {documentToReactComponents(item.question.json)}
                </label>

                {item.shape === "rate" && (
                  <Rate
                    currentValue={answers[item?.id]?.answer}
                    item={item}
                    handleChange={handleAnswerChange}
                  />
                )}

                {item.shape === "text" && (
                  <TextArea
                    item={item}
                    currentValue={(answers[item?.id]?.answer || "").toString()}
                    handleChange={handleAnswerChange}
                  />
                )}
              </div>
            ))}
        </div>

        <button
          type="submit"
          className={cn(
            loading && "opacity-70 pointer-events-none",
            "flex w-full bg-green-800 text-white font-bold py-3 px-4 rounded-md hover:bg-green-900 transition-colors mt-8 cursor-pointer justify-center",
          )}
        >
          {loading ? (
            <Icon id="loading" size={20} className="animate-spin" />
          ) : (
            "Enviar"
          )}
        </button>
      </form>
    </div>
  );
};
