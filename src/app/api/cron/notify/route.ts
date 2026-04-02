import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { reservations, users, notifications } from '@/lib/schema';
import { eq, and, gte, lte, not } from 'drizzle-orm';
import { sendReservationReminder, sendSystemFreeNotification } from '@/lib/email';

export async function GET(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const now = new Date();
    const fifteenMinutesLater = new Date(now.getTime() + 15 * 60 * 1000);

    // Find reservations starting in the next 15 minutes
    const upcomingReservations = await db
      .select({
        id: reservations.id,
        userId: reservations.userId,
        userName: users.name,
        userEmail: users.email,
        startTime: reservations.startTime,
        description: reservations.description,
      })
      .from(reservations)
      .innerJoin(users, eq(reservations.userId, users.id))
      .where(
        and(
          eq(reservations.status, 'active'),
          gte(reservations.startTime, now),
          lte(reservations.startTime, fifteenMinutesLater)
        )
      );

    let remindersSent = 0;

    for (const reservation of upcomingReservations) {
      // Check if we already sent a reminder
      const existingNotification = await db
        .select()
        .from(notifications)
        .where(
          and(
            eq(notifications.userId, reservation.userId),
            eq(notifications.type, 'reservation_reminder'),
            gte(notifications.createdAt, new Date(now.getTime() - 60 * 60 * 1000))
          )
        );

      if (existingNotification.length === 0) {
        try {
          await sendReservationReminder(
            reservation.userEmail,
            reservation.userName,
            reservation.startTime,
            reservation.description
          );

          await db.insert(notifications).values({
            userId: reservation.userId,
            type: 'reservation_reminder',
            title: 'Rezervasyon Hatırlatma',
            message: `Rezervasyonunuz 15 dakika içinde başlıyor.`,
          });

          remindersSent++;
        } catch (err) {
          console.error(`Failed to send reminder for reservation ${reservation.id}:`, err);
        }
      }
    }

    // Check if system just became free
    const activeNow = await db
      .select()
      .from(reservations)
      .where(
        and(
          eq(reservations.status, 'active'),
          lte(reservations.startTime, now),
          gte(reservations.endTime, now)
        )
      );

    let freeNotificationsSent = 0;

    if (activeNow.length === 0) {
      // System is free - check if next hour has no reservations
      const nextHour = new Date(now.getTime() + 60 * 60 * 1000);
      const upcomingNextHour = await db
        .select()
        .from(reservations)
        .where(
          and(
            eq(reservations.status, 'active'),
            gte(reservations.startTime, now),
            lte(reservations.startTime, nextHour)
          )
        );

      if (upcomingNextHour.length === 0) {
        // System is free for at least an hour - notify users who haven't been notified recently
        const allUsers = await db.select().from(users);
        const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

        for (const user of allUsers) {
          const recentFreeNotif = await db
            .select()
            .from(notifications)
            .where(
              and(
                eq(notifications.userId, user.id),
                eq(notifications.type, 'system_free'),
                gte(notifications.createdAt, twoHoursAgo)
              )
            );

          if (recentFreeNotif.length === 0) {
            try {
              await sendSystemFreeNotification(user.email, user.name);

              await db.insert(notifications).values({
                userId: user.id,
                type: 'system_free',
                title: 'Sunucu Boş',
                message: 'Azure sunucu şu anda müsait. Hemen rezervasyon yapabilirsiniz.',
              });

              freeNotificationsSent++;
            } catch (err) {
              console.error(`Failed to send free notification to user ${user.id}:`, err);
            }
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      remindersSent,
      freeNotificationsSent,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json(
      { error: 'Cron job failed' },
      { status: 500 }
    );
  }
}
