const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const dbUrl = fs.readFileSync('.env', 'utf-8').split('\n').find(l => l.startsWith('DATABASE_URL=')).replace('DATABASE_URL=', '').trim();
const sql = neon(dbUrl);
(async () => {
  // Gerçek duplikatlar: aynı soru metni + aynı option_a (aynı soru farklı görsel değil)
  const dups = await sql`
    SELECT question, option_a, COUNT(*)::int as cnt, array_agg(id ORDER BY id) as ids
    FROM quiz_questions
    GROUP BY question, option_a
    HAVING COUNT(*) > 1
    ORDER BY cnt DESC
  `;
  console.log('Gercek duplikat grup sayisi:', dups.length);
  
  let toDelete = [];
  for (const d of dups) {
    // En küçük id'yi tut, diğerlerini sil
    const [keep, ...remove] = d.ids;
    toDelete = toDelete.concat(remove);
  }
  console.log('Silinecek duplikat satir sayisi:', toDelete.length);
  
  if (toDelete.length > 0) {
    for (const id of toDelete) {
      await sql`DELETE FROM quiz_questions WHERE id = ${id}`;
    }
    console.log('Duplikatlar silindi!');
  }
  
  const total = await sql`SELECT COUNT(*)::int as cnt FROM quiz_questions`;
  console.log('Temizlendi. Toplam soru:', total[0].cnt);
  process.exit(0);
})();
