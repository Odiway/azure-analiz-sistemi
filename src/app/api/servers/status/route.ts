import { NextResponse } from 'next/server';
import { getSQL } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const sql = getSQL();

  // Active sessions
  const sessions = await sql`
    SELECT ss.server_name, u.name as user_name, ss.user_id, ss.started_at, ss.estimated_minutes
    FROM server_sessions ss
    JOIN users u ON ss.user_id = u.id
    WHERE ss.ended_at IS NULL
  `;

  // Queue
  const queue = await sql`
    SELECT sq.server_name, sq.user_id, sq.position, u.name as user_name
    FROM server_queue sq
    JOIN users u ON sq.user_id = u.id
    ORDER BY sq.server_name, sq.position ASC
  `;

  const status: Record<string, any> = {
    'azure-1': { session: null, queue: [] },
    'azure-2': { session: null, queue: [] },
  };

  for (const row of sessions) {
    const name = row.server_name as string;
    if (name === 'azure-1' || name === 'azure-2') {
      const raw = String(row.started_at);
      const startedAt = raw.includes('Z') || raw.includes('+') ? raw : raw + 'Z';
      status[name].session = {
        userName: row.user_name,
        userId: row.user_id,
        startedAt: new Date(startedAt).toISOString(),
        estimatedMinutes: row.estimated_minutes,
      };
    }
  }

  for (const row of queue) {
    const name = row.server_name as string;
    if (name === 'azure-1' || name === 'azure-2') {
      status[name].queue.push({
        userId: row.user_id,
        userName: row.user_name,
        position: row.position,
      });
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
