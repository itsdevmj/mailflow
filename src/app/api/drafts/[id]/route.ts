import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db";

const updateSchema = z.object({
  to: z.string().max(500),
  subject: z.string().max(500),
  message: z.string().max(100_000),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const data = updateSchema.parse(await request.json());
    const draft = await getDb().draft.update({ where: { id }, data });
    return NextResponse.json(draft);
  } catch (cause) {
    return NextResponse.json(
      { error: cause instanceof Error ? cause.message : "Unable to update draft." },
      { status: 400 },
    );
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    await getDb().draft.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (cause) {
    return NextResponse.json(
      { error: cause instanceof Error ? cause.message : "Unable to delete draft." },
      { status: 400 },
    );
  }
}
