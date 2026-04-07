import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getSQL } from '@/lib/db';
import { ALL_EVENTS } from '@/lib/notify';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Get current user settings
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sql = getSQL();
  const userId = parseInt(session.user.id);

  const users = await sql`SELECT ntfy_topic, ntfy_prefs FROM users WHERE id = ${userId} LIMIT 1`;
  
  let prefs: Record<string, boolean> = {};
  try {
    prefs = JSON.parse(users[0]?.ntfy_prefs || '{}');
  } catch {}

  return NextResponse.json({
    ntfyTopic: users[0]?.ntfy_topic || '',
    ntfyPrefs: prefs,
    allEvents: ALL_EVENTS,
  });
}

// Update user settings
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { ntfyTopic, ntfyPrefs } = await req.json();
  const sql = getSQL();
  const userId = parseInt(session.user.id);

  // Sanitize topic
  const safeTopic = String(ntfyTopic || '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 100);

  // Sanitize prefs - only allow known event keys
  const validKeys = ALL_EVENTS.map(e => e.key);
  const safePrefs: Record<string, boolean> = {};
  if (ntfyPrefs && typeof ntfyPrefs === 'object') {
    for (const key of validKeys) {
      if (ntfyPrefs[key] === true) safePrefs[key] = true;
    }
  }

  await sql`UPDATE users SET ntfy_topic = ${safeTopic || null}, ntfy_prefs = ${JSON.stringify(safePrefs)} WHERE id = ${userId}`;

  return NextResponse.json({ success: true, ntfyTopic: safeTopic, ntfyPrefs: safePrefs });
}
