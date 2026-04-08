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

// Create new note
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

  // Limit: max 5 active notes per user
  const sql = getSQL();
  const count = await sql`SELECT COUNT(*) as cnt FROM sticky_notes WHERE user_id = ${userId} AND (expires_at IS NULL OR expires_at > NOW())`;
  if (parseInt(count[0].cnt) >= 5) {
    return NextResponse.json({ error: 'En fazla 5 aktif not ekleyebilirsiniz' }, { status: 400 });
  }

  if (validExpiry) {
    await sql`INSERT INTO sticky_notes (user_id, content, color, expires_at) VALUES (${userId}, ${safeContent}, ${safeColor}, NOW() + ${validExpiry + ' minutes'}::interval)`;
  } else {
    await sql`INSERT INTO sticky_notes (user_id, content, color) VALUES (${userId}, ${safeContent}, ${safeColor})`;
  }

  return NextResponse.json({ success: true });
}

// Update own note by id
export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { noteId, content, color, expiryMinutes } = await req.json();
  const userId = parseInt(session.user.id);
  const safeColor = ['yellow', 'blue', 'green', 'pink', 'purple', 'orange'].includes(color) ? color : 'yellow';
  const safeContent = String(content || '').slice(0, 500);
  const validExpiry = [15, 30, 60, 120, 240, 480, 1440].includes(expiryMinutes) ? expiryMinutes : null;

  const sql = getSQL();

  if (validExpiry) {
    await sql`UPDATE sticky_notes SET content = ${safeContent}, color = ${safeColor}, expires_at = NOW() + ${validExpiry + ' minutes'}::interval, updated_at = NOW() WHERE id = ${noteId} AND user_id = ${userId}`;
  } else {
    await sql`UPDATE sticky_notes SET content = ${safeContent}, color = ${safeColor}, expires_at = NULL, updated_at = NOW() WHERE id = ${noteId} AND user_id = ${userId}`;
  }

  return NextResponse.json({ success: true });
}

// Delete own note by id
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { noteId } = await req.json();
  const sql = getSQL();
  const userId = parseInt(session.user.id);

  await sql`DELETE FROM sticky_notes WHERE id = ${noteId} AND user_id = ${userId}`;

  return NextResponse.json({ success: true });
}
