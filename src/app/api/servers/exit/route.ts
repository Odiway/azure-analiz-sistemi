import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getSQL } from '@/lib/db';
import { sendNtfyByEvent } from '@/lib/notify';
import type { NtfyEvent } from '@/lib/notify';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { serverName, hasAnalysis, analysisMinutes } = await req.json();
  if (serverName !== 'azure-1' && serverName !== 'azure-2') {
    return NextResponse.json({ error: 'Geçersiz sunucu' }, { status: 400 });
  }

  const sql = getSQL();
  const userId = parseInt(session.user.id);
  const dn = serverName === 'azure-1' ? 'Azure 1' : 'Azure 2';

  const activeSession = await sql`SELECT id FROM server_sessions WHERE server_name = ${serverName} AND user_id = ${userId} AND ended_at IS NULL LIMIT 1`;

  if (activeSession.length === 0) {
    return NextResponse.json({ error: 'Aktif oturum bulunamadı' }, { status: 404 });
  }

  await sql`UPDATE server_sessions SET ended_at = NOW() WHERE id = ${activeSession[0].id}`;

  const exitEvent: NtfyEvent = serverName === 'azure-1' ? 'azure-1_exit' : 'azure-2_exit';
  let ntfyResult = 'not_sent';
  if (hasAnalysis && analysisMinutes) {
    const minutes = Math.max(parseInt(analysisMinutes) || 60, 1);
    await sql`INSERT INTO server_analyses (server_name, user_id, estimated_minutes) VALUES (${serverName}, ${userId}, ${minutes})`;
    ntfyResult = await sendNtfyByEvent(
      exitEvent,
      `${dn} - Cikis (Analiz Var)`,
      `${session.user.name} ${dn} sunucusundan cikti ama analiz devam ediyor (~${minutes >= 60 ? Math.floor(minutes/60) + ' sa' : minutes + ' dk'}).`
    );
  } else {
    ntfyResult = await sendNtfyByEvent(
      exitEvent,
      `${dn} Musait!`,
      `${session.user.name} ${dn} sunucusundan cikti. Sunucu artik tamamen bos, giris yapabilirsiniz!`
    );
  }

  return NextResponse.json({ success: true, ntfy: ntfyResult });
}
