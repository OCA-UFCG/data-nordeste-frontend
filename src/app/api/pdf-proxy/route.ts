import { NextResponse } from "next/server";
import {
  hasPdfSignature,
  parseAllowedPdfUrl,
} from "@/features/boletim/pdfSource";

// O Drive faz 1 salto (drive.google.com → drive.usercontent.google.com).
const MAX_REDIRECTS = 3;

type AllowedPdfFetch = { response: Response } | { rejection: string };

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

// IMPORTANT: redirect seguido à mão, conferindo cada salto contra a lista. O
// redirect automático do fetch levaria a qualquer host que o servidor de fora
// indicasse, e furaria a lista.
async function fetchThroughAllowedHosts(url: URL): Promise<AllowedPdfFetch> {
  let current = url;

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const response = await fetch(current, { redirect: "manual" });
    const location = response.headers.get("Location");
    if (!isRedirect(response.status) || !location) return { response };

    const next = parseAllowedPdfUrl(new URL(location, current).href);
    if (!next) return { rejection: "redirect_not_allowed" };
    current = next;
  }

  return { rejection: "too_many_redirects" };
}

function isRedirect(status: number): boolean {
  return status >= 300 && status < 400;
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
