const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const dbUrl = fs.readFileSync('.env', 'utf-8').split('\n').find(l => l.startsWith('DATABASE_URL=')).replace('DATABASE_URL=', '').trim();
const sql = neon(dbUrl);

async function run() {
  await sql('ALTER TABLE quiz_questions ADD COLUMN IF NOT EXISTS option_e TEXT');
  console.log('option_e column OK');

  await sql('ALTER TABLE quiz_questions ADD COLUMN IF NOT EXISTS image_url TEXT');
  console.log('image_url column OK');
}
run().catch(e => console.error(e));
