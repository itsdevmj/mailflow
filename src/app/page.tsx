import { cookies } from "next/headers";
import { MailboxApp } from "@/components/mail/mailbox-app";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";

export default async function Home() {
  const cookieStore = await cookies();
  const email = await verifySessionToken(cookieStore.get(SESSION_COOKIE)?.value);
  return <MailboxApp adminEmail={email ?? "admin"} />;
}
