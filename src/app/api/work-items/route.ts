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

  const status = searchParams.get('status');
  const assignedTo = searchParams.get('assignedTo');
  const projectCode = searchParams.get('projectCode');
  const category = searchParams.get('category');
  const search = searchParams.get('search');
  const sortBy = searchParams.get('sortBy') || 'updated_at';
  const sortDir = searchParams.get('sortDir') || 'DESC';

  let query = `SELECT * FROM work_items WHERE 1=1`;
  const params: unknown[] = [];
  let paramIdx = 1;

  if (status && status !== 'all') {
    query += ` AND status = $${paramIdx++}`;
    params.push(status);
  }
  if (assignedTo && assignedTo !== 'all') {
    query += ` AND assigned_to = $${paramIdx++}`;
    params.push(assignedTo);
  }
  if (projectCode && projectCode !== 'all') {
    query += ` AND project_code = $${paramIdx++}`;
    params.push(projectCode);
  }
  if (category && category !== 'all') {
    query += ` AND category = $${paramIdx++}`;
    params.push(category);
  }
  if (search) {
    query += ` AND (task_name ILIKE $${paramIdx} OR project_name ILIKE $${paramIdx} OR project_code ILIKE $${paramIdx})`;
    params.push(`%${search}%`);
    paramIdx++;
  }

  // Validate sortBy to prevent SQL injection
  const allowedSorts = ['updated_at', 'created_at', 'status', 'assigned_to', 'project_code', 'priority', 'task_name'];
  const safeSortBy = allowedSorts.includes(sortBy) ? sortBy : 'updated_at';
  const safeSortDir = sortDir === 'ASC' ? 'ASC' : 'DESC';
  query += ` ORDER BY ${safeSortBy} ${safeSortDir}`;

  const items = await sql.apply(null, [query, ...params] as Parameters<typeof sql>);
  return NextResponse.json(items);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sql = getSQL();
  const body = await req.json();
  const { project_code, project_name, task_name, assigned_to, status, priority, category, start_date, target_date, notes } = body;

  if (!project_code || !task_name || !assigned_to) {
    return NextResponse.json({ error: 'Proje kodu, iş adı ve atanan kişi gerekli' }, { status: 400 });
  }

  const result = await sql`INSERT INTO work_items 
    (project_code, project_name, task_name, assigned_to, status, priority, category, start_date, target_date, notes)
    VALUES (${project_code}, ${project_name || ''}, ${task_name}, ${assigned_to}, ${status || 'Başlanmadı'}, ${priority || 'Orta'}, ${category || 'Genel'}, ${start_date || null}, ${target_date || null}, ${notes || null})
    RETURNING *`;

  return NextResponse.json(result[0], { status: 201 });
}
