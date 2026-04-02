import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { reservations } from '@/lib/schema';
import { eq, and, or, lte, gte, not } from 'drizzle-orm';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
  }

  try {
    const reservationId = parseInt(params.id);
    const body = await req.json();
    const { status, startTime, endTime, description } = body;

    const userId = parseInt(session.user.id);

    const [reservation] = await db
      .select()
      .from(reservations)
      .where(eq(reservations.id, reservationId));

    if (!reservation) {
      return NextResponse.json(
        { error: 'Rezervasyon bulunamadı' },
        { status: 404 }
      );
    }

    const isAdmin = session.user.role === 'admin';
    if (reservation.userId !== userId && !isAdmin) {
      return NextResponse.json(
        { error: 'Bu rezervasyonu değiştirme yetkiniz yok' },
        { status: 403 }
      );
    }

    const updateData: Record<string, unknown> = {};

    if (status !== undefined) {
      if (!['active', 'completed', 'cancelled'].includes(status)) {
        return NextResponse.json(
          { error: 'Geçersiz durum' },
          { status: 400 }
        );
      }
      updateData.status = status;
    }

    if (startTime !== undefined && endTime !== undefined) {
      const start = new Date(startTime);
      const end = new Date(endTime);

      if (start >= end) {
        return NextResponse.json(
          { error: 'Bitiş zamanı başlangıçtan sonra olmalıdır' },
          { status: 400 }
        );
      }

      // Check for overlapping reservations (exclude current one)
      const overlapping = await db
        .select()
        .from(reservations)
        .where(
          and(
            eq(reservations.status, 'active'),
            not(eq(reservations.id, reservationId)),
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

      updateData.startTime = start;
      updateData.endTime = end;
    }

    if (description !== undefined) {
      updateData.description = description || null;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'Güncellenecek alan bulunamadı' },
        { status: 400 }
      );
    }

    const [updated] = await db
      .update(reservations)
      .set(updateData)
      .where(eq(reservations.id, reservationId))
      .returning();

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Reservation update error:', error);
    return NextResponse.json(
      { error: 'Rezervasyon güncellenirken bir hata oluştu' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
  }

  try {
    const reservationId = parseInt(params.id);
    const userId = parseInt(session.user.id);

    const [reservation] = await db
      .select()
      .from(reservations)
      .where(eq(reservations.id, reservationId));

    if (!reservation) {
      return NextResponse.json(
        { error: 'Rezervasyon bulunamadı' },
        { status: 404 }
      );
    }

    const isAdmin = session.user.role === 'admin';
    if (reservation.userId !== userId && !isAdmin) {
      return NextResponse.json(
        { error: 'Bu rezervasyonu silme yetkiniz yok' },
        { status: 403 }
      );
    }

    await db
      .update(reservations)
      .set({ status: 'cancelled' })
      .where(eq(reservations.id, reservationId));

    return NextResponse.json({ message: 'Rezervasyon iptal edildi' });
  } catch (error) {
    console.error('Reservation delete error:', error);
    return NextResponse.json(
      { error: 'Rezervasyon silinirken bir hata oluştu' },
      { status: 500 }
    );
  }
}
