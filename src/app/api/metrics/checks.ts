import { checkBoletimPdf } from "@/features/boletim/pdfSource";
import { createMetricsChecker } from "@/features/monitoring/metricsChecker";
import { pingZenodoCommunity } from "@/lib/zenodo";
import { getContentUntil, pingContentful } from "@/utils/contentful";
import { BOLETIM_LINKS_LIMIT, BOLETIM_LINKS_QUERY } from "@/utils/queries";

type BoletimLinksResponse = { postCollection: { items: unknown[] } };

// IMPORTANT: só onde EXTERNAL_CHECKS=1 (prod). Contentful, Zenodo e os links dos
// boletins são os mesmos para prod e failover; testar nos dois só dobraria os
// pedidos ao gov.br e a cota do Contentful. O monitor coleta cada servidor pelo
// IP, e não pelo domínio: num failover de DNS o prod segue sendo coletado direto,
// e se ele cair quem avisa é o DataneForaDoAr. No failover as séries datane_*
// não existem de propósito; ali o /api/metrics só diz que o site responde (o `up`
// do Prometheus).
const runsExternalChecks = () => process.env.EXTERNAL_CHECKS === "1";

export const { getMetricsReport } = createMetricsChecker({
  pingContentful,
  pingZenodo: pingZenodoCommunity,
  getBoletimLinks: async (signal) => {
    const response =
      await getContentUntil(signal)<BoletimLinksResponse>(BOLETIM_LINKS_QUERY);

    return response.postCollection.items;
  },
  checkBoletimPdf,
  runsExternalChecks,
  boletimListLimit: BOLETIM_LINKS_LIMIT,
});
