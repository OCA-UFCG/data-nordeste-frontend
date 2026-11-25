import type { PibInfoParagraph } from "@/components/PibDashboard/pibTexts";

/**
 * Corpo do ⓘ: um parágrafo por item, com o termo definido em negrito.
 *
 * @example <ProtoCardInfo title="Mapa" text={<PibInfoParagraphs paragraphs={PIB_INFO} />} />
 */
export const PibInfoParagraphs = ({
  paragraphs,
}: {
  paragraphs: readonly PibInfoParagraph[];
}) =>
  paragraphs.map(({ term, rest }) => (
    <p key={rest}>
      {term && <b>{term}</b>}
      {rest}
    </p>
  ));
