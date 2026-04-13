import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getSQL } from '@/lib/db';
import * as XLSX from 'xlsx';
import { readFileSync } from 'fs';
import { join } from 'path';

export const dynamic = 'force-dynamic';

const EXCEL_FILE = join(process.cwd(), 'Analiz_İş_Gücü_Planı_X+3_170226.xlsx');

interface WorkforceTask {
  rowIndex: number;
  number: string;
  name: string;
  type: string;
  ekip: string;
  sorumlu: string;
  caeResp: string;
  project: string;
  status: string;
  phase3: string;
  cadReady: string;
  weeks: Record<number, number>;
}

interface PersonSummary {
  name: string;
  tasks: number;
  projects: string[];
  totalWeekAllocations: number;
  weeklyLoad: Record<number, number>;
}

function parseExcelBase(): WorkforceTask[] {
  const fileBuffer = readFileSync(EXCEL_FILE);
  const wb = XLSX.read(fileBuffer, { type: 'buffer' });
  const ws = wb.Sheets['Project Plan and Timing'];
  if (!ws) throw new Error('Sheet not found');

  const data: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
  const tasks: WorkforceTask[] = [];

  for (let i = 9; i < data.length; i++) {
    const r = data[i];
    const name = String(r[3] || '').trim();
    const cae = String(r[11] || '').trim();
    const prj = String(r[10] || '').trim();

    if (!name || !cae || ['', '-', 'ALL', 'Report', 'Team'].includes(cae)) continue;

    const weeks: Record<number, number> = {};
    for (let w = 13; w <= 64; w++) {
      const v = r[w];
      if (v && String(v).trim() !== '' && String(v).trim() !== ' ') {
        weeks[w - 12] = parseFloat(String(v)) || 1;
      }
    }

    tasks.push({
      rowIndex: i,
      number: String(r[1] || '').trim(),
      name,
      type: String(r[4] || '').trim(),
      ekip: String(r[5] || '').trim(),
      sorumlu: String(r[6] || '').trim(),
      caeResp: cae,
      project: prj,
      status: String(r[7] || '').trim(),
      phase3: String(r[8] || '').trim(),
      cadReady: String(r[12] || '').trim(),
      weeks,
    });
  }

  return tasks;
}

async function applyOverrides(tasks: WorkforceTask[]): Promise<WorkforceTask[]> {
  const sql = getSQL();
  const rows = await sql('SELECT row_index, week, value FROM workforce_overrides');
  const overrides = rows as { row_index: number; week: number; value: number }[];

  if (overrides.length === 0) return tasks;

  // Build a map: rowIndex -> { week -> value }
  const overrideMap: Record<number, Record<number, number>> = {};
  for (const o of overrides) {
    if (!overrideMap[o.row_index]) overrideMap[o.row_index] = {};
    overrideMap[o.row_index][o.week] = o.value;
  }

  return tasks.map(task => {
    const rowOverrides = overrideMap[task.rowIndex];
    if (!rowOverrides) return task;

    const newWeeks = { ...task.weeks };
    for (const [wk, val] of Object.entries(rowOverrides)) {
      const w = parseInt(wk);
      if (val > 0) {
        newWeeks[w] = val;
      } else {
        delete newWeeks[w];
      }
    }
    return { ...task, weeks: newWeeks };
  });
}

function buildSummary(tasks: WorkforceTask[]): { people: PersonSummary[]; projects: string[] } {
  const personMap: Record<string, { tasks: number; projects: Set<string>; totalWeeks: number; weeklyLoad: Record<number, number> }> = {};
  const projectSet = new Set<string>();

  for (const task of tasks) {
    const p = task.caeResp;
    if (!personMap[p]) {
      personMap[p] = { tasks: 0, projects: new Set(), totalWeeks: 0, weeklyLoad: {} };
    }
    personMap[p].tasks++;
    personMap[p].projects.add(task.project);
    personMap[p].totalWeeks += Object.keys(task.weeks).length;

    for (const [wk, val] of Object.entries(task.weeks)) {
      const weekNum = parseInt(wk);
      personMap[p].weeklyLoad[weekNum] = (personMap[p].weeklyLoad[weekNum] || 0) + val;
    }

    if (task.project) projectSet.add(task.project);
  }

  const people: PersonSummary[] = Object.entries(personMap)
    .map(([name, d]) => ({
      name,
      tasks: d.tasks,
      projects: Array.from(d.projects),
      totalWeekAllocations: d.totalWeeks,
      weeklyLoad: d.weeklyLoad,
    }))
    .sort((a, b) => b.tasks - a.tasks);

  return { people, projects: Array.from(projectSet) };
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const baseTasks = parseExcelBase();
    const tasks = await applyOverrides(baseTasks);
    const { people, projects } = buildSummary(tasks);
    return NextResponse.json({ tasks, people, projects });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Excel parse error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const updates: { rowIndex: number; week: number; value: number }[] = body.updates;

    if (!Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json({ error: 'No updates provided' }, { status: 400 });
    }

    for (const u of updates) {
      if (typeof u.rowIndex !== 'number' || u.rowIndex < 9) {
        return NextResponse.json({ error: 'Invalid rowIndex' }, { status: 400 });
      }
      if (typeof u.week !== 'number' || u.week < 1 || u.week > 52) {
        return NextResponse.json({ error: 'Invalid week' }, { status: 400 });
      }
      if (typeof u.value !== 'number' || u.value < 0) {
        return NextResponse.json({ error: 'Invalid value' }, { status: 400 });
      }
    }

    const sql = getSQL();

    // Upsert all overrides
    for (const { rowIndex, week, value } of updates) {
      if (value > 0) {
        await sql(
          `INSERT INTO workforce_overrides (row_index, week, value, updated_at)
           VALUES ($1, $2, $3, NOW())
           ON CONFLICT (row_index, week) DO UPDATE SET value = $3, updated_at = NOW()`,
          [rowIndex, week, value]
        );
      } else {
        await sql(
          'DELETE FROM workforce_overrides WHERE row_index = $1 AND week = $2',
          [rowIndex, week]
        );
      }
    }

    // Return fresh data
    const baseTasks = parseExcelBase();
    const tasks = await applyOverrides(baseTasks);
    const { people, projects } = buildSummary(tasks);
    return NextResponse.json({ tasks, people, projects });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Update error' }, { status: 500 });
  }
}
