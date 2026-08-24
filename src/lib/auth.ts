import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "mailflow_session";

function sessionSecret() {
  const value = process.env.AUTH_SECRET;
  if (!value) throw new Error("AUTH_SECRET is not configured.");
  return new TextEncoder().encode(value);
}

export async function createSessionToken(email: string) {
  return new SignJWT({ email })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(sessionSecret());
}

export async function verifySessionToken(token?: string) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, sessionSecret());
    return typeof payload.email === "string" ? payload.email : null;
  } catch {
    return null;
  }
}
