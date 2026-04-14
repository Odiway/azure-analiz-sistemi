const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const dbUrl = fs.readFileSync('.env','utf-8').split('\n').find(l=>l.startsWith('DATABASE_URL=')).replace('DATABASE_URL=','').trim();
const sql = neon(dbUrl);

async function run() {
  await sql('ALTER TABLE quiz_participants ADD COLUMN IF NOT EXISTS is_ready BOOLEAN DEFAULT FALSE');
  console.log('is_ready column added');

  await sql('CREATE TABLE IF NOT EXISTS quiz_chat (id SERIAL PRIMARY KEY, session_id INTEGER REFERENCES quiz_sessions(id), user_name TEXT NOT NULL, message TEXT NOT NULL, created_at TIMESTAMP DEFAULT NOW())');
  console.log('quiz_chat table created');

  await sql("UPDATE quiz_sessions SET status = 'cancelled' WHERE status = 'waiting'");
  console.log('stuck sessions cleaned');
}
run().catch(e => console.error(e));
