import type { IPublication } from "@/utils/interfaces";
import type { PostType } from "@/features/posts/postTypes";
import type { ContentfulRichTextField } from "@/utils/interfaces";

export type BoletimDetail = {
  sys: { id: string };
  title: string;
  link: string;
  type: PostType;
  thumb: { url: string };
  date: string;
  description?: ContentfulRichTextField;
  categoryCollection: {
    items: { name: string; sys: { id: string } }[];
  };
};

export type RelatedBoletim = Pick<
  IPublication,
  "title" | "link" | "thumb" | "type" | "date" | "description"
> & {
  sys: { id: string };
};

/**
 * Extracts a filename from a PDF URL's pathname for toolbar display.
 *
 * Usage: extractPdfFileName("https://cdn.example.com/files/report.pdf") => "report.pdf"
 */
export const extractPdfFileName = (pdfUrl: string): string => {
  try {
    const url = new URL(pdfUrl);
    const segments = url.pathname.split("/").filter(Boolean);
    const lastSegment = segments.at(-1);

    return lastSegment && lastSegment.includes(".")
      ? decodeURIComponent(lastSegment)
      : "documento.pdf";
  } catch {
    return "documento.pdf";
  }
};
