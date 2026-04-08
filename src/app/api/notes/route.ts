import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getSQL } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Get all notes (filter out expired)
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sql = getSQL();
  const notes = await sql`
    SELECT sn.id, sn.user_id, sn.content, sn.color, sn.expires_at, sn.updated_at, u.name as user_name
    FROM sticky_notes sn
    JOIN users u ON sn.user_id = u.id
    WHERE sn.expires_at IS NULL OR sn.expires_at > NOW()
    ORDER BY sn.updated_at DESC
  `;

  return NextResponse.json(notes, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Pragma': 'no-cache',
    },
  });
}

// Create or update own note
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { content, color, expiryMinutes } = await req.json();
  const userId = parseInt(session.user.id);
  const safeColor = ['yellow', 'blue', 'green', 'pink', 'purple', 'orange'].includes(color) ? color : 'yellow';
  const safeContent = String(content || '').slice(0, 500);
  const validExpiry = [15, 30, 60, 120, 240, 480, 1440].includes(expiryMinutes) ? expiryMinutes : null;

  const sql = getSQL();

  // Upsert - each user has exactly one note
  const existing = await sql`SELECT id FROM sticky_notes WHERE user_id = ${userId} LIMIT 1`;
  
  if (existing.length > 0) {
    if (validExpiry) {
      await sql`UPDATE sticky_notes SET content = ${safeContent}, color = ${safeColor}, expires_at = NOW() + ${validExpiry + ' minutes'}::interval, updated_at = NOW() WHERE user_id = ${userId}`;
    } else {
      await sql`UPDATE sticky_notes SET content = ${safeContent}, color = ${safeColor}, expires_at = NULL, updated_at = NOW() WHERE user_id = ${userId}`;
    }
  } else {
    if (validExpiry) {
      await sql`INSERT INTO sticky_notes (user_id, content, color, expires_at) VALUES (${userId}, ${safeContent}, ${safeColor}, NOW() + ${validExpiry + ' minutes'}::interval)`;
    } else {
      await sql`INSERT INTO sticky_notes (user_id, content, color) VALUES (${userId}, ${safeContent}, ${safeColor})`;
    }
  }

  return NextResponse.json({ success: true });
}

// Delete own note
export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sql = getSQL();
  const userId = parseInt(session.user.id);

  await sql`DELETE FROM sticky_notes WHERE user_id = ${userId}`;

  return NextResponse.json({ success: true });
}
