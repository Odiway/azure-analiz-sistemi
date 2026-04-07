import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getSQL } from '@/lib/db';
import { sendNtfyToAllWithTopic } from '@/lib/notify';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { serverName, estimatedMinutes } = await req.json();
  if (serverName !== 'azure-1' && serverName !== 'azure-2') {
    return NextResponse.json({ error: 'Geçersiz sunucu' }, { status: 400 });
  }

  const minutes = Math.max(parseInt(estimatedMinutes) || 60, 1);

  const sql = getSQL();
  const userId = parseInt(session.user.id);

  // Check if server is already occupied
  const existing = await sql`SELECT id FROM server_sessions WHERE server_name = ${serverName} AND ended_at IS NULL LIMIT 1`;
  if (existing.length > 0) {
    return NextResponse.json({ error: 'Sunucu şu anda kullanımda' }, { status: 409 });
  }

  // Check if user is already in another server
  const userSession = await sql`SELECT id FROM server_sessions WHERE user_id = ${userId} AND ended_at IS NULL LIMIT 1`;
  if (userSession.length > 0) {
    return NextResponse.json({ error: 'Zaten başka bir sunucudasınız' }, { status: 409 });
  }

  // Remove from queue if they were waiting
  await sql`DELETE FROM server_queue WHERE server_name = ${serverName} AND user_id = ${userId}`;
  // Reorder remaining queue positions
  await sql`
    WITH ranked AS (
      SELECT id, ROW_NUMBER() OVER (ORDER BY position) as new_pos
      FROM server_queue WHERE server_name = ${serverName}
    )
    UPDATE server_queue SET position = ranked.new_pos
    FROM ranked WHERE server_queue.id = ranked.id
  `;

  await sql`INSERT INTO server_sessions (server_name, user_id, estimated_minutes) VALUES (${serverName}, ${userId}, ${minutes})`;

  const dn = serverName === 'azure-1' ? 'Azure 1' : 'Azure 2';
  // Notify everyone: someone entered the server
  let ntfyResult = 'not_sent';
  try {
    await sendNtfyToAllWithTopic(
      `${dn} - Giri\u015f Yap\u0131ld\u0131`,
      `${session.user.name} ${dn}'e giri\u015f yapt\u0131. Tahmini s\u00fcre: ${minutes >= 60 ? Math.floor(minutes/60) + ' saat' : minutes + ' dakika'}.`
    );
    ntfyResult = 'sent_ok';
  } catch (e: any) {
    ntfyResult = 'error: ' + e.message;
  }

  return NextResponse.json({ success: true, ntfy: ntfyResult });
}
