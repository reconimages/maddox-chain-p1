import { NextResponse } from "next/server";
import { expectedAdminToken } from "@/lib/admin";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const password = body?.password;
  if (password !== process.env.ADMIN_PASSWORD) {
    await new Promise((r) => setTimeout(r, 500));
    return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
  }
  const token = expectedAdminToken();
  const res = NextResponse.json({ ok: true });
  res.cookies.set("admin_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  return res;
}
