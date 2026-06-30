type GmailSendResult = {
  id?: string;
  threadId?: string;
};

const tokenUrl = "https://oauth2.googleapis.com/token";
const sendUrl = "https://gmail.googleapis.com/gmail/v1/users/me/messages/send";
const gmailEnvNames = ["GMAIL_CLIENT_ID", "GMAIL_CLIENT_SECRET", "GMAIL_REFRESH_TOKEN", "GMAIL_SENDER_EMAIL"] as const;

function requiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is not configured.`);
  }

  return value;
}

export function hasGmailConfig() {
  return getMissingGmailConfig().length === 0;
}

export function getMissingGmailConfig() {
  return gmailEnvNames.filter((name) => !process.env[name]);
}

function encodeHeader(value: string) {
  return `=?UTF-8?B?${Buffer.from(value, "utf8").toString("base64")}?=`;
}

function base64Url(value: string) {
  return Buffer.from(value, "utf8").toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function createRawEmail({
  to,
  from,
  subject,
  text,
}: {
  to: string;
  from: string;
  subject: string;
  text: string;
}) {
  const message = [
    `To: ${to}`,
    `From: ${from}`,
    `Subject: ${encodeHeader(subject)}`,
    "MIME-Version: 1.0",
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: 8bit",
    "",
    text,
  ].join("\r\n");

  return base64Url(message);
}

async function getAccessToken() {
  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: requiredEnv("GMAIL_CLIENT_ID"),
      client_secret: requiredEnv("GMAIL_CLIENT_SECRET"),
      refresh_token: requiredEnv("GMAIL_REFRESH_TOKEN"),
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Gmail token exchange failed: ${response.status} ${message}`);
  }

  const data = (await response.json()) as { access_token?: string };

  if (!data.access_token) {
    throw new Error("Gmail token exchange did not return access_token.");
  }

  return data.access_token;
}

export async function sendGmailMessage({
  to,
  subject,
  text,
}: {
  to: string;
  subject: string;
  text: string;
}): Promise<GmailSendResult> {
  const accessToken = await getAccessToken();
  const raw = createRawEmail({
    to,
    from: requiredEnv("GMAIL_SENDER_EMAIL"),
    subject,
    text,
  });

  const response = await fetch(sendUrl, {
    method: "POST",
    headers: {
      authorization: `Bearer ${accessToken}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ raw }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Gmail send failed: ${response.status} ${message}`);
  }

  return (await response.json()) as GmailSendResult;
}
