import {
  type ReportDocResult,
  type ReportDocsRefreshOutcome,
  summarizeReportDocs,
} from "@/features/reportDocs/reportDocsRefresh";

const FAILURE_MESSAGES = {
  "senha-incorreta": "Senha incorreta. Tente de novo.",
  "indisponivel":
    "A atualização dos relatórios não está configurada neste ambiente. Fale com a equipe de desenvolvimento.",
  "em-andamento":
    "Já tem uma atualização dos relatórios em andamento. Espere alguns segundos e tente de novo.",
} as const;

// O relatório pronto fica em cache por 5 min no serviço (REPORT_CACHE_TTL_S).
const CACHE_NOTE =
  "Relatórios gerados a partir de agora usam o texto novo. Um relatório gerado nos últimos 5 minutos ainda pode sair com o texto anterior.";

const ERROR_BOX = "rounded-md border border-red-700 bg-red-50 p-4 text-red-800";

const BlockedDoc = ({ doc }: { doc: ReportDocResult }) => (
  <li className="flex flex-col gap-2">
    <span className="font-medium">
      {doc.label} {doc.status === "falhou" ? "(não foi possível baixar)" : ""}
    </span>
    {doc.warnings.map((warning) => (
      <pre
        key={warning}
        className="whitespace-pre-wrap break-words rounded bg-white p-2 text-sm"
      >
        {warning}
      </pre>
    ))}
  </li>
);

const CompletedRefresh = ({ docs }: { docs: ReportDocResult[] }) => {
  const { updated, blocked } = summarizeReportDocs(docs);
  const blockedDocs = docs.filter((doc) => doc.status !== "atualizado");

  return (
    <div role="status" className="flex flex-col gap-4">
      <p className="rounded-md border border-green-800 bg-green-50 p-4 text-green-900">
        {updated} de {docs.length} documentos atualizados. {CACHE_NOTE}
      </p>
      {blocked > 0 && (
        <div className="flex flex-col gap-3 rounded-md border border-amber-700 bg-amber-50 p-4 text-amber-900">
          <p>
            {blocked} documento(s) <strong>não foram atualizados</strong> e
            continuam com o texto anterior. Corrija no Google Doc e clique de
            novo:
          </p>
          <ul className="flex flex-col gap-4">
            {blockedDocs.map((doc) => (
              <BlockedDoc key={doc.label} doc={doc} />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

/** Resultado do botão "Atualizar relatórios". Ex.: `<ReportDocsRefreshResult outcome={state} />`. */
export function ReportDocsRefreshResult({
  outcome,
}: {
  outcome: ReportDocsRefreshOutcome;
}) {
  if (outcome.kind === "concluido")
    return <CompletedRefresh docs={outcome.docs} />;

  const message =
    outcome.kind === "erro" ? outcome.message : FAILURE_MESSAGES[outcome.kind];

  return (
    <p role="status" className={ERROR_BOX}>
      {message}
    </p>
  );
}
