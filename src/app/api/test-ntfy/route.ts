import { NextResponse } from 'next/server';
import { sendNtfyToAllWithTopic } from '@/lib/notify';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log('Test ntfy endpoint called');
    await sendNtfyToAllWithTopic(
      'Test - Vercel',
      'Bu bildirim Vercel uzerinden gonderildi!'
    );
    console.log('Test ntfy completed');
    return NextResponse.json({ success: true, message: 'Bildirimler gönderildi' });
  } catch (e: any) {
    console.error('Test ntfy error:', e);
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
