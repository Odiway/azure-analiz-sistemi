import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getSQL } from '@/lib/db';

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

  const users = await sql`SELECT ntfy_topic FROM users WHERE id = ${userId} LIMIT 1`;
  
  return NextResponse.json({
    ntfyTopic: users[0]?.ntfy_topic || '',
  });
}

// Update user settings
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { ntfyTopic } = await req.json();
  const sql = getSQL();
  const userId = parseInt(session.user.id);

  // Sanitize topic - only allow alphanumeric, hyphens, underscores
  const safeTopic = String(ntfyTopic || '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 100);

  await sql`UPDATE users SET ntfy_topic = ${safeTopic || null} WHERE id = ${userId}`;

  return NextResponse.json({ success: true, ntfyTopic: safeTopic });
}
