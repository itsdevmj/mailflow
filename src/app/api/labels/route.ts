import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db";

const labelSchema = z.object({
  name: z.string().trim().min(1).max(30),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#7c6cf2"),
});

export async function GET() {
  try {
    const labels = await getDb().label.findMany({ orderBy: { name: "asc" } });
    return NextResponse.json(labels);
  } catch (cause) {
    return NextResponse.json(
      { error: cause instanceof Error ? cause.message : "Unable to load labels." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const label = labelSchema.parse(await request.json());
    const result = await getDb().label.create({ data: label });
    return NextResponse.json(result, { status: 201 });
  } catch (cause) {
    return NextResponse.json(
      { error: cause instanceof Error ? cause.message : "Unable to create label." },
      { status: 400 },
    );
  }
}
