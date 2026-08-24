import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db";

const draftSchema = z.object({
  to: z.string().max(500).default(""),
  subject: z.string().max(500).default(""),
  message: z.string().max(100_000).default(""),
  replyToId: z.string().optional(),
});

export async function GET() {
  try {
    const drafts = await getDb().draft.findMany({ orderBy: { updatedAt: "desc" } });
    return NextResponse.json(drafts);
  } catch (cause) {
    return NextResponse.json(
      { error: cause instanceof Error ? cause.message : "Unable to load drafts." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const draft = draftSchema.parse(await request.json());
    const result = await getDb().draft.create({ data: draft });
    return NextResponse.json(result, { status: 201 });
  } catch (cause) {
    return NextResponse.json(
      { error: cause instanceof Error ? cause.message : "Unable to save draft." },
      { status: 400 },
    );
  }
}
