import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getSQL } from '@/lib/db';
import * as XLSX from 'xlsx';

export const dynamic = 'force-dynamic';

interface ParsedRow {
  project_code: string;
  project_name: string;
  task_name: string;
  assigned_to: string;
  status: string;
  weeklyHours: Record<number, number>; // week_number -> hours
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const yearStr = formData.get('year') as string;
    const year = parseInt(yearStr) || new Date().getFullYear();

    if (!file) {
      return NextResponse.json({ error: 'Dosya bulunamadı' }, { status: 400 });
    }

    // Read file buffer
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });

    // Read first sheet
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      return NextResponse.json({ error: 'Excel dosyasında sayfa bulunamadı' }, { status: 400 });
    }

    const sheet = workbook.Sheets[sheetName];
    const rawData: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

    if (rawData.length < 2) {
      return NextResponse.json({ error: 'Excel dosyası boş veya geçersiz format' }, { status: 400 });
    }

    // Parse header row to find week columns
    const headerRow = rawData[0];
    const weekColumns: Record<number, number> = {}; // columnIndex -> weekNumber

    for (let col = 0; col < headerRow.length; col++) {
      const cellStr = String(headerRow[col] || '').trim();
      const weekMatch = cellStr.match(/^W(\d+)$/i);
      if (weekMatch) {
        weekColumns[col] = parseInt(weekMatch[1]);
      }
    }

    // Detect column positions by header names
    const headerLower = headerRow.map((h: any) => String(h || '').toLowerCase().trim());
    
    const projectCodeCol = headerLower.findIndex((h: string) => h.includes('proje kodu') || h === 'proje');
    const projectNameCol = headerLower.findIndex((h: string) => h.includes('proje') && h.includes('adı') || h.includes('projenin'));
    const taskNameCol = headerLower.findIndex((h: string) => h.includes('çalışma') || h.includes('iş adı') || h.includes('task'));
    const assignedToCol = headerLower.findIndex((h: string) => h.includes('kişi') || h.includes('çalışan') || h.includes('assigned'));
    const statusCol = headerLower.findIndex((h: string) => h.includes('durum') || h.includes('status'));

    // Fallback to positional if headers not detected
    const cols = {
      project_code: projectCodeCol >= 0 ? projectCodeCol : 0,
      project_name: projectNameCol >= 0 ? projectNameCol : 1,
      task_name: taskNameCol >= 0 ? taskNameCol : 2,
      assigned_to: assignedToCol >= 0 ? assignedToCol : 3,
      status: statusCol >= 0 ? statusCol : 4,
    };

    // Parse data rows (skip header rows - first 1 or 2 rows)
    // Second row might be date sub-headers, detect if it starts with empty or a date
    const dataStartRow = rawData.length > 2 && String(rawData[1][0] || '').trim() === '' ? 2 : 1;

    const parsedRows: ParsedRow[] = [];
    for (let r = dataStartRow; r < rawData.length; r++) {
      const row = rawData[r];
      const projectCode = String(row[cols.project_code] || '').trim();
      const taskName = String(row[cols.task_name] || '').trim();

      // Skip empty rows and total rows
      if (!projectCode || !taskName) continue;
      if (projectCode.toUpperCase() === 'TOPLAM') continue;

      const weeklyHours: Record<number, number> = {};
      for (const [colIdxStr, weekNum] of Object.entries(weekColumns)) {
        const val = parseFloat(row[parseInt(colIdxStr)]) || 0;
        if (val > 0) weeklyHours[weekNum] = val;
      }

      parsedRows.push({
        project_code: projectCode,
        project_name: String(row[cols.project_name] || '').trim(),
        task_name: taskName,
        assigned_to: String(row[cols.assigned_to] || '').trim() || 'Atanmamış',
        status: String(row[cols.status] || '').trim() || 'Başlanmadı',
        weeklyHours,
      });
    }

    if (parsedRows.length === 0) {
      return NextResponse.json({ error: 'Excel dosyasında geçerli veri bulunamadı' }, { status: 400 });
    }

    const sql = getSQL();
    let insertedItems = 0;
    let updatedItems = 0;
    let insertedLogs = 0;

    for (const row of parsedRows) {
      // Check if item already exists (match by project_code + task_name + assigned_to)
      const existing = await sql`
        SELECT id FROM work_items 
        WHERE project_code = ${row.project_code} 
          AND task_name = ${row.task_name} 
          AND assigned_to = ${row.assigned_to}
        LIMIT 1
      `;

      let itemId: number;

      if (existing.length > 0) {
        itemId = existing[0].id;
        // Update fields
        await sql`
          UPDATE work_items SET 
            project_name = ${row.project_name},
            status = ${row.status}
          WHERE id = ${itemId}
        `;
        updatedItems++;
      } else {
        // Insert new
        const result = await sql`
          INSERT INTO work_items (project_code, project_name, task_name, assigned_to, status, priority, category)
          VALUES (${row.project_code}, ${row.project_name}, ${row.task_name}, ${row.assigned_to}, ${row.status}, ${'Orta'}, ${'Genel'})
          RETURNING id
        `;
        itemId = result[0].id;
        insertedItems++;
      }

      // Upsert weekly hours
      for (const [weekNumStr, hours] of Object.entries(row.weeklyHours)) {
        const weekNumber = parseInt(weekNumStr);

        // Compute Monday of the ISO week for log_date
        const jan4 = new Date(year, 0, 4);
        const dow = jan4.getDay() || 7;
        const w1Mon = new Date(year, 0, 4 - dow + 1);
        const monday = new Date(w1Mon);
        monday.setDate(w1Mon.getDate() + (weekNumber - 1) * 7);
        const log_date = monday.toISOString().split('T')[0];

        // Delete existing entries for this cell
        await sql`
          DELETE FROM work_logs 
          WHERE work_item_id = ${itemId} AND week_number = ${weekNumber} AND year = ${year}
        `;

        // Insert new hours
        if (hours > 0) {
          await sql`
            INSERT INTO work_logs (work_item_id, user_name, hours, log_date, week_number, year, description)
            VALUES (${itemId}, ${row.assigned_to}, ${hours}, ${log_date}, ${weekNumber}, ${year}, ${'Excel import'})
          `;
          insertedLogs++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `${insertedItems} yeni iş eklendi, ${updatedItems} iş güncellendi, ${insertedLogs} saat kaydı işlendi.`,
      stats: { insertedItems, updatedItems, insertedLogs, totalRows: parsedRows.length },
    });
  } catch (error: any) {
    console.error('Excel upload error:', error);
    return NextResponse.json({ error: `Excel işleme hatası: ${error.message}` }, { status: 500 });
  }
}
