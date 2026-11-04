import { ImageResponse } from 'next/og';
import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const res = await fetch(`${supabaseUrl}/rest/v1/tracks?id=eq.${id}&select=title,album_id,is_vault`, {
    headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
  });
  const data = await res.json();
  const track = Array.isArray(data) ? data[0] : null;
  if (!track) return new NextResponse('Not found', { status: 404 });

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || '';

  // Vault track: generic card, no title leak
  if (track.is_vault) {
    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#0a0a0a',
            color: '#fff',
            fontFamily: 'sans-serif',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <p style={{ color: '#f59e0b', fontSize: 24, fontWeight: 700, letterSpacing: 4, textTransform: 'uppercase' }}>MADDOX CHAIN</p>
            <p style={{ fontSize: 48, fontWeight: 700 }}>VIP VAULT</p>
            <p style={{ fontSize: 20, color: '#71717a' }}>Listen on maddoxchain.fans</p>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        headers: { 'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400' },
      }
    );
  }

  // Fetch album title
  let albumTitle = '';
  if (track.album_id) {
    const aRes = await fetch(`${supabaseUrl}/rest/v1/albums?id=eq.${track.album_id}&select=title`, {
      headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
    });
    const aData = await aRes.json();
    albumTitle = Array.isArray(aData) && aData[0] ? aData[0].title : '';
  }

  const coverUrl = `${siteUrl}/api/covers/${track.album_id}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          background: '#0a0a0a',
          color: '#fff',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ width: '40%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#18181b' }}>
          <img src={coverUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '48px' }}>
          <p style={{ color: '#f59e0b', fontSize: 20, fontWeight: 700, letterSpacing: 4, textTransform: 'uppercase' }}>MADDOX CHAIN</p>
          <h1 style={{ fontSize: 40, fontWeight: 700, marginTop: 16, lineHeight: 1.1 }}>{track.title}</h1>
          <p style={{ fontSize: 24, color: '#a1a1aa', marginTop: 12 }}>on {albumTitle}</p>
          <p style={{ fontSize: 18, color: '#71717a', marginTop: 32 }}>Listen on maddoxchain.fans</p>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: { 'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400' },
    }
  );
}