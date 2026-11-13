import { NextResponse } from "next/server";
import {
  fetchThroughAllowedHosts,
  hasPdfSignature,
  parseAllowedPdfUrl,
} from "@/features/boletim/pdfSource";

/** Streams a boletim PDF from an allowed host. Example: `GET /api/pdf-proxy?url=https://www.gov.br/...pdf`. */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get("url");

  if (!targetUrl) {
    return new NextResponse("URL is required", { status: 400 });
  }

  const pdfUrl = parseAllowedPdfUrl(targetUrl);
  if (!pdfUrl) return rejectPdfRequest(targetUrl, "host_not_allowed", 403);

  try {
    return await proxyAllowedPdf(targetUrl, pdfUrl);
  } catch (error) {
    console.error(
      JSON.stringify({
        event: "pdf_proxy_failed",
        url: targetUrl,
        error: error instanceof Error ? error.message : String(error),
      }),
    );

    return new NextResponse("Error fetching PDF", { status: 500 });
  }
}

async function proxyAllowedPdf(
  targetUrl: string,
  pdfUrl: URL,
): Promise<NextResponse> {
  const fetched = await fetchThroughAllowedHosts(pdfUrl);
  if ("rejection" in fetched) {
    return rejectPdfRequest(targetUrl, fetched.rejection, 403);
  }

  const { response } = fetched;
  if (!response.ok) {
    return new NextResponse("Failed to fetch PDF", { status: response.status });
  }

  // ponytail: lê o PDF inteiro para conferir a assinatura (o do Drive tem ~12 MB);
  // ler só o começo do stream, se PDFs muito maiores pesarem na memória.
  const pdfBuffer = await response.arrayBuffer();

  return hasPdfSignature(new Uint8Array(pdfBuffer))
    ? buildPdfResponse(pdfBuffer)
    : rejectPdfRequest(targetUrl, "not_a_pdf", 502);
}

// WARNING: não repassar o Content-Type de fora nem abrir CORS: só o próprio portal
// usa esta rota, e repassar HTML aqui o executaria no domínio do portal.
function buildPdfResponse(pdfBuffer: ArrayBuffer): NextResponse {
  return new NextResponse(pdfBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "public, max-age=3600",
    },
  });
}

function rejectPdfRequest(
  targetUrl: string,
  reason: string,
  status: number,
): NextResponse {
  console.warn(
    JSON.stringify({ event: "pdf_proxy_rejected", reason, url: targetUrl }),
  );

  return new NextResponse(
    `PDF proxy rejected "${targetUrl}" (${reason}); expected an https PDF on an allowed boletim host.`,
    { status },
  );
}
