import { initializeApp } from "firebase/app";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";
import { getToken } from "firebase/app-check";
import { UAParser } from "ua-parser-js";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const app = initializeApp(firebaseConfig);

let appCheckInstance = null;

const getAppCheck = () => {
  if (!appCheckInstance) {
    try {
      appCheckInstance = initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider(process.env.NEXT_PUBLIC_RECAPTCHA_KEY),
        isTokenAutoRefreshEnabled: true,
      });
    } catch (error) {
      console.error("Error initializing app check", error);
    }
  }
  
  return appCheckInstance;
};

export async function sendSurveyFeedback(answers) {
  try {
    const appCheck = getAppCheck();
    
    if (!appCheck) {
      throw new Error("App Check not initialized");
    }

    const tokenResult = await getToken(appCheck);

    const parser = new UAParser().getResult();

    const browserInfo = {
      name: parser.browser.name,
      version: parser.browser.version
    };

    const screenInfo = {
      width: window.screen.width,
      height: window.screen.height
    };

    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    const payload = {
      browser: browserInfo,
      screen: screenInfo,
      timeZone,
      answers 
    };

    const res = await fetch(
      process.env.NEXT_PUBLIC_SURVEY_FEEDBACK_URL,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Firebase-AppCheck": tokenResult.token
        },
        body: JSON.stringify(payload)
      }
    );

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const result = await res.json();

    return result;
    
  } catch (error) {
    console.error("Survey feedback error", error);
    throw error;
  }
}

