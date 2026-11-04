import { createAdminClient } from '../lib/supabase/admin';
import bcrypt from 'bcryptjs';

async function main() {
  const force = process.argv.includes('--force');
  const plain = process.env.ADMIN_PASSWORD;
  if (!plain) {
    console.error('ADMIN_PASSWORD not set');
    process.exit(1);
  }
  const supabase = createAdminClient();
  const { data } = await supabase.from('admin_settings').select('password_hash').eq('id', 1).maybeSingle();

  if (data?.password_hash && !force) {
    const matches = await bcrypt.compare(plain, data.password_hash);
    if (matches) {
      console.log('admin hash already matches env; leaving as-is.');
      return;
    }
    console.log('admin hash already rotated; leaving as-is.');
    return;
  }

  const hash = await bcrypt.hash(plain, 12);
  await supabase.from('admin_settings').upsert({ id: 1, password_hash: hash, updated_at: new Date().toISOString() });
  console.log('admin hash bootstrapped');
}

main().catch((e) => { console.error(e); process.exit(1); });