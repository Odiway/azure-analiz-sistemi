import { getSQL } from './db';

export async function sendNtfyToQueueUsers(serverName: string, title: string, message: string) {
  const sql = getSQL();

  // Get all users in queue for this server who have ntfy_topic set
  const queueUsers = await sql`
    SELECT u.ntfy_topic
    FROM server_queue sq
    JOIN users u ON sq.user_id = u.id
    WHERE sq.server_name = ${serverName} AND u.ntfy_topic IS NOT NULL AND u.ntfy_topic != ''
    ORDER BY sq.position ASC
  `;

  const promises = queueUsers.map((row: any) =>
    fetch(`https://ntfy.sh/${row.ntfy_topic}`, {
      method: 'POST',
      body: message,
      headers: {
        'Title': title,
        'Tags': 'computer,white_check_mark',
      },
    }).catch(() => {}) // don't fail if ntfy is unreachable
  );

  await Promise.allSettled(promises);
}

export async function sendNtfyToUser(userId: number, title: string, message: string) {
  const sql = getSQL();

  const users = await sql`SELECT ntfy_topic FROM users WHERE id = ${userId} AND ntfy_topic IS NOT NULL AND ntfy_topic != '' LIMIT 1`;
  if (users.length === 0) return;

  await fetch(`https://ntfy.sh/${users[0].ntfy_topic}`, {
    method: 'POST',
    body: message,
    headers: {
      'Title': title,
      'Tags': 'computer,bell',
    },
  }).catch(() => {});
}

export async function sendNtfyToAllWithTopic(serverName: string, title: string, message: string, excludeUserId?: number) {
  const sql = getSQL();

  const users = await sql`
    SELECT ntfy_topic FROM users 
    WHERE ntfy_topic IS NOT NULL AND ntfy_topic != ''
    ${excludeUserId ? sql`AND id != ${excludeUserId}` : sql``}
  `;

  const promises = users.map((row: any) =>
    fetch(`https://ntfy.sh/${row.ntfy_topic}`, {
      method: 'POST',
      body: message,
      headers: {
        'Title': title,
        'Tags': 'computer,loudspeaker',
      },
    }).catch(() => {})
  );

  await Promise.allSettled(promises);
}
