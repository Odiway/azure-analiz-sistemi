import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getSQL } from '@/lib/db';
import { sendNtfyToUserByEvent } from '@/lib/notify';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Join queue
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

  // Check if user is already in a server
  const inServer = await sql`SELECT id FROM server_sessions WHERE user_id = ${userId} AND ended_at IS NULL LIMIT 1`;
  if (inServer.length > 0) {
    return NextResponse.json({ error: 'Zaten bir sunucudasınız, önce çıkın' }, { status: 409 });
  }

  // Check if already in this queue
  const alreadyInQueue = await sql`SELECT id FROM server_queue WHERE server_name = ${serverName} AND user_id = ${userId} LIMIT 1`;
  if (alreadyInQueue.length > 0) {
    return NextResponse.json({ error: 'Zaten sıradasınız' }, { status: 409 });
  }

  // Get next position
  const maxPos = await sql`SELECT COALESCE(MAX(position), 0) as max_pos FROM server_queue WHERE server_name = ${serverName}`;
  const nextPos = (maxPos[0].max_pos as number) + 1;

  await sql`INSERT INTO server_queue (server_name, user_id, position) VALUES (${serverName}, ${userId}, ${nextPos})`;

  const dn = serverName === 'azure-1' ? 'Azure 1' : 'Azure 2';

  // Notify the user currently in the server that someone is waiting
  const currentUser = await sql`
    SELECT user_id FROM server_sessions 
    WHERE server_name = ${serverName} AND ended_at IS NULL 
    LIMIT 1
  `;
  if (currentUser.length > 0) {
    await sendNtfyToUserByEvent(
      currentUser[0].user_id,
      'queue_waiting',
      `${dn} - Sirada Bekleyen Var`,
      `${session.user.name} ${dn} icin siraya girdi (${nextPos}. sira).`
    );
  }

  return NextResponse.json({ success: true, position: nextPos });
}

// Leave queue
export async function DELETE(req: NextRequest) {
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

  await sql`DELETE FROM server_queue WHERE server_name = ${serverName} AND user_id = ${userId}`;

  // Reorder positions
  await sql`
    WITH ranked AS (
      SELECT id, ROW_NUMBER() OVER (ORDER BY position) as new_pos
      FROM server_queue WHERE server_name = ${serverName}
    )
    UPDATE server_queue SET position = ranked.new_pos
    FROM ranked WHERE server_queue.id = ranked.id
  `;

  const dn = serverName === 'azure-1' ? 'Azure 1' : 'Azure 2';

  return NextResponse.json({ success: true });
}
