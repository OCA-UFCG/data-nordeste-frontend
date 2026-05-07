import { describe, expect, it } from "vitest";
import {
  createFeedbackSubmissionState,
  readFeedbackSubmissionState,
  writeFeedbackSubmissionState,
} from "./submissionStorage";

class FakeStorage implements Storage {
  private values: { [key: string]: string } = {};

  get length() {
    return Object.keys(this.values).length;
  }

  clear() {
    this.values = {};
  }

  getItem(key: string) {
    return this.values[key] ?? null;
  }

  key(index: number) {
    return Object.keys(this.values)[index] ?? null;
  }

  removeItem(key: string) {
    delete this.values[key];
  }

  setItem(key: string, value: string) {
    this.values[key] = value;
  }
}

describe("feedback submission storage", () => {
  it("suppresses feedback for the expected local window", () => {
    const storage = new FakeStorage();
    writeFeedbackSubmissionState(storage, createFeedbackSubmissionState(1000));

    expect(readFeedbackSubmissionState(storage, 2000)).toBe(true);
  });

  it("removes expired or invalid state", () => {
    const storage = new FakeStorage();
    writeFeedbackSubmissionState(storage, createFeedbackSubmissionState(1000));

    expect(readFeedbackSubmissionState(storage, 90_000_000)).toBe(false);
    expect(storage.length).toBe(0);
  });
});
