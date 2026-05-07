import { STORAGE_KEY } from "@/utils/constants";

const SUBMISSION_SUPPRESSION_HOURS = 24;

type FeedbackSubmissionState = {
  submitted: true;
  expiry: number;
};

export const createFeedbackSubmissionState = (
  now: number = Date.now(),
): FeedbackSubmissionState => ({
  submitted: true,
  expiry: now + SUBMISSION_SUPPRESSION_HOURS * 60 * 60 * 1000,
});

export const readFeedbackSubmissionState = (
  storage: Storage,
  now: number = Date.now(),
): boolean => {
  const stored = storage.getItem(STORAGE_KEY);
  if (!stored) return false;

  try {
    const parsed = JSON.parse(stored) as Partial<FeedbackSubmissionState>;
    if (parsed.expiry && now < parsed.expiry) return true;
  } catch {
    storage.removeItem(STORAGE_KEY);

    return false;
  }

  storage.removeItem(STORAGE_KEY);

  return false;
};

export const writeFeedbackSubmissionState = (
  storage: Storage,
  state: FeedbackSubmissionState = createFeedbackSubmissionState(),
) => {
  // INTENTIONAL: successful feedback suppresses the survey locally for 24 hours
  // so users are not repeatedly prompted during the same browsing session.
  storage.setItem(STORAGE_KEY, JSON.stringify(state));
};
