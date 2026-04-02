import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { reservations, users } from '@/lib/schema';
import { eq, and, gte, lte, or, not, desc } from 'drizzle-orm';
import { sendReservationConfirmation } from '@/lib/email';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const startDate = searchParams.get('start');
  const endDate = searchParams.get('end');
  const status = searchParams.get('status');

  let query = db
    .select({
      id: reservations.id,
      userId: reservations.userId,
      userName: users.name,
      userEmail: users.email,
      startTime: reservations.startTime,
      endTime: reservations.endTime,
      description: reservations.description,
      status: reservations.status,
      createdAt: reservations.createdAt,
    })
    .from(reservations)
    .innerJoin(users, eq(reservations.userId, users.id))
    .orderBy(desc(reservations.startTime));

  const conditions = [];

  if (startDate) {
    conditions.push(gte(reservations.startTime, new Date(startDate)));
  }
  if (endDate) {
    conditions.push(lte(reservations.endTime, new Date(endDate)));
  }
  if (status) {
    conditions.push(eq(reservations.status, status));
  }

  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as typeof query;
  }

  const result = await query;
  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
  }

  try {
    const { startTime, endTime, description } = await req.json();

    if (!startTime || !endTime) {
      return NextResponse.json(
        { error: 'Başlangıç ve bitiş zamanı zorunludur' },
        { status: 400 }
      );
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (start >= end) {
      return NextResponse.json(
        { error: 'Bitiş zamanı başlangıçtan sonra olmalıdır' },
        { status: 400 }
      );
    }

    if (start < new Date()) {
      return NextResponse.json(
        { error: 'Geçmiş bir zamana rezervasyon yapılamaz' },
        { status: 400 }
      );
    }

    // Check for overlapping reservations
    const overlapping = await db
      .select()
      .from(reservations)
      .where(
        and(
          eq(reservations.status, 'active'),
          or(
            and(lte(reservations.startTime, start), gte(reservations.endTime, start)),
            and(lte(reservations.startTime, end), gte(reservations.endTime, end)),
            and(gte(reservations.startTime, start), lte(reservations.endTime, end))
          )
        )
      );

    if (overlapping.length > 0) {
      return NextResponse.json(
        { error: 'Bu zaman aralığında zaten bir rezervasyon var' },
        { status: 409 }
      );
    }

    const userId = parseInt(session.user.id);

    const [reservation] = await db
      .insert(reservations)
      .values({
        userId,
        startTime: start,
        endTime: end,
        description: description || null,
        status: 'active',
      })
      .returning();

    // Send confirmation email
    try {
      await sendReservationConfirmation(
        session.user.email,
        session.user.name,
        start,
        end,
        description
      );
    } catch (emailError) {
      console.error('Email send error:', emailError);
    }

    return NextResponse.json(reservation, { status: 201 });
  } catch (error) {
    console.error('Reservation creation error:', error);
    return NextResponse.json(
      { error: 'Rezervasyon oluşturulurken bir hata oluştu' },
      { status: 500 }
    );
  }
}
