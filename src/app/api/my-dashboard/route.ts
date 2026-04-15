import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getSQL } from '@/lib/db';

export const dynamic = 'force-dynamic';

function getCurrentWeek(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const diff = now.getTime() - start.getTime();
  return Math.ceil((diff / 86400000 + start.getDay() + 1) / 7);
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sql = getSQL();
  const userName = session.user?.name || '';
  const year = new Date().getFullYear();
  const currentWeek = getCurrentWeek();

  try {
    // 1. Kullanıcının iş kalemleri
    const myItems = await sql`
      SELECT id, project_code, project_name, task_name, status, priority, category, due_date, created_at
      FROM work_items 
      WHERE assigned_to = ${userName}
      ORDER BY 
        CASE status 
          WHEN 'Devam Ediyor' THEN 1 
          WHEN 'Data Bekleniyor' THEN 2 
          WHEN 'Başlanmadı' THEN 3 
          WHEN 'Tamamlandı' THEN 4 
        END,
        priority DESC
    `;

    // 2. Bu haftanın ve geçen haftanın saat girişleri
    const weeklyLogs = await sql`
      SELECT wl.work_item_id, wl.week_number, wl.hours, wi.task_name, wi.project_code
      FROM work_logs wl
      JOIN work_items wi ON wi.id = wl.work_item_id
      WHERE wi.assigned_to = ${userName} AND wl.year = ${year}
        AND wl.week_number IN (${currentWeek}, ${currentWeek - 1})
    `;

    // 3. Hatırlatıcılar
    const reminders = await sql`
      SELECT * FROM user_reminders 
      WHERE user_name = ${userName} AND is_done = false
      ORDER BY remind_at ASC
    `;

    // 4. Toplam saat bu hafta
    const thisWeekHours = weeklyLogs
      .filter((l: Record<string, unknown>) => l.week_number === currentWeek)
      .reduce((sum: number, l: Record<string, unknown>) => sum + (Number(l.hours) || 0), 0);

    const lastWeekHours = weeklyLogs
      .filter((l: Record<string, unknown>) => l.week_number === currentWeek - 1)
      .reduce((sum: number, l: Record<string, unknown>) => sum + (Number(l.hours) || 0), 0);

    // 5. Bu hafta giriş yapılmış iş kalemleri
    const itemsWithHoursThisWeek = new Set(
      weeklyLogs
        .filter((l: Record<string, unknown>) => l.week_number === currentWeek && Number(l.hours) > 0)
        .map((l: Record<string, unknown>) => l.work_item_id)
    );

    // 6. Akıllı uyarılar oluştur
    const alerts: { type: string; severity: 'info' | 'warning' | 'urgent'; message: string; icon: string }[] = [];

    // Devam eden ama bu hafta saat girilmemiş işler
    const activeNoHours = myItems.filter(
      (item: Record<string, unknown>) => item.status === 'Devam Ediyor' && !itemsWithHoursThisWeek.has(item.id)
    );
    if (activeNoHours.length > 0) {
      alerts.push({
        type: 'weekly_hours',
        severity: 'warning',
        message: `${activeNoHours.length} aktif işin için bu hafta henüz saat girişi yapmadın`,
        icon: 'clock'
      });
    }

    // Geçen hafta toplam saat düşükse
    if (lastWeekHours > 0 && lastWeekHours < 30) {
      alerts.push({
        type: 'low_hours',
        severity: 'info',
        message: `Geçen hafta toplam ${lastWeekHours} saat giriş yaptın`,
        icon: 'trending-down'
      });
    }

    // Due date yaklaşan işler
    const now = new Date();
    for (const item of myItems) {
      if (item.due_date && item.status !== 'Tamamlandı') {
        const due = new Date(item.due_date as string);
        const daysLeft = Math.ceil((due.getTime() - now.getTime()) / 86400000);
        if (daysLeft <= 0) {
          alerts.push({
            type: 'overdue',
            severity: 'urgent',
            message: `"${item.task_name}" işinin teslim tarihi geçti!`,
            icon: 'alert-triangle'
          });
        } else if (daysLeft <= 7) {
          alerts.push({
            type: 'due_soon',
            severity: 'warning',
            message: `"${item.task_name}" teslim tarihine ${daysLeft} gün kaldı`,
            icon: 'calendar'
          });
        }
      }
    }

    // Başlanmamış işler
    const notStarted = myItems.filter((item: Record<string, unknown>) => item.status === 'Başlanmadı');
    if (notStarted.length > 0) {
      alerts.push({
        type: 'not_started',
        severity: 'info',
        message: `${notStarted.length} işin henüz başlanmadı olarak duruyor`,
        icon: 'play'
      });
    }

    // Yaklaşan hatırlatıcılar (24 saat içinde)
    const upcoming = reminders.filter((r: Record<string, unknown>) => {
      const remindAt = new Date(r.remind_at as string);
      const hoursLeft = (remindAt.getTime() - now.getTime()) / 3600000;
      return hoursLeft > 0 && hoursLeft <= 24;
    });
    if (upcoming.length > 0) {
      alerts.push({
        type: 'reminder',
        severity: 'warning',
        message: `${upcoming.length} hatırlatıcın 24 saat içinde sona erecek`,
        icon: 'bell'
      });
    }

    // İş durumu özeti
    const statusSummary = {
      devamEdiyor: myItems.filter((i: Record<string, unknown>) => i.status === 'Devam Ediyor').length,
      baslanmadi: myItems.filter((i: Record<string, unknown>) => i.status === 'Başlanmadı').length,
      dataBekleniyor: myItems.filter((i: Record<string, unknown>) => i.status === 'Data Bekleniyor').length,
      tamamlandi: myItems.filter((i: Record<string, unknown>) => i.status === 'Tamamlandı').length,
    };

    return NextResponse.json({
      userName,
      currentWeek,
      year,
      myItems,
      thisWeekHours,
      lastWeekHours,
      statusSummary,
      alerts,
      reminders,
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sql = getSQL();
  const userName = session.user?.name || '';

  try {
    const body = await req.json();
    const { action } = body;

    if (action === 'createReminder') {
      const { title, description, remind_at, color } = body;
      if (!title || !remind_at) return NextResponse.json({ error: 'Başlık ve tarih gerekli' }, { status: 400 });
      const cleanTitle = String(title).slice(0, 200).trim();
      const cleanDesc = description ? String(description).slice(0, 500).trim() : null;
      const safeColor = ['blue', 'green', 'amber', 'red', 'purple', 'pink'].includes(color) ? color : 'blue';

      await sql`INSERT INTO user_reminders (user_name, title, description, remind_at, color)
        VALUES (${userName}, ${cleanTitle}, ${cleanDesc}, ${remind_at}, ${safeColor})`;
      return NextResponse.json({ created: true });
    }

    if (action === 'completeReminder') {
      const { id } = body;
      if (!id) return NextResponse.json({ error: 'ID gerekli' }, { status: 400 });
      await sql`UPDATE user_reminders SET is_done = true WHERE id = ${id} AND user_name = ${userName}`;
      return NextResponse.json({ done: true });
    }

    if (action === 'deleteReminder') {
      const { id } = body;
      if (!id) return NextResponse.json({ error: 'ID gerekli' }, { status: 400 });
      await sql`DELETE FROM user_reminders WHERE id = ${id} AND user_name = ${userName}`;
      return NextResponse.json({ deleted: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Dashboard POST error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
