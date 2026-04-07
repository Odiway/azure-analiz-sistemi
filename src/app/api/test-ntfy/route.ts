import { NextResponse } from 'next/server';
import { sendNtfyByEvent } from '@/lib/notify';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const result = await sendNtfyByEvent(
      'azure-2_exit',
      'Test - Vercel',
      'Bu bildirim Vercel uzerinden gonderildi!'
    );
    return NextResponse.json({ success: true, result });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
