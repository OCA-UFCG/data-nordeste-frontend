const ICON_PROPERTY = "--icon";
const ICON_SELECTOR = "i[style*='--icon']";
const VLIBRAS_APP_ROOT_ID = "vlibras-app-root";
const VLIBRAS_ICON_URL = /url\(([^)]*vlibras\\?\.gov\\?\.br[^)]*)\)/;

export type VlibrasIconLoader = (url: string) => Promise<string>;

export const readVlibrasIconUrl = (iconValue: string): string | null => {
  const match = iconValue.match(VLIBRAS_ICON_URL);

  return match ? match[1].replace(/\\/g, "") : null;
};

export const loadVlibrasIconAsBlobUrl: VlibrasIconLoader = async (url) => {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `VLibras icon request failed for "${url}" with status ${response.status}; expected an image response.`,
    );
  }

  return URL.createObjectURL(await response.blob());
};

const logIconFailure = (url: string, error: unknown) => {
  console.error(
    JSON.stringify({
      event: "vlibras_icon_load_failed",
      url,
      message: error instanceof Error ? error.message : String(error),
    }),
  );
};

const createIconRewriter = (loadIcon: VlibrasIconLoader) => {
  const loading = new Map<string, Promise<string>>();

  return async (icon: HTMLElement) => {
    const source = readVlibrasIconUrl(
      icon.style.getPropertyValue(ICON_PROPERTY),
    );

    if (!source) return;
    if (!loading.has(source)) loading.set(source, loadIcon(source));
    try {
      icon.style.setProperty(
        ICON_PROPERTY,
        `url(${await loading.get(source)})`,
      );
    } catch (error) {
      loading.delete(source);
      logIconFailure(source, error);
    }
  };
};

const observeShadowRoot = (
  shadow: ShadowRoot,
  rewriteIcon: (icon: HTMLElement) => Promise<void>,
): MutationObserver => {
  const rewriteAll = () =>
    shadow.querySelectorAll<HTMLElement>(ICON_SELECTOR).forEach(rewriteIcon);
  const observer = new MutationObserver(rewriteAll);

  rewriteAll();
  observer.observe(shadow, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ["style"],
  });

  return observer;
};

export const watchVlibrasIcons = (
  doc: Document,
  loadIcon: VlibrasIconLoader = loadVlibrasIconAsBlobUrl,
): (() => void) => {
  const rewriteIcon = createIconRewriter(loadIcon);
  const observers: MutationObserver[] = [];
  let watched: ShadowRoot | null = null;
  const watchAppRoot = () => {
    const shadow = doc.getElementById(VLIBRAS_APP_ROOT_ID)?.shadowRoot;

    if (!shadow || shadow === watched) return;
    watched = shadow;
    observers.push(observeShadowRoot(shadow, rewriteIcon));
  };
  const bodyObserver = new MutationObserver(watchAppRoot);

  watchAppRoot();
  bodyObserver.observe(doc.body, { childList: true });
  observers.push(bodyObserver);

  return () => observers.forEach((observer) => observer.disconnect());
};
