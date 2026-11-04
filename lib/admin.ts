import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";
import bcrypt from "bcryptjs";
import { createAdminClient } from "@/lib/supabase/admin";

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

export async function verifyAdminPassword(plain: string): Promise<boolean> {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("admin_settings")
      .select("password_hash")
      .eq("id", 1)
      .maybeSingle();
    if (data?.password_hash) {
      return await bcrypt.compare(plain, data.password_hash);
    }
  } catch {
    // fall through to env comparison
  }
  return plain === process.env.ADMIN_PASSWORD;
}

export async function setAdminPassword(plain: string): Promise<void> {
  const hash = await bcrypt.hash(plain, 12);
  const supabase = createAdminClient();
  await supabase
    .from("admin_settings")
    .upsert({ id: 1, password_hash: hash, updated_at: new Date().toISOString() });
}
