import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getSQL } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { serverName } = await req.json();
  if (serverName !== 'azure-1' && serverName !== 'azure-2') {
    return NextResponse.json({ error: 'Geçersiz sunucu' }, { status: 400 });
  }

  const sql = getSQL();
  const userId = parseInt(session.user.id);

  const activeSession = await sql`SELECT id FROM server_sessions WHERE server_name = ${serverName} AND user_id = ${userId} AND ended_at IS NULL LIMIT 1`;

  if (activeSession.length === 0) {
    return NextResponse.json({ error: 'Aktif oturum bulunamadı' }, { status: 404 });
  }

  await sql`UPDATE server_sessions SET ended_at = NOW() WHERE id = ${activeSession[0].id}`;

  return NextResponse.json({ success: true });
}
