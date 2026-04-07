import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getSQL } from '@/lib/db';
import { sendNtfyByEvent } from '@/lib/notify';
import type { NtfyEvent } from '@/lib/notify';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Complete an analysis
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
  const dn = serverName === 'azure-1' ? 'Azure 1' : 'Azure 2';

  const active = await sql`
    SELECT id FROM server_analyses 
    WHERE server_name = ${serverName} AND user_id = ${userId} AND completed_at IS NULL 
    LIMIT 1
  `;

  if (active.length === 0) {
    return NextResponse.json({ error: 'Aktif analiz bulunamadı' }, { status: 404 });
  }

  await sql`UPDATE server_analyses SET completed_at = NOW() WHERE id = ${active[0].id}`;

  const analysisEvent: NtfyEvent = serverName === 'azure-1' ? 'azure-1_analysis' : 'azure-2_analysis';
  await sendNtfyByEvent(
    analysisEvent,
    `${dn} Tamamen Musait!`,
    `${session.user.name} analizi tamamladi. ${dn} artik tamamen bos, giris yapabilirsiniz!`
  );

  return NextResponse.json({ success: true });
}
