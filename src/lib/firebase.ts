import { IFeedbackAnswer } from "@/utils/interfaces";
import { initializeApp } from "firebase/app";
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

const getAppCheck = () => {
  if (!appCheckInstance) {
    try {
      appCheckInstance = initializeAppCheck(app, {
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

export async function sendSurveyFeedback(answers: IFeedbackAnswer[]) {
  try {
    const appCheck = getAppCheck();

    if (!appCheck) {
      throw new Error(
        "Firebase App Check was not initialized; expected a valid NEXT_PUBLIC_RECAPTCHA_KEY and browser App Check support.",
      );
    }

    const tokenResult = await getToken(appCheck);

    const parser = new UAParser().getResult();

    const browserInfo = {
      name: parser.browser.name,
      version: parser.browser.version,
    };

    const screenInfo = {
      width: window.screen.width,
      height: window.screen.height,
    };

    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    const payload = {
      browser: browserInfo,
      screen: screenInfo,
      timeZone,
      answers,
    };

    const feedbackUrl = getRequiredPublicEnv("NEXT_PUBLIC_SURVEY_FEEDBACK_URL");

    const res = await fetch(feedbackUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Firebase-AppCheck": tokenResult.token,
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
