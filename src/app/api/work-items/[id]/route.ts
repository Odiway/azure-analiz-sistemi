import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getSQL } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sql = getSQL();
  const id = parseInt(params.id);
  if (isNaN(id)) return NextResponse.json({ error: 'Geçersiz ID' }, { status: 400 });

  const body = await req.json();
  const { project_code, project_name, task_name, assigned_to, status, priority, category, start_date, target_date, completed_date, notes } = body;

  const completedVal = status === 'Tamamlandı' ? (completed_date || new Date().toISOString().split('T')[0]) : null;

  const result = await sql`UPDATE work_items SET
    project_code = COALESCE(${project_code}, project_code),
    project_name = COALESCE(${project_name}, project_name),
    task_name = COALESCE(${task_name}, task_name),
    assigned_to = COALESCE(${assigned_to}, assigned_to),
    status = COALESCE(${status}, status),
    priority = COALESCE(${priority}, priority),
    category = COALESCE(${category}, category),
    start_date = ${start_date !== undefined ? start_date : null},
    target_date = ${target_date !== undefined ? target_date : null},
    completed_date = ${completedVal},
    notes = ${notes !== undefined ? notes : null},
    updated_at = NOW()
    WHERE id = ${id}
    RETURNING *`;

  if (result.length === 0) return NextResponse.json({ error: 'İş kalemi bulunamadı' }, { status: 404 });
  return NextResponse.json(result[0]);
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sql = getSQL();
  const id = parseInt(params.id);
  if (isNaN(id)) return NextResponse.json({ error: 'Geçersiz ID' }, { status: 400 });

  await sql`DELETE FROM work_items WHERE id = ${id}`;
  return NextResponse.json({ ok: true });
}
