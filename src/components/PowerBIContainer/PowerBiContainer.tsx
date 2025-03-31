"use client";
import { ReportData } from "@/utils/interfaces";

const PowerBIContainer = ({ panel }: { panel: { fields: ReportData } }) => {
  const { title, source } = panel.fields;

  return (
    <iframe
      src={source}
      title={title}
      width="100%"
      height="100%"
      allowFullScreen={true}
      style={{ border: "none" }}
    />
  );
};

export default PowerBIContainer;
