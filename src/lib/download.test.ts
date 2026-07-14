import { describe, expect, it, vi } from "vitest";
import { downloadFile } from "./download";

describe("downloadFile", () => {
  it("downloads from the source without opening another tab", async () => {
    const link = document.createElement("a");
    const click = vi.spyOn(link, "click").mockImplementation(() => undefined);

    await downloadFile("https://zenodo.org/dados.csv", "economia.csv", {
      createAnchor: () => link,
    });

    expect(link.href).toBe("https://zenodo.org/dados.csv");
    expect(link.download).toBe("economia.csv");
    expect(link.rel).toBe("noopener noreferrer");
    expect(link.target).toBe("");
    expect(click).toHaveBeenCalledOnce();
  });
});
