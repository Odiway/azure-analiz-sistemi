import { Resend } from 'resend';

let _resend: Resend | null = null;

function getResend() {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

function getEmailFrom() {
  return process.env.EMAIL_FROM || 'noreply@example.com';
}

export async function sendReservationReminder(
  to: string,
  userName: string,
  startTime: Date,
  description: string | null
) {
  const timeStr = new Intl.DateTimeFormat('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Istanbul',
  }).format(startTime);

  await getResend().emails.send({
    from: getEmailFrom(),
    to,
    subject: 'Azure Sunucu Rezervasyonunuz YaklaÅŸÄ±yor',
    html: `
      <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <div style="background: linear-gradient(135deg, #0078D4, #004E8C); padding: 32px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Azure Analiz Sistemi</h1>
        </div>
        <div style="padding: 32px;">
          <p style="color: #333; font-size: 16px;">Merhaba <strong>${userName}</strong>,</p>
          <p style="color: #555; font-size: 15px;">Azure sunucu rezervasyonunuz yaklaÅŸÄ±yor:</p>
          <div style="background: #f0f7ff; border-left: 4px solid #0078D4; padding: 16px; border-radius: 0 8px 8px 0; margin: 20px 0;">
            <p style="margin: 0; color: #0078D4; font-weight: 600;">ğŸ“… ${timeStr}</p>
            ${description ? `<p style="margin: 8px 0 0; color: #555;">${description}</p>` : ''}
          </div>
          <p style="color: #777; font-size: 13px; margin-top: 24px;">LÃ¼tfen zamanÄ±nda hazÄ±r olun. Ä°yi analizler!</p>
        </div>
      </div>
    `,
  });
}

export async function sendSystemFreeNotification(to: string, userName: string) {
  await getResend().emails.send({
    from: getEmailFrom(),
    to,
    subject: 'Azure Sunucu Åu Anda BoÅŸ!',
    html: `
      <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <div style="background: linear-gradient(135deg, #00A36C, #006644); padding: 32px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Sunucu BoÅŸ! âœ…</h1>
        </div>
        <div style="padding: 32px;">
          <p style="color: #333; font-size: 16px;">Merhaba <strong>${userName}</strong>,</p>
          <p style="color: #555; font-size: 15px;">Azure analiz sunucusu ÅŸu anda mÃ¼sait. Hemen rezervasyon yapabilirsiniz.</p>
          <div style="text-align: center; margin: 24px 0;">
            <a href="${process.env.NEXTAUTH_URL}/calendar" style="background: #0078D4; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">Rezervasyon Yap</a>
          </div>
        </div>
      </div>
    `,
  });
}

export async function sendReservationConfirmation(
  to: string,
  userName: string,
  startTime: Date,
  endTime: Date,
  description: string | null
) {
  const startStr = new Intl.DateTimeFormat('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Istanbul',
  }).format(startTime);

  const endStr = new Intl.DateTimeFormat('tr-TR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Istanbul',
  }).format(endTime);

  await getResend().emails.send({
    from: getEmailFrom(),
    to,
    subject: 'Rezervasyonunuz OnaylandÄ±',
    html: `
      <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <div style="background: linear-gradient(135deg, #0078D4, #004E8C); padding: 32px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Rezervasyon OnayÄ±</h1>
        </div>
        <div style="padding: 32px;">
          <p style="color: #333; font-size: 16px;">Merhaba <strong>${userName}</strong>,</p>
          <p style="color: #555; font-size: 15px;">Rezervasyonunuz baÅŸarÄ±yla oluÅŸturuldu:</p>
          <div style="background: #f0f7ff; border-left: 4px solid #0078D4; padding: 16px; border-radius: 0 8px 8px 0; margin: 20px 0;">
            <p style="margin: 0; color: #0078D4; font-weight: 600;">ğŸ“… ${startStr} - ${endStr}</p>
            ${description ? `<p style="margin: 8px 0 0; color: #555;">ğŸ“ ${description}</p>` : ''}
          </div>
        </div>
      </div>
    `,
  });
}

