const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const dbUrl = fs.readFileSync('.env', 'utf-8').split('\n').find(l => l.startsWith('DATABASE_URL=')).replace('DATABASE_URL=', '').trim();
const sql = neon(dbUrl);
(async () => {
  const imgs = await sql`SELECT id, image_url, category FROM quiz_questions WHERE image_url IS NOT NULL AND image_url <> '' ORDER BY id`;
  console.log('Toplam görselli soru:', imgs.length);
  for (const r of imgs) console.log(r.id, r.category, r.image_url);
  process.exit(0);
})();
