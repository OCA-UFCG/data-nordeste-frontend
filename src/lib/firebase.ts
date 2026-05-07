import { IFeedbackAnswer } from "@/utils/interfaces";
import { FirebaseApp, initializeApp } from "firebase/app";
import {
  AppCheck,
  initializeAppCheck,
  ReCaptchaV3Provider,
} from "firebase/app-check";
import { getToken } from "firebase/app-check";
import { UAParser } from "ua-parser-js";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

type BrowserInfo = {
  name?: string;
  version?: string;
};

type ScreenInfo = {
  width: number;
  height: number;
};

type SurveyFeedbackPayload = {
  browser: BrowserInfo;
  screen: ScreenInfo;
  timeZone: string;
  answers: IFeedbackAnswer[];
};

type SurveyFeedbackClientDeps = {
  appCheckToken: () => Promise<string>;
  endpoint: () => string;
  fetcher: typeof fetch;
  getBrowserInfo: () => BrowserInfo;
  getScreenInfo: () => ScreenInfo;
  getTimeZone: () => string;
};

const getRequiredPublicEnv = (name: string): string => {
  const value = process.env[name];

  if (!value) {
    throw new Error(
      `Missing public env "${name}"; expected it to be configured before submitting survey feedback.`,
    );
  }

  return value;
};

const serializeError = (error: unknown) => {
  if (error instanceof Error) {
    return { name: error.name, message: error.message };
  }

  return { message: String(error) };
};

export const app = initializeApp(firebaseConfig);

let appCheckInstance: AppCheck | null = null;

const getAppCheck = (firebaseApp: FirebaseApp = app) => {
  if (!appCheckInstance) {
    try {
      appCheckInstance = initializeAppCheck(firebaseApp, {
        provider: new ReCaptchaV3Provider(
          getRequiredPublicEnv("NEXT_PUBLIC_RECAPTCHA_KEY"),
        ),
        isTokenAutoRefreshEnabled: true,
      });
    } catch (error) {
      console.error(
        JSON.stringify({
          message: "Firebase App Check initialization failed",
          hasRecaptchaKey: Boolean(process.env.NEXT_PUBLIC_RECAPTCHA_KEY),
          error: serializeError(error),
        }),
      );
    }
  }

  return appCheckInstance;
};

const getDefaultAppCheckToken = async (): Promise<string> => {
  const appCheck = getAppCheck();

  if (!appCheck) {
    throw new Error(
      "Firebase App Check was not initialized; expected a valid NEXT_PUBLIC_RECAPTCHA_KEY and browser App Check support.",
    );
  }

  const tokenResult = await getToken(appCheck);

  return tokenResult.token;
};

const getDefaultBrowserInfo = (): BrowserInfo => {
  const parser = new UAParser().getResult();

  return {
    name: parser.browser.name,
    version: parser.browser.version,
  };
};

const getDefaultScreenInfo = (): ScreenInfo => ({
  width: window.screen.width,
  height: window.screen.height,
});

const getDefaultTimeZone = (): string =>
  Intl.DateTimeFormat().resolvedOptions().timeZone;

const buildSurveyFeedbackPayload = (
  answers: IFeedbackAnswer[],
  deps: SurveyFeedbackClientDeps,
): SurveyFeedbackPayload => ({
  browser: deps.getBrowserInfo(),
  screen: deps.getScreenInfo(),
  timeZone: deps.getTimeZone(),
  answers,
});

export const createSurveyFeedbackClient = (deps: SurveyFeedbackClientDeps) => {
  return async function submitSurveyFeedback(answers: IFeedbackAnswer[]) {
    const token = await deps.appCheckToken();
    const feedbackUrl = deps.endpoint();
    const payload = buildSurveyFeedbackPayload(answers, deps);

    const res = await deps.fetcher(feedbackUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Firebase-AppCheck": token,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error(
        `Survey feedback request failed for endpoint "${feedbackUrl}" with status ${res.status}; expected 2xx JSON response.`,
      );
    }

    const result = await res.json();

    return result;
  };
};

const defaultSurveyFeedbackClient = createSurveyFeedbackClient({
  appCheckToken: getDefaultAppCheckToken,
  endpoint: () => getRequiredPublicEnv("NEXT_PUBLIC_SURVEY_FEEDBACK_URL"),
  fetcher: fetch,
  getBrowserInfo: getDefaultBrowserInfo,
  getScreenInfo: getDefaultScreenInfo,
  getTimeZone: getDefaultTimeZone,
});

export async function sendSurveyFeedback(answers: IFeedbackAnswer[]) {
  try {
    return await defaultSurveyFeedbackClient(answers);
  } catch (error) {
    console.error(
      JSON.stringify({
        message: "Survey feedback submission failed",
        answerCount: answers.length,
        error: serializeError(error),
      }),
    );
    throw error;
  }
}
