export function trackPlay(trackId: string): void {
  if (typeof window === 'undefined') return;
  fetch('/api/events/play', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ trackId }),
    keepalive: true,
  }).catch(() => {
    // Swallow errors silently
  });
}