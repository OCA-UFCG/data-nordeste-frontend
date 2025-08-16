"use client";

import { IFeedbackQuestion, SectionHeader } from "@/utils/interfaces";
import { useState } from "react";
import { Icon } from "./Icon/Icon";
import { documentToReactComponents } from "@contentful/rich-text-react-renderer";
import { Rate } from "./Rate";
import { TextArea } from "./TextArea";
import { UAParser } from "ua-parser-js";

interface IFeedbackAnswer {
  id: string;
  text: string;
  answer: string | number;
}

export const FeedbackSurvey = ({
  header,
  content,
}: {
  header?: SectionHeader;
  content: IFeedbackQuestion[];
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [answers, setAnswers] = useState<Record<string, IFeedbackAnswer>>({});
  const parser = UAParser(window.navigator.userAgent);
  const browserInfo = parser.browser;
  console.log(browserInfo);

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
    console.log(event);
    console.log("Submitting answers:", answers);

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
  };

  return (
    <section className="w-full max-w-[1440px] my-12 p-6">
      <div className="bg-white rounded-lg shadow-md w-full ">
        <div
          className="bg-gray-100 hover:bg-gray-200 transition duration-300 p-6 flex justify-between items-center cursor-pointer"
          onClick={() => setIsOpen(!isOpen)}
        >
          <h2 className="text-xl font-semibold text-gray-800">
            {header?.title}
          </h2>
          <Icon
            className={`h-4 w-4 text-gray-600 transition-transform duration-300 ease-out ${isOpen ? "rotate-180" : ""}`}
            id="expand"
          />
        </div>

        <div
          className={`
        transition-all duration-500 ease-out overflow-hidden 
        ${isOpen ? "max-h-[1000px] opacity-100 p-6" : "max-h-0 opacity-0"}
      `}
        >
          <div>
            <p className="text-gray-600">{header?.subtitle}</p>
            <form onSubmit={handleSubmit} className="mt-6">
              <div className="space-y-8">
                {content.map((item) => (
                  <div key={item.id}>
                    <label className="block text-md font-medium text-gray-700 mb-3">
                      {documentToReactComponents(item.question.json)}
                    </label>

                    {item.shape === "rate" && (
                      <Rate
                        currentValue={answers[item.id]?.answer}
                        item={item}
                        handleChange={handleAnswerChange}
                      />
                    )}

                    {item.shape === "text" && (
                      <TextArea
                        item={item}
                        currentValue={answers[item.id].answer}
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
        </div>
      </div>
    </section>
  );
};
