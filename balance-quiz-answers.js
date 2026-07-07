// Doğru cevapları A-B-C-D-(E) şıklarına dengeli dağıtır.
// Eski sorularda cevaplar B ve C'de yığılmıştı; bu script her sorunun
// şıklarını karıştırıp doğru cevabı round-robin ile dengeli yerleştirir.
const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const dbUrl = fs.readFileSync('.env', 'utf-8').split('\n').find(l => l.startsWith('DATABASE_URL=')).replace('DATABASE_URL=', '').trim();
const sql = neon(dbUrl);

const LETTERS = ['A', 'B', 'C', 'D', 'E'];

function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function run() {
  const rows = await sql`SELECT id, option_a, option_b, option_c, option_d, option_e, correct_option FROM quiz_questions ORDER BY id`;
  console.log('Toplam soru:', rows.length);

  const before = {};
  for (const r of rows) before[r.correct_option] = (before[r.correct_option] || 0) + 1;
  console.log('Önceki dağılım:', before);

  let ti = 0;
  let updated = 0;
  for (const r of rows) {
    const opts = [];
    for (const L of LETTERS) {
      const v = r['option_' + L.toLowerCase()];
      if (v !== null && v !== undefined && String(v).trim() !== '') opts.push({ L, t: v });
    }
    const n = opts.length;
    if (n < 2) continue;
    const correct = opts.find((o) => o.L === r.correct_option);
    if (!correct) continue;

    const others = shuffle(opts.filter((o) => o.L !== r.correct_option).map((o) => o.t));
    const pos = ti % n;
    const finals = [];
    let oi = 0;
    for (let p = 0; p < n; p++) finals.push(p === pos ? correct.t : others[oi++]);

    const newCorrect = LETTERS[pos];
    const oa = finals[0], ob = finals[1], oc = finals[2], od = finals[3];
    const oe = n > 4 ? finals[4] : (r.option_e ?? null);

    await sql`UPDATE quiz_questions SET option_a = ${oa}, option_b = ${ob}, option_c = ${oc}, option_d = ${od}, option_e = ${oe}, correct_option = ${newCorrect} WHERE id = ${r.id}`;
    ti++;
    updated++;
  }

  const after = await sql`SELECT correct_option, COUNT(*)::int as cnt FROM quiz_questions GROUP BY correct_option ORDER BY correct_option`;
  console.log('Güncellenen soru:', updated);
  console.log('Yeni dağılım:', Object.fromEntries(after.map((r) => [r.correct_option, r.cnt])));
}
run().catch((e) => console.error(e));
