import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { MailboxApp } from "@/components/mail/mailbox-app";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";
import { MailView } from "@/types/mail";

const folders = new Set<MailView>([
  "inbox",
  "unread",
  "starred",
  "sent",
  "drafts",
  "archive",
  "spam",
  "trash",
]);

export default async function FolderPage({
  params,
}: {
  params: Promise<{ folder: string }>;
}) {
  const [{ folder }, cookieStore] = await Promise.all([params, cookies()]);
  if (!folders.has(folder as MailView)) notFound();
  const email = await verifySessionToken(cookieStore.get(SESSION_COOKIE)?.value);
  return <MailboxApp adminEmail={email ?? "admin"} initialView={folder as MailView} />;
}
