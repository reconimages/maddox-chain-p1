import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";

export function expectedAdminToken(): string {
  return createHmac("sha256", process.env.ADMIN_TOKEN_SECRET!)
    .update(process.env.ADMIN_PASSWORD!)
    .digest("hex");
}

export async function isAdminRequest(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  if (!token) return false;
  const expected = expectedAdminToken();
  if (token.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(token), Buffer.from(expected));
}
