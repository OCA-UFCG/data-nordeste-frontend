import { ARIDEZ_INDEX_DEFINITION } from "@/components/AridezDashboard/aridezTexts";

/**
 * Conteúdo do ⓘ dos cards de aridez: a leitura específica do card (`lead`),
 * seguida da definição do índice. Vai dentro de um contêiner que estiliza os
 * `<p>` irmãos (`[&>p+p]:mt-2`), por isso o `<ul>` e o primeiro parágrafo
 * depois dele levam `mt-2` explícito.
 *
 * @example <ProtoCardInfo title="Índice de aridez" text={<AridezIndexInfo lead={ARIDEZ_CARD_INFO.map} />} />
 */
export const AridezIndexInfo = ({ lead }: { lead: string }) => (
  <>
    <p>{lead}</p>
    {ARIDEZ_INDEX_DEFINITION.intro.map((text) => (
      <p key={text}>{text}</p>
    ))}
    <ul className="mt-2 list-disc pl-5">
      {ARIDEZ_INDEX_DEFINITION.classes.map((text) => (
        <li key={text}>{text}</li>
      ))}
    </ul>
    {ARIDEZ_INDEX_DEFINITION.outro.map((text, index) => (
      <p key={text} className={index === 0 ? "mt-2" : undefined}>
        {text}
      </p>
    ))}
  </>
);
