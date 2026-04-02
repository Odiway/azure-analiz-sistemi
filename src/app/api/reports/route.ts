import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { reservations, activities, users } from '@/lib/schema';
import { eq, and, gte, lte, sql, count, sum } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const period = searchParams.get('period') || 'weekly';
  const startDate = searchParams.get('start');
  const endDate = searchParams.get('end');

  let start: Date;
  let end: Date;

  const now = new Date();

  if (startDate && endDate) {
    start = new Date(startDate);
    end = new Date(endDate);
  } else {
    switch (period) {
      case 'daily':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        break;
      case 'weekly':
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1);
        start = new Date(now.getFullYear(), now.getMonth(), diff);
        end = new Date(start);
        end.setDate(start.getDate() + 7);
        break;
      case 'monthly':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        break;
      case 'yearly':
        start = new Date(now.getFullYear(), 0, 1);
        end = new Date(now.getFullYear() + 1, 0, 1);
        break;
      default:
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
        end = now;
    }
  }

  // Total reservations in period
  const totalReservations = await db
    .select({ count: count() })
    .from(reservations)
    .where(
      and(
        gte(reservations.startTime, start),
        lte(reservations.startTime, end)
      )
    );

  // Total hours used
  const totalHours = await db
    .select({
      totalMinutes: sql<number>`COALESCE(SUM(EXTRACT(EPOCH FROM (${reservations.endTime} - ${reservations.startTime})) / 60), 0)`,
    })
    .from(reservations)
    .where(
      and(
        gte(reservations.startTime, start),
        lte(reservations.startTime, end),
        eq(reservations.status, 'active')
      )
    );

  // Per-user statistics
  const userStats = await db
    .select({
      userId: reservations.userId,
      userName: users.name,
      reservationCount: count(),
      totalMinutes: sql<number>`COALESCE(SUM(EXTRACT(EPOCH FROM (${reservations.endTime} - ${reservations.startTime})) / 60), 0)`,
    })
    .from(reservations)
    .innerJoin(users, eq(reservations.userId, users.id))
    .where(
      and(
        gte(reservations.startTime, start),
        lte(reservations.startTime, end),
        eq(reservations.status, 'active')
      )
    )
    .groupBy(reservations.userId, users.name);

  // Activity statistics
  const activityStats = await db
    .select({
      category: activities.category,
      count: count(),
      totalDuration: sum(activities.durationMinutes),
    })
    .from(activities)
    .where(
      and(
        gte(activities.createdAt, start),
        lte(activities.createdAt, end)
      )
    )
    .groupBy(activities.category);

  // Daily usage for charts
  const dailyUsage = await db
    .select({
      date: sql<string>`DATE(${reservations.startTime})`,
      count: count(),
      totalMinutes: sql<number>`COALESCE(SUM(EXTRACT(EPOCH FROM (${reservations.endTime} - ${reservations.startTime})) / 60), 0)`,
    })
    .from(reservations)
    .where(
      and(
        gte(reservations.startTime, start),
        lte(reservations.startTime, end),
        eq(reservations.status, 'active')
      )
    )
    .groupBy(sql`DATE(${reservations.startTime})`)
    .orderBy(sql`DATE(${reservations.startTime})`);

  return NextResponse.json({
    period,
    startDate: start.toISOString(),
    endDate: end.toISOString(),
    summary: {
      totalReservations: totalReservations[0]?.count || 0,
      totalHours: Math.round((totalHours[0]?.totalMinutes || 0) / 60 * 10) / 10,
    },
    userStats: userStats.map((u) => ({
      ...u,
      totalHours: Math.round((u.totalMinutes || 0) / 60 * 10) / 10,
    })),
    activityStats,
    dailyUsage: dailyUsage.map((d) => ({
      ...d,
      totalHours: Math.round((d.totalMinutes || 0) / 60 * 10) / 10,
    })),
  });
}
