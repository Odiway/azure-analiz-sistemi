const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const dbUrl = fs.readFileSync('.env', 'utf-8').split('\n').find(l => l.startsWith('DATABASE_URL=')).replace('DATABASE_URL=', '').trim();
const sql = neon(dbUrl);
(async () => {
  const cats = await sql`SELECT category, COUNT(*)::int as cnt FROM quiz_questions GROUP BY category ORDER BY cnt DESC`;
  console.log('Kategoriler:', JSON.stringify(cats, null, 2));
  const stats = await sql`SELECT COUNT(*)::int as total, COUNT(CASE WHEN option_e IS NOT NULL AND option_e<>'' THEN 1 END)::int as with_e FROM quiz_questions`;
  console.log('Stats:', JSON.stringify(stats[0]));
  process.exit(0);
})();
