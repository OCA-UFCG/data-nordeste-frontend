import { describe, expect, it } from "vitest";
import { ReportBusyError } from "./reportBusyError";

describe("ReportBusyError", () => {
  it("is distinguishable from a plain Error by type, not by message content", () => {
    const error = new ReportBusyError();

    expect(error).toBeInstanceOf(ReportBusyError);
    expect(error.name).toBe("ReportBusyError");
  });
});
