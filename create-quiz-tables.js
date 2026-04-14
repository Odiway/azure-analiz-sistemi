const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const envContent = fs.readFileSync('.env', 'utf-8');
const dbUrl = envContent.split('\n').find(l => l.startsWith('DATABASE_URL=')).replace('DATABASE_URL=', '').trim();
const sql = neon(dbUrl);

async function run() {
  await sql('CREATE TABLE IF NOT EXISTS quiz_questions (id SERIAL PRIMARY KEY, question TEXT NOT NULL, option_a TEXT NOT NULL, option_b TEXT NOT NULL, option_c TEXT NOT NULL, option_d TEXT NOT NULL, correct_option CHAR(1) NOT NULL, category TEXT NOT NULL, last_used_at TIMESTAMP, created_at TIMESTAMP DEFAULT NOW())');
  console.log('quiz_questions OK');

  await sql("CREATE TABLE IF NOT EXISTS quiz_sessions (id SERIAL PRIMARY KEY, status TEXT NOT NULL DEFAULT 'waiting', current_question INTEGER DEFAULT 0, question_ids INTEGER[] DEFAULT ARRAY[]::INTEGER[], question_started_at TIMESTAMP, started_at TIMESTAMP, finished_at TIMESTAMP, created_at TIMESTAMP DEFAULT NOW())");
  console.log('quiz_sessions OK');

  await sql('CREATE TABLE IF NOT EXISTS quiz_participants (id SERIAL PRIMARY KEY, session_id INTEGER NOT NULL REFERENCES quiz_sessions(id), user_name TEXT NOT NULL, score INTEGER DEFAULT 0, rank INTEGER, joined_at TIMESTAMP DEFAULT NOW(), UNIQUE(session_id, user_name))');
  console.log('quiz_participants OK');

  await sql('CREATE TABLE IF NOT EXISTS quiz_answers (id SERIAL PRIMARY KEY, session_id INTEGER NOT NULL REFERENCES quiz_sessions(id), participant_id INTEGER NOT NULL REFERENCES quiz_participants(id), question_id INTEGER NOT NULL REFERENCES quiz_questions(id), question_number INTEGER NOT NULL, selected_option CHAR(1), is_correct BOOLEAN DEFAULT FALSE, time_taken_ms INTEGER, score INTEGER DEFAULT 0, answered_at TIMESTAMP DEFAULT NOW())');
  console.log('quiz_answers OK');
}

run().catch(e => console.error(e));
