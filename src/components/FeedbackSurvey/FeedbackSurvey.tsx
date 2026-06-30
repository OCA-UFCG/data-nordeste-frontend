"use client";

import { IFeedbackQuestion, SectionHeader } from "@/utils/interfaces";
import { useCallback, useEffect, useState } from "react";
import { Icon } from "../Icon/Icon";
import { Survey } from "./Survey";
import { SurveySubmitted } from "./SurveySubmitted";
import { readFeedbackSubmissionState } from "@/features/feedback/submissionStorage";

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
    setSubmitted(readFeedbackSubmissionState(localStorage));
  }, []);

  return (
    <section className="w-full bg-[#F8F7F8] py-12">
      <div className="mx-auto w-full max-w-[1440px] px-4 lg:px-20">
        <div className="w-full rounded-lg border-2 border-[#EFEFEF] bg-white">
          <div
            className="flex cursor-pointer items-center justify-between gap-[18px] rounded-lg bg-[#EFEFEF] p-6 transition-colors duration-300 hover:bg-[#E8E8E8]"
            onClick={() => setIsOpen(!isOpen)}
          >
            <h2 className="text-2xl font-semibold leading-9 tracking-[-0.0075em] text-[#292829]">
              {header?.title}
            </h2>

            <Icon
              id="expand"
              width={12}
              height={12}
              className={`shrink-0 text-[#292829] transition-transform duration-300 ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          </div>

          <div
            className={`overflow-hidden transition-all duration-500 ease-out ${
              isOpen ? "max-h-[1000px] p-6 opacity-100" : "max-h-0 opacity-0"
            }`}
          >
            {submitted ? (
              <SurveySubmitted header={submitHeader} />
            ) : (
              <Survey header={header} content={content} onSubmit={onSubmit} />
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
