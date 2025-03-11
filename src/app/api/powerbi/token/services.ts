const cacheUrls = new Map<string, any>();

export const hasKey = (key: string) => {
  return cacheUrls.has(key);
};

export const getCachedPBI = (key: string) => {
  return cacheUrls.get(key);
};

export const addPBIToCache = (key: string, config: any) => {
  if (config) cacheUrls.set(key, config);
  else cacheUrls.delete(key);
};

export const removePBIfromCache = (key: string) => {
  cacheUrls.delete(key);
}

export const getPowerBIEmbededConfig = async (report_id: string) => {
  try {
    const authResponse = await authenticate();
    if (!authResponse.ok) {
      throw new Error("Authentication failed");
    }
    const auth = await authResponse.json();

    const embededReportsResponse = await claimEmbededReports(auth.access_token);
    if (!embededReportsResponse?.ok) {
      throw new Error("Failed to claim embeded reports");
    }
    const embededReports = await embededReportsResponse.json();
    const embededURL = embededReports.value.find(
      (report: any) => report.id === report_id,
    )?.embedUrl;

    const embededTokenResponse = await claimEmbededToken(
      auth.access_token,
      report_id,
    );
    if (!embededTokenResponse?.ok) {
      throw new Error("Failed to claim embeded token");
    }
    const embededToken = await embededTokenResponse.json();

    return {
      report_id,
      embed_url: embededURL,
      embed_token: embededToken.token,
      embed_expiration: embededToken.expiration,
    };
  } catch (error) {
    console.error("Error during authentication:", error);
    return null;
  }
};

async function claimEmbededToken(access_token: string, report_id: string) {
  const workspace_id = process.env.NEXT_PUBLIC_POWERBI_WORKSPACE_ID || "";
  const requestBody = JSON.stringify({ accessLevel: "View" });

  try {
    return await fetch(
      `https://api.powerbi.com/v1.0/myorg/groups/${workspace_id}/reports/${report_id}/GenerateToken`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${access_token}`,
          "Content-Type": "application/json",
        },
        body: requestBody,
      },
    );
  } catch (error) {
    console.error("Error in claimEmbededToken:", error);
    return null;
  }
}

async function claimEmbededReports(access_token: string) {
  const workspace_id = process.env.NEXT_PUBLIC_POWERBI_WORKSPACE_ID || "";
  try {
    return await fetch(
      `https://api.powerbi.com/v1.0/myorg/groups/${workspace_id}/reports`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      },
    );
  } catch (error) {
    console.error("Error in claimEmbededReports:", error);
    return null;
  }
}

async function authenticate() {
  const tenant_id = process.env.NEXT_PUBLIC_POWERBI_TENANT_ID || "";
  const client_id = process.env.NEXT_PUBLIC_POWERBI_CLIENT_ID || "";
  const client_secret = process.env.NEXT_PUBLIC_POWERBI_CLIENT_SECRET || "";

  const requestBody = new URLSearchParams({
    client_id: client_id,
    client_secret: client_secret,
    scope: "https://analysis.windows.net/powerbi/api/.default",
    grant_type: "client_credentials",
  }).toString();

  return fetch(
    `https://login.microsoftonline.com/${tenant_id}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: requestBody,
      cache: "no-cache",
    },
  );
}
