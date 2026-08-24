import { NextResponse } from "next/server";
import { Resend } from "resend";
import { z } from "zod";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";

const emailSchema = z.object({
  to: z.email(),
  subject: z.string().trim().min(1).max(500),
  message: z.string().trim().min(1).max(100_000),
  draftId: z.string().optional(),
});

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export async function POST(request: Request) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "RESEND_API_KEY is not configured." },
      { status: 500 },
    );
  }

  try {
    const { to, subject, message, draftId } = emailSchema.parse(await request.json());

    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? "Mailflow <onboarding@resend.dev>",
      to: [to],
      subject,
      text: message,
      html: `<!doctype html><html><body style="margin:0;padding:0;background:#ffffff"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:#ffffff"><tr><td style="padding:28px 32px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:16px;line-height:1.7;color:#1f2937;white-space:pre-wrap;overflow-wrap:anywhere">${escapeHtml(message)}</td></tr></table></body></html>`,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (draftId && process.env.DATABASE_URL) {
      await getDb().draft.deleteMany({ where: { id: draftId } });
    }
    return NextResponse.json({ id: data?.id });
  } catch (cause) {
    return NextResponse.json(
      { error: cause instanceof Error ? cause.message : "Invalid email request." },
      { status: 400 },
    );
  }
}
