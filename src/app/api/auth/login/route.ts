import { compare } from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createSessionToken, SESSION_COOKIE } from "@/lib/auth";

const credentialsSchema = z.object({
  email: z.email(),
  password: z.string().min(1).max(256),
});

export async function POST(request: Request) {
  const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase();
  const passwordHash = process.env.ADMIN_PASSWORD_HASH;
  if (!adminEmail || !passwordHash || !process.env.AUTH_SECRET) {
    return NextResponse.json(
      { error: "Mailbox authentication is not configured." },
      { status: 503 },
    );
  }

  const parsed = credentialsSchema.safeParse(await request.json());
  if (
    !parsed.success ||
    parsed.data.email.toLowerCase() !== adminEmail ||
    !(await compare(parsed.data.password, passwordHash))
  ) {
    return NextResponse.json(
      { error: "Invalid email or password." },
      { status: 401 },
    );
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, await createSessionToken(adminEmail), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return response;
}
