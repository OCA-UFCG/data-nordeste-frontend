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
