import { getSQL } from './db';

// Event types for notification preferences
export type NtfyEvent = 
  | 'azure-1_enter' | 'azure-1_exit' | 'azure-1_analysis'
  | 'azure-2_enter' | 'azure-2_exit' | 'azure-2_analysis'
  | 'queue_waiting';

export const ALL_EVENTS: { key: NtfyEvent; label: string; group: string }[] = [
  { key: 'azure-1_enter', label: 'Azure 1 - Giris yapildiginda', group: 'Azure 1' },
  { key: 'azure-1_exit', label: 'Azure 1 - Cikis yapildiginda', group: 'Azure 1' },
  { key: 'azure-1_analysis', label: 'Azure 1 - Analiz bittiginde', group: 'Azure 1' },
  { key: 'azure-2_enter', label: 'Azure 2 - Giris yapildiginda', group: 'Azure 2' },
  { key: 'azure-2_exit', label: 'Azure 2 - Cikis yapildiginda', group: 'Azure 2' },
  { key: 'azure-2_analysis', label: 'Azure 2 - Analiz bittiginde', group: 'Azure 2' },
  { key: 'queue_waiting', label: 'Biri sirada beklemeye basladiginda', group: 'Sira' },
];

function getUserPrefs(ntfyPrefs: string | null): Record<string, boolean> {
  try {
    return JSON.parse(ntfyPrefs || '{}');
  } catch {
    return {};
  }
}

async function sendToTopic(topic: string, title: string, message: string, tag: string = 'loudspeaker'): Promise<string> {
  try {
    const res = await fetch(`https://ntfy.sh/${topic}`, {
      method: 'POST',
      body: message,
      headers: { 'Title': title, 'Tags': `computer,${tag}` },
    });
    return `${topic}:${res.status}`;
  } catch (e: any) {
    return `${topic}:ERR:${e.message}`;
  }
}

// Send notification to all users who have the given event enabled
export async function sendNtfyByEvent(event: NtfyEvent, title: string, message: string): Promise<string> {
  try {
    const sql = getSQL();
    const users = await sql`
      SELECT ntfy_topic, ntfy_prefs FROM users 
      WHERE ntfy_topic IS NOT NULL AND ntfy_topic != ''
    `;

    if (users.length === 0) return 'no_users_with_topic';

    const results: string[] = [];
    for (const row of users) {
      const prefs = getUserPrefs(row.ntfy_prefs);
      if (!prefs[event]) {
        results.push(`${row.ntfy_topic}:skipped`);
        continue;
      }
      const r = await sendToTopic(row.ntfy_topic, title, message);
      results.push(r);
    }
    return results.join(' | ');
  } catch (e: any) {
    return 'db_error: ' + e.message;
  }
}

// Send notification to a specific user (for queue_waiting)
export async function sendNtfyToUserByEvent(userId: number, event: NtfyEvent, title: string, message: string): Promise<string> {
  try {
    const sql = getSQL();
    const users = await sql`SELECT ntfy_topic, ntfy_prefs FROM users WHERE id = ${userId} AND ntfy_topic IS NOT NULL AND ntfy_topic != '' LIMIT 1`;
    if (users.length === 0) return 'no_topic';

    const prefs = getUserPrefs(users[0].ntfy_prefs);
    if (!prefs[event]) return 'pref_disabled';

    return await sendToTopic(users[0].ntfy_topic, title, message, 'bell');
  } catch (e: any) {
    return 'error: ' + e.message;
  }
}
