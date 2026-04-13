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
  const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());

  // Get all work items
  const items = await sql`SELECT * FROM work_items ORDER BY assigned_to, project_code, task_name`;

  // Get aggregated logs for the year
  const logs = await sql`
    SELECT work_item_id, week_number, SUM(hours)::float as hours
    FROM work_logs WHERE year = ${year}
    GROUP BY work_item_id, week_number
  `;

  // Build logs map: { "itemId_weekNum": hours }
  const logsMap: Record<string, number> = {};
  for (const log of logs) {
    logsMap[`${log.work_item_id}_${log.week_number}`] = log.hours;
  }

  // Extract distinct people and projects for filters
  const peopleSet = new Set<string>();
  const projectsMap = new Map<string, { project_code: string; project_name: string }>();

  for (const item of items) {
    const person = item.assigned_to as string;
    if (person && person !== 'Atanmamış') peopleSet.add(person);
    const pc = item.project_code as string;
    if (pc && !projectsMap.has(pc)) {
      projectsMap.set(pc, { project_code: pc, project_name: item.project_name as string });
    }
  }

  return NextResponse.json({
    items,
    logs: logsMap,
    people: Array.from(peopleSet).sort(),
    projects: Array.from(projectsMap.values()),
  });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sql = getSQL();
  const body = await req.json();
  const { work_item_id, week_number, year, hours } = body;

  if (!work_item_id || !week_number || !year) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  }

  // Get user_name from work item
  const item = await sql`SELECT assigned_to FROM work_items WHERE id = ${work_item_id}`;
  if (!item.length) return NextResponse.json({ error: 'Item not found' }, { status: 404 });
  const user_name = item[0].assigned_to;

  // Compute Monday of the ISO week
  const jan4 = new Date(year, 0, 4);
  const dow = jan4.getDay() || 7;
  const w1Mon = new Date(year, 0, 4 - dow + 1);
  const monday = new Date(w1Mon);
  monday.setDate(w1Mon.getDate() + (week_number - 1) * 7);
  const log_date = monday.toISOString().split('T')[0];

  const numHours = parseFloat(hours) || 0;

  // Delete all existing entries for this cell
  await sql`DELETE FROM work_logs WHERE work_item_id = ${work_item_id} AND week_number = ${week_number} AND year = ${year}`;

  // Insert if hours > 0
  if (numHours > 0) {
    await sql`INSERT INTO work_logs (work_item_id, user_name, hours, log_date, week_number, year, description)
      VALUES (${work_item_id}, ${user_name}, ${numHours}, ${log_date}, ${week_number}, ${year}, ${'Web entry'})`;
  }

  return NextResponse.json({ ok: true });
}
