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

  const res = await fetch(`${supabaseUrl}/rest/v1/albums?id=eq.${id}&select=title,release_year,cover_path`, {
    headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
  });
  const data = await res.json();
  const album = Array.isArray(data) ? data[0] : null;
  if (!album) return new NextResponse('Not found', { status: 404 });

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || '';
  const coverUrl = `${siteUrl}/api/covers/${id}`;

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
          <h1 style={{ fontSize: 48, fontWeight: 700, marginTop: 16, lineHeight: 1.1 }}>{album.title}</h1>
          <p style={{ fontSize: 24, color: '#a1a1aa', marginTop: 12 }}>{album.release_year}</p>
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