export type ResendEmail = {
  id: string;
  from: string;
  to: string[];
  subject: string;
  created_at: string;
  text?: string | null;
  html?: string | null;
};

type ResendList = {
  data: ResendEmail[];
  has_more: boolean;
};

async function resendRequest(path: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY is not configured.");

  const response = await fetch(`https://api.resend.com${path}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
    cache: "no-store",
  });
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message ?? "Resend request failed.");
  }
  return result;
}

export async function listResendEmails(
  source: "RECEIVED" | "SENT",
  limit: number,
  after?: string | null,
) {
  const query = new URLSearchParams({ limit: String(limit) });
  if (after) query.set("after", after);
  const path = source === "RECEIVED" ? "/emails/receiving" : "/emails";
  return resendRequest(`${path}?${query}`) as Promise<ResendList>;
}

export async function getResendEmail(
  id: string,
  source: "RECEIVED" | "SENT",
) {
  const path = source === "RECEIVED"
    ? `/emails/receiving/${encodeURIComponent(id)}`
    : `/emails/${encodeURIComponent(id)}`;
  const email = await resendRequest(path) as ResendEmail;
  return {
    ...email,
    to: Array.isArray(email.to) ? email.to : [email.to],
  };
}
