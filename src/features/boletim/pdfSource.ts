// IMPORTANT: /api/pdf-proxy busca esta URL a partir do servidor, então ela só pode
// apontar para os hosts onde os boletins são publicados. Em 01/11/2026 o Contentful tinha
// 18 boletins: 17 em www.gov.br e 1 no Google Drive ("Mercado de Carbono no Bioma
// Caatinga"), que redireciona de drive.google.com para drive.usercontent.google.com.
// Um boletim em outro host aparece como `pdf_proxy_rejected` nos logs, e o host
// entra aqui.
const ALLOWED_PDF_HOSTS: ReadonlySet<string> = new Set([
  "www.gov.br",
  "drive.google.com",
  "drive.usercontent.google.com",
]);

// Todo PDF começa com "%PDF-". O Drive entrega o arquivo como
// application/octet-stream, então o tipo declarado não serve para reconhecer PDF.
const PDF_SIGNATURE = [0x25, 0x50, 0x44, 0x46, 0x2d];

/**
 * Returns the boletim PDF URL when it is https on an allowed host, otherwise null.
 *
 * Usage: parseAllowedPdfUrl("https://www.gov.br/sudene/x.pdf") => URL
 */
export function parseAllowedPdfUrl(rawUrl: string): URL | null {
  if (!URL.canParse(rawUrl)) return null;

  const url = new URL(rawUrl);
  const isAllowed =
    url.protocol === "https:" && ALLOWED_PDF_HOSTS.has(url.hostname);

  return isAllowed ? url : null;
}

/**
 * Whether the bytes are a PDF file, whatever Content-Type the host declared.
 *
 * Usage: hasPdfSignature(new TextEncoder().encode("%PDF-1.7")) => true
 */
export function hasPdfSignature(bytes: Uint8Array): boolean {
  return PDF_SIGNATURE.every((byte, index) => bytes[index] === byte);
}

// O Drive faz 1 salto (drive.google.com → drive.usercontent.google.com).
const MAX_REDIRECTS = 3;

export type AllowedPdfFetch = { response: Response } | { rejection: string };

// IMPORTANT: redirect seguido à mão, conferindo cada salto contra a lista. O
// redirect automático do fetch levaria a qualquer host que o servidor de fora
// indicasse, e furaria a lista.
/**
 * Fetches the URL following redirects by hand, only through allowed hosts.
 *
 * Usage: await fetchThroughAllowedHosts(new URL("https://drive.google.com/uc?id=abc"))
 * => { response } | { rejection: "redirect_not_allowed" | "too_many_redirects" }
 */
export async function fetchThroughAllowedHosts(
  url: URL,
  signal?: AbortSignal,
): Promise<AllowedPdfFetch> {
  let current = url;

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const response = await fetch(current, { redirect: "manual", signal });
    const location = response.headers.get("Location");
    if (!isRedirect(response.status) || !location) return { response };

    // O socket só volta ao pool quando o corpo do 3xx é consumido ou cancelado.
    await discardBody(response);
    const next = parseAllowedPdfUrl(new URL(location, current).href);
    if (!next) return { rejection: "redirect_not_allowed" };
    current = next;
  }

  return { rejection: "too_many_redirects" };
}

function isRedirect(status: number): boolean {
  return status >= 300 && status < 400;
}

// Cancelar rejeita quando a conexão já caiu no corpo; como o corpo só precisa
// ser descartado, isso não pode mudar o resultado da resposta.
async function discardBody(response: Response): Promise<void> {
  await response.body?.cancel().catch(() => undefined);
}

export type AllowedPdfOpening =
  | { response: Response }
  | { rejection: string; upstreamStatus?: number };

/**
 * Opens a boletim link by the proxy rules: https on an allowed host, every
 * redirect checked, and a 2xx answer. The caller owns the body of `response`.
 * `upstreamStatus` is set when the host itself answered with an error.
 *
 * Usage: await openAllowedPdf("https://www.gov.br/x.pdf") => { response }
 */
export async function openAllowedPdf(
  rawUrl: string,
  signal?: AbortSignal,
): Promise<AllowedPdfOpening> {
  const pdfUrl = parseAllowedPdfUrl(rawUrl);
  if (!pdfUrl) return { rejection: "host_not_allowed" };

  const fetched = await fetchThroughAllowedHosts(pdfUrl, signal);
  if ("rejection" in fetched) return fetched;

  const { response } = fetched;
  if (response.ok) return { response };

  await discardBody(response);

  return {
    rejection: `HTTP ${response.status}`,
    upstreamStatus: response.status,
  };
}

/**
 * Why the boletim link would not open in /api/pdf-proxy, or null when it opens.
 * Same rules as the proxy (openAllowedPdf), but reads only the first bytes.
 *
 * Usage: await checkBoletimPdf("https://www.gov.br/.../x.pdf") => "not_a_pdf"
 */
export async function checkBoletimPdf(
  rawUrl: string,
  signal?: AbortSignal,
): Promise<string | null> {
  const opened = await openAllowedPdf(rawUrl, signal);
  if ("rejection" in opened) return opened.rejection;

  const head = await readFirstBytes(opened.response, PDF_SIGNATURE.length);

  return hasPdfSignature(head) ? null : "not_a_pdf";
}

// O PDF do Drive tem ~12 MB: baixar tudo a cada verificação seria desperdício.
async function readFirstBytes(
  response: Response,
  count: number,
): Promise<Uint8Array> {
  const reader = response.body?.getReader();
  if (!reader) return new Uint8Array();

  const bytes: number[] = [];
  while (bytes.length < count) {
    const { done, value } = await reader.read();
    if (done) break;
    bytes.push(...value.subarray(0, count - bytes.length));
  }
  await reader.cancel();

  return Uint8Array.from(bytes);
}
