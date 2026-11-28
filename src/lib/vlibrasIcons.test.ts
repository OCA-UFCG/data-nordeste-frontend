import { afterEach, describe, expect, it, vi } from "vitest";
import { readVlibrasIconUrl, watchVlibrasIcons } from "@/lib/vlibrasIcons";

const ESCAPED_X_ICON =
  "url(https\\:\\/\\/vlibras\\.gov\\.br\\/app\\/assets\\/icons\\/x\\.webp)";
const X_ICON = "https://vlibras.gov.br/app/assets/icons/x.webp";

class VlibrasIconLoaderFake {
  readonly requested: string[] = [];

  load = async (url: string): Promise<string> => {
    this.requested.push(url);

    return `blob:fake/${url.split("/").pop()}`;
  };
}

const mountWidget = (iconCount = 1): ShadowRoot => {
  const host = document.createElement("div");

  host.id = "vlibras-app-root";
  document.body.appendChild(host);
  const shadow = host.attachShadow({ mode: "open" });

  for (let index = 0; index < iconCount; index++) {
    const icon = document.createElement("i");

    icon.style.setProperty("--icon", ESCAPED_X_ICON);
    shadow.appendChild(icon);
  }

  return shadow;
};

const iconValues = (shadow: ShadowRoot): string[] =>
  [...shadow.querySelectorAll("i")].map((icon) =>
    icon.style.getPropertyValue("--icon"),
  );

describe("readVlibrasIconUrl", () => {
  it("tira os escapes da URL do ícone do VLibras", () => {
    expect(readVlibrasIconUrl(ESCAPED_X_ICON)).toBe(X_ICON);
  });

  it("ignora ícones que já não apontam para o VLibras", () => {
    expect(readVlibrasIconUrl("url(blob:fake/x.webp)")).toBeNull();
  });
});

describe("watchVlibrasIcons", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("troca o ícone pela URL do carregador quando o widget abre depois", async () => {
    const loader = new VlibrasIconLoaderFake();
    const stop = watchVlibrasIcons(document, loader.load);

    const shadow = mountWidget();

    await vi.waitFor(() =>
      expect(iconValues(shadow)).toEqual(["url(blob:fake/x.webp)"]),
    );
    stop();
  });

  it("baixa cada ícone uma vez só", async () => {
    const loader = new VlibrasIconLoaderFake();
    const shadow = mountWidget(2);
    const stop = watchVlibrasIcons(document, loader.load);

    await vi.waitFor(() =>
      expect(iconValues(shadow)).toEqual([
        "url(blob:fake/x.webp)",
        "url(blob:fake/x.webp)",
      ]),
    );
    expect(loader.requested).toEqual([X_ICON]);
    stop();
  });
});
