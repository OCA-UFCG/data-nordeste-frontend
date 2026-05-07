import { describe, expect, it, vi } from "vitest";
import { createSurveyFeedbackClient } from "./firebase";

class FakeSurveyFeedbackResponse {
  ok = true;
  status = 200;

  async json() {
    return { ok: true };
  }
}

describe("createSurveyFeedbackClient", () => {
  it("submits feedback with injected browser dependencies", async () => {
    const fetcher = vi.fn().mockResolvedValue(new FakeSurveyFeedbackResponse());
    const client = createSurveyFeedbackClient({
      appCheckToken: async () => "token",
      endpoint: () => "https://feedback.example.com",
      fetcher,
      getBrowserInfo: () => ({ name: "Firefox", version: "1" }),
      getScreenInfo: () => ({ width: 1024, height: 768 }),
      getTimeZone: () => "America/Sao_Paulo",
    });

    await expect(
      client([{ id: "question", text: "Question", answer: 5 }]),
    ).resolves.toEqual({ ok: true });
    expect(fetcher).toHaveBeenCalledWith(
      "https://feedback.example.com",
      expect.objectContaining({
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Firebase-AppCheck": "token",
        },
      }),
    );
  });
});
