import { getSQL } from './db';

export async function sendNtfyToQueueUsers(serverName: string, title: string, message: string) {
  try {
    const sql = getSQL();
    const queueUsers = await sql`
      SELECT u.ntfy_topic
      FROM server_queue sq
      JOIN users u ON sq.user_id = u.id
      WHERE sq.server_name = ${serverName} AND u.ntfy_topic IS NOT NULL AND u.ntfy_topic != ''
      ORDER BY sq.position ASC
    `;

    for (const row of queueUsers) {
      try {
        await fetch(`https://ntfy.sh/${row.ntfy_topic}`, {
          method: 'POST',
          body: message,
          headers: { 'Title': title, 'Tags': 'computer,white_check_mark' },
        });
      } catch (e) {
        console.error('Ntfy send failed for topic:', row.ntfy_topic, e);
      }
    }
  } catch (e) {
    console.error('sendNtfyToQueueUsers error:', e);
  }
}

export async function sendNtfyToUser(userId: number, title: string, message: string) {
  try {
    const sql = getSQL();
    const users = await sql`SELECT ntfy_topic FROM users WHERE id = ${userId} AND ntfy_topic IS NOT NULL AND ntfy_topic != '' LIMIT 1`;
    if (users.length === 0) return;

    await fetch(`https://ntfy.sh/${users[0].ntfy_topic}`, {
      method: 'POST',
      body: message,
      headers: { 'Title': title, 'Tags': 'computer,bell' },
    });
  } catch (e) {
    console.error('sendNtfyToUser error:', e);
  }
}

export async function sendNtfyToAllWithTopic(title: string, message: string): Promise<string> {
  try {
    const sql = getSQL();
    const users = await sql`
      SELECT ntfy_topic FROM users 
      WHERE ntfy_topic IS NOT NULL AND ntfy_topic != ''
    `;

    if (users.length === 0) return 'no_users_with_topic';

    const results: string[] = [];
    for (const row of users) {
      try {
        const res = await fetch(`https://ntfy.sh/${row.ntfy_topic}`, {
          method: 'POST',
          body: message,
          headers: { 'Title': title, 'Tags': 'computer,loudspeaker' },
        });
        const body = await res.text();
        results.push(`${row.ntfy_topic}:${res.status}`);
      } catch (e: any) {
        results.push(`${row.ntfy_topic}:ERR:${e.message}`);
      }
    }
    return results.join(' | ');
  } catch (e: any) {
    return 'db_error: ' + e.message;
  }
}
