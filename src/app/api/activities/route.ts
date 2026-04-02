import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { activities, users, reservations } from '@/lib/schema';
import { eq, desc, and, gte, lte } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get('limit') || '50');
  const startDate = searchParams.get('start');
  const endDate = searchParams.get('end');

  const conditions = [];

  if (startDate) {
    conditions.push(gte(activities.createdAt, new Date(startDate)));
  }
  if (endDate) {
    conditions.push(lte(activities.createdAt, new Date(endDate)));
  }

  let query = db
    .select({
      id: activities.id,
      userId: activities.userId,
      userName: users.name,
      reservationId: activities.reservationId,
      description: activities.description,
      category: activities.category,
      durationMinutes: activities.durationMinutes,
      createdAt: activities.createdAt,
    })
    .from(activities)
    .innerJoin(users, eq(activities.userId, users.id))
    .orderBy(desc(activities.createdAt))
    .limit(limit);

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
    const { description, category, durationMinutes, reservationId } = await req.json();

    if (!description) {
      return NextResponse.json(
        { error: 'Açıklama zorunludur' },
        { status: 400 }
      );
    }

    const userId = parseInt(session.user.id);

    const [activity] = await db
      .insert(activities)
      .values({
        userId,
        reservationId: reservationId || null,
        description,
        category: category || null,
        durationMinutes: durationMinutes || null,
      })
      .returning();

    return NextResponse.json(activity, { status: 201 });
  } catch (error) {
    console.error('Activity creation error:', error);
    return NextResponse.json(
      { error: 'İşlem kaydı oluşturulurken bir hata oluştu' },
      { status: 500 }
    );
  }
}
