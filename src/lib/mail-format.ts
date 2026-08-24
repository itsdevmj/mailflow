import { MailMessage } from "@/types/mail";

export function senderParts(from = "") {
  const match = from.match(/^(.*?)\s*<([^>]+)>$/);
  const email = match?.[2] ?? from;
  const name = match?.[1]?.replace(/^["']|["']$/g, "") || email.split("@")[0] || "Unknown";
  return {
    name,
    email,
    initials: name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase(),
  };
}

export function displayDate(date: string) {
  const value = new Date(date);
  const today = new Date();
  return value.toDateString() === today.toDateString()
    ? value.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
    : value.toLocaleDateString([], { month: "short", day: "numeric" });
}

export function plainText(email: MailMessage) {
  if (email.text) return email.text;
  return (email.html ?? "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replaceAll("&nbsp;", " ")
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .trim();
}
