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
import { UAParser } from "ua-parser-js";
import { useState } from "react";

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
  const parser = UAParser(window?.navigator?.userAgent);
  const browserInfo = parser.browser;

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

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    const clientData = {
      timestamp: new Date().toISOString(), // e.g., "2025-08-06T12:00:00Z"
      browser: {
        name: browserInfo.name || "Unknown",
        version: browserInfo.version || "Unknown",
      },
      screen: {
        width: window?.screen?.width || "unknown",
        height: window?.screen?.height || "unknown",
      },
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone, // e.g., "America/Sao_Paulo"
      answers: Object.values(answers),
    };
    console.log(clientData);

    // onSubmit(answers);
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
          className="w-full bg-green-800 text-white font-bold py-3 px-4 rounded-md hover:bg-green-900 transition-colors mt-8 cursor-pointer"
        >
          Enviar
        </button>
      </form>
    </div>
  );
};
