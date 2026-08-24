import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    await getDb().label.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (cause) {
    return NextResponse.json(
      { error: cause instanceof Error ? cause.message : "Unable to delete label." },
      { status: 400 },
    );
  }
}
