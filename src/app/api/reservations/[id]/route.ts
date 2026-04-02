import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { reservations } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';

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
    const { status } = await req.json();

    if (!['active', 'completed', 'cancelled'].includes(status)) {
      return NextResponse.json(
        { error: 'Geçersiz durum' },
        { status: 400 }
      );
    }

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

    if (reservation.userId !== userId) {
      return NextResponse.json(
        { error: 'Bu rezervasyonu değiştirme yetkiniz yok' },
        { status: 403 }
      );
    }

    const [updated] = await db
      .update(reservations)
      .set({ status })
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

    if (reservation.userId !== userId) {
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
