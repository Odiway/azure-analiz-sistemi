import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getSQL } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sql = getSQL();
  const { searchParams } = new URL(req.url);
  const workItemId = searchParams.get('workItemId');
  const userName = searchParams.get('userName');
  const year = searchParams.get('year');
  const weekNumber = searchParams.get('weekNumber');

  let query = `SELECT wl.*, wi.task_name, wi.project_code, wi.project_name 
    FROM work_logs wl JOIN work_items wi ON wl.work_item_id = wi.id WHERE 1=1`;
  const params: unknown[] = [];
  let paramIdx = 1;

  if (workItemId) {
    query += ` AND wl.work_item_id = $${paramIdx++}`;
    params.push(parseInt(workItemId));
  }
  if (userName && userName !== 'all') {
    query += ` AND wl.user_name = $${paramIdx++}`;
    params.push(userName);
  }
  if (year) {
    query += ` AND wl.year = $${paramIdx++}`;
    params.push(parseInt(year));
  }
  if (weekNumber) {
    query += ` AND wl.week_number = $${paramIdx++}`;
    params.push(parseInt(weekNumber));
  }

  query += ` ORDER BY wl.log_date DESC`;
  const logs = await sql(query, params);
  return NextResponse.json(logs);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sql = getSQL();
  const body = await req.json();
  const { work_item_id, user_name, hours, log_date, description } = body;

  if (!work_item_id || !user_name || !hours) {
    return NextResponse.json({ error: 'İş kalemi, kişi ve saat gerekli' }, { status: 400 });
  }

  const date = log_date ? new Date(log_date) : new Date();
  // Calculate ISO week number
  const d = new Date(date.getTime());
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  const weekNumber = 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);

  const result = await sql`INSERT INTO work_logs 
    (work_item_id, user_name, hours, log_date, week_number, year, description)
    VALUES (${work_item_id}, ${user_name}, ${hours}, ${date.toISOString().split('T')[0]}, ${weekNumber}, ${date.getFullYear()}, ${description || null})
    RETURNING *`;

  return NextResponse.json(result[0], { status: 201 });
}
