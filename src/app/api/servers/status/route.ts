import { NextResponse } from 'next/server';
import { getSQL } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const sql = getSQL();

  const rows = await sql`
    SELECT ss.server_name, u.name as user_name, ss.user_id, ss.started_at
    FROM server_sessions ss
    JOIN users u ON ss.user_id = u.id
    WHERE ss.ended_at IS NULL
  `;

  const status: Record<string, { userName: string; userId: number; startedAt: string } | null> = {
    'azure-1': null,
    'azure-2': null,
  };

  for (const row of rows) {
    const name = row.server_name as string;
    if (name === 'azure-1' || name === 'azure-2') {
      // Ensure UTC interpretation
      const raw = String(row.started_at);
      const startedAt = raw.includes('Z') || raw.includes('+') ? raw : raw + 'Z';
      status[name] = {
        userName: row.user_name,
        userId: row.user_id,
        startedAt: new Date(startedAt).toISOString(),
      };
    }
  }

  return NextResponse.json(status, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  });
}
