const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const envContent = fs.readFileSync('.env', 'utf-8');
const dbUrl = envContent.split('\n').find(l => l.startsWith('DATABASE_URL=')).replace('DATABASE_URL=', '').trim();
const sql = neon(dbUrl);

async function run() {
  // user_reminders tablosu
  await sql`CREATE TABLE IF NOT EXISTS user_reminders (
    id SERIAL PRIMARY KEY,
    user_name VARCHAR(100) NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    remind_at TIMESTAMPTZ NOT NULL,
    color VARCHAR(20) DEFAULT 'blue',
    is_done BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`;
  console.log('user_reminders tablosu oluşturuldu.');

  // work_items tablosuna due_date kolonu ekle (yoksa)
  try {
    await sql`ALTER TABLE work_items ADD COLUMN IF NOT EXISTS due_date TIMESTAMPTZ`;
    console.log('work_items.due_date kolonu eklendi.');
  } catch (e) {
    console.log('due_date zaten var veya hata:', e.message);
  }

  console.log('Tamamlandı!');
}

run();
