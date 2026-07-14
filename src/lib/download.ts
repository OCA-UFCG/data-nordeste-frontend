export type BrowserDownloadDeps = {
  createAnchor: () => HTMLAnchorElement;
};

export const browserDownloadDeps: BrowserDownloadDeps = {
  createAnchor: () => document.createElement("a"),
};

/** Starts a browser download from its source URL. Example: `await downloadFile(url, "dados.csv")`. */
export const downloadFile = async (
  url: string,
  name: string,
  deps: BrowserDownloadDeps = browserDownloadDeps,
): Promise<void> => {
  const link = deps.createAnchor();

  link.href = url;
  link.download = name;
  link.rel = "noopener noreferrer";
  link.click();
};
