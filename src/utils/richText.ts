import { documentToPlainTextString } from "@contentful/rich-text-plain-text-renderer";
import { BLOCKS, type Document } from "@contentful/rich-text-types";
import type { ContentfulRichTextField } from "./interfaces";

/** Returns searchable plain text from a Contentful Rich Text field. Example: `richTextToPlainText(post.description)`. */
export function richTextToPlainText(
  field?: ContentfulRichTextField | null,
): string {
  if (!field?.json) return "";

  return documentToPlainTextString(field.json);
}

/** Wraps cached plain text in Contentful's Rich Text shape. Example: `plainTextToRichText("Resumo")`. */
export function plainTextToRichText(text: string): ContentfulRichTextField {
  const document: Document = {
    nodeType: BLOCKS.DOCUMENT,
    data: {},
    content: text.split(/\r?\n/).map((line) => ({
      nodeType: BLOCKS.PARAGRAPH,
      data: {},
      content: [{ nodeType: "text", value: line, marks: [], data: {} }],
    })),
  };

  return { json: document };
}
