"use client";

import { IFeedbackQuestion, SectionHeader } from "@/utils/interfaces";
import { useCallback, useEffect, useState } from "react";
import { Icon } from "../Icon/Icon";
import { Survey } from "./Survey";
import { SurveySubmitted } from "./SurveySubmitted";
import { STORAGE_KEY } from "@/utils/constants";

export const FeedbackSurvey = ({
  header,
  submitHeader,
  content,
}: {
  header?: SectionHeader;
  submitHeader?: SectionHeader;
  content: IFeedbackQuestion[];
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [submitted, setSubmitted] = useState(false);

  const onSubmit = useCallback(() => {
    setSubmitted(true);

    setTimeout(() => {
      setIsOpen(false);
    }, 3000);
  }, []);

  useEffect(() => {
    const stored = localStorage?.getItem(STORAGE_KEY);

    if (stored) {
      try {
        const data = JSON.parse(stored);
        if (data.expiry && Date.now() < data.expiry) {
          setSubmitted(true);
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  return (
    <section className="w-full max-w-[1440px] my-12 p-6 px-4 md:px-20">
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
          {submitted ? (
            <SurveySubmitted header={submitHeader} />
          ) : (
            <Survey header={header} content={content} onSubmit={onSubmit} />
          )}
        </div>
      </div>
    </section>
  );
};
