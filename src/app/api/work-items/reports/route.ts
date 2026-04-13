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
  const type = searchParams.get('type') || 'summary';

  if (type === 'summary') {
    const [statusDist, personLoad, categoryDist, projectDist, recentLogs, totalHours] = await Promise.all([
      sql`SELECT status, COUNT(*)::int as count FROM work_items GROUP BY status ORDER BY count DESC`,
      sql`SELECT assigned_to, 
        COUNT(*)::int as total,
        COUNT(*) FILTER (WHERE status = 'Devam Ediyor')::int as active,
        COUNT(*) FILTER (WHERE status = 'Tamamlandı')::int as completed,
        COUNT(*) FILTER (WHERE status = 'Başlanmadı')::int as not_started
        FROM work_items WHERE assigned_to NOT IN ('Atanmamış') GROUP BY assigned_to ORDER BY total DESC`,
      sql`SELECT category, COUNT(*)::int as count FROM work_items GROUP BY category ORDER BY count DESC`,
      sql`SELECT project_code, project_name, 
        COUNT(*)::int as total,
        COUNT(*) FILTER (WHERE status = 'Tamamlandı')::int as completed,
        COUNT(*) FILTER (WHERE status = 'Devam Ediyor')::int as active
        FROM work_items GROUP BY project_code, project_name ORDER BY total DESC`,
      sql`SELECT wl.user_name, SUM(wl.hours)::decimal as total_hours, wl.year, wl.week_number
        FROM work_logs wl GROUP BY wl.user_name, wl.year, wl.week_number ORDER BY wl.year DESC, wl.week_number DESC LIMIT 50`,
      sql`SELECT 
        COALESCE(SUM(hours), 0)::decimal as total,
        COUNT(DISTINCT work_item_id)::int as items_with_logs
        FROM work_logs`,
    ]);

    return NextResponse.json({
      statusDistribution: statusDist,
      personWorkload: personLoad,
      categoryDistribution: categoryDist,
      projectDistribution: projectDist,
      recentLogs: recentLogs,
      totalHours: totalHours[0],
    });
  }

  if (type === 'person') {
    const person = searchParams.get('person');
    const items = person && person !== 'all'
      ? await sql`SELECT * FROM work_items WHERE assigned_to = ${person} ORDER BY status, updated_at DESC`
      : await sql`SELECT * FROM work_items ORDER BY assigned_to, status, updated_at DESC`;
    
    const logs = person && person !== 'all'
      ? await sql`SELECT wl.*, wi.task_name, wi.project_code FROM work_logs wl JOIN work_items wi ON wl.work_item_id = wi.id WHERE wl.user_name = ${person} ORDER BY wl.log_date DESC`
      : await sql`SELECT wl.*, wi.task_name, wi.project_code FROM work_logs wl JOIN work_items wi ON wl.work_item_id = wi.id ORDER BY wl.log_date DESC`;

    return NextResponse.json({ items, logs });
  }

  if (type === 'weekly') {
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
    const week = searchParams.get('week') ? parseInt(searchParams.get('week')!) : null;

    const logs = week
      ? await sql`SELECT wl.user_name, SUM(wl.hours)::decimal as total_hours, wl.week_number, wl.year,
          array_agg(DISTINCT wi.task_name) as tasks
          FROM work_logs wl JOIN work_items wi ON wl.work_item_id = wi.id
          WHERE wl.year = ${year} AND wl.week_number = ${week}
          GROUP BY wl.user_name, wl.week_number, wl.year ORDER BY total_hours DESC`
      : await sql`SELECT wl.user_name, SUM(wl.hours)::decimal as total_hours, wl.week_number, wl.year
          FROM work_logs wl WHERE wl.year = ${year}
          GROUP BY wl.user_name, wl.week_number, wl.year ORDER BY wl.week_number, wl.user_name`;

    return NextResponse.json({ logs, year });
  }

  if (type === 'filters') {
    const [people, projects, categories, statuses] = await Promise.all([
      sql`SELECT DISTINCT assigned_to FROM work_items ORDER BY assigned_to`,
      sql`SELECT DISTINCT project_code, project_name FROM work_items ORDER BY project_code`,
      sql`SELECT DISTINCT category FROM work_items WHERE category IS NOT NULL ORDER BY category`,
      sql`SELECT DISTINCT status FROM work_items ORDER BY status`,
    ]);
    return NextResponse.json({
      people: people.map((p: any) => p.assigned_to),
      projects: projects,
      categories: categories.map((c: any) => c.category),
      statuses: statuses.map((s: any) => s.status),
    });
  }

  return NextResponse.json({ error: 'Geçersiz rapor tipi' }, { status: 400 });
}
