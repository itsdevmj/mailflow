import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { getResendEmail } from "@/lib/resend-mail";

const sourceSchema = z.enum(["RECEIVED", "SENT"]);
const updateSchema = z.object({
  source: sourceSchema.default("RECEIVED"),
  isRead: z.boolean().optional(),
  starred: z.boolean().optional(),
  folder: z.enum(["INBOX", "ARCHIVE", "SPAM", "TRASH"]).optional(),
  labelId: z.string().min(1).optional(),
  labelAction: z.enum(["add", "remove"]).optional(),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const requestedSource = new URL(request.url).searchParams.get("source");
    let source = requestedSource ? sourceSchema.parse(requestedSource) : "RECEIVED" as const;
    const db = getDb();
    let email;
    try {
      email = await getResendEmail(id, source);
    } catch (cause) {
      if (requestedSource || source === "SENT") throw cause;
      source = "SENT";
      email = await getResendEmail(id, source);
    }
    const state = await db.emailState.upsert({
      where: { emailId_source: { emailId: id, source } },
      create: { emailId: id, source, isRead: true },
      update: { isRead: true },
      include: { labels: { include: { label: true } } },
    });
    return NextResponse.json({
      ...email,
      source,
      state: {
        folder: state.folder,
        isRead: state.isRead,
        starred: state.starred,
        labels: state.labels.map(({ label }) => label),
      },
    });
  } catch (cause) {
    return NextResponse.json(
      { error: cause instanceof Error ? cause.message : "Unable to load email." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const update = updateSchema.parse(await request.json());
    const db = getDb();
    const state = await db.emailState.upsert({
      where: { emailId_source: { emailId: id, source: update.source } },
      create: {
        emailId: id,
        source: update.source,
        isRead: update.isRead,
        starred: update.starred,
        folder: update.folder,
      },
      update: {
        isRead: update.isRead,
        starred: update.starred,
        folder: update.folder,
      },
    });

    if (update.labelId && update.labelAction) {
      if (update.labelAction === "add") {
        await db.emailLabel.upsert({
          where: { emailStateId_labelId: { emailStateId: state.id, labelId: update.labelId } },
          create: { emailStateId: state.id, labelId: update.labelId },
          update: {},
        });
      } else {
        await db.emailLabel.deleteMany({
          where: { emailStateId: state.id, labelId: update.labelId },
        });
      }
    }

    const result = await db.emailState.findUniqueOrThrow({
      where: { id: state.id },
      include: { labels: { include: { label: true } } },
    });
    return NextResponse.json({
      folder: result.folder,
      isRead: result.isRead,
      starred: result.starred,
      labels: result.labels.map(({ label }) => label),
    });
  } catch (cause) {
    return NextResponse.json(
      { error: cause instanceof Error ? cause.message : "Unable to update email." },
      { status: 400 },
    );
  }
}
