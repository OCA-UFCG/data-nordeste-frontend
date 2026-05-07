export type BrowserDownloadDeps = {
  createObjectUrl: (blob: Blob) => string;
  fetcher: typeof fetch;
  revokeObjectUrl: (url: string) => void;
  createAnchor: () => HTMLAnchorElement;
};

export const browserDownloadDeps: BrowserDownloadDeps = {
  createObjectUrl: (blob) => URL.createObjectURL(blob),
  fetcher: fetch,
  revokeObjectUrl: (url) => URL.revokeObjectURL(url),
  createAnchor: () => document.createElement("a"),
};

export const downloadFile = async (
  url: string,
  name: string,
  deps: BrowserDownloadDeps = browserDownloadDeps,
) => {
  const response = await deps.fetcher(url);
  const blob = await response.blob();
  const blobUrl = deps.createObjectUrl(blob);
  const link = deps.createAnchor();

  link.href = blobUrl;
  link.download = name;
  link.click();
  deps.revokeObjectUrl(blobUrl);
};
