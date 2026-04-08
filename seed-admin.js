const { neon } = require('@neondatabase/serverless');
const bcrypt = require('bcryptjs');

async function resetAndSeed() {
  const sql = neon(
    process.env.DATABASE_URL ||
      'postgresql://neondb_owner:npg_iMEkhCxw2t1e@ep-small-boat-alvqfb02-pooler.c-3.eu-central-1.aws.neon.tech/neondb?sslmode=require'
  );

  console.log('Eski tablolar siliniyor...');
  await sql`DROP TABLE IF EXISTS sticky_notes CASCADE`;
  await sql`DROP TABLE IF EXISTS server_analyses CASCADE`;
  await sql`DROP TABLE IF EXISTS server_queue CASCADE`;
  await sql`DROP TABLE IF EXISTS notifications CASCADE`;
  await sql`DROP TABLE IF EXISTS activities CASCADE`;
  await sql`DROP TABLE IF EXISTS reservations CASCADE`;
  await sql`DROP TABLE IF EXISTS server_sessions CASCADE`;
  await sql`DROP TABLE IF EXISTS users CASCADE`;

  console.log('Yeni tablolar oluşturuluyor...');
  await sql`CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    ntfy_topic VARCHAR(255),
    ntfy_prefs TEXT DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
  )`;

  await sql`CREATE TABLE server_sessions (
    id SERIAL PRIMARY KEY,
    server_name VARCHAR(50) NOT NULL,
    user_id INTEGER NOT NULL REFERENCES users(id),
    estimated_minutes INTEGER DEFAULT 60 NOT NULL,
    started_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    ended_at TIMESTAMPTZ
  )`;

  await sql`CREATE TABLE server_analyses (
    id SERIAL PRIMARY KEY,
    server_name VARCHAR(50) NOT NULL,
    user_id INTEGER NOT NULL REFERENCES users(id),
    estimated_minutes INTEGER NOT NULL,
    started_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    completed_at TIMESTAMPTZ
  )`;

  await sql`CREATE TABLE server_queue (
    id SERIAL PRIMARY KEY,
    server_name VARCHAR(50) NOT NULL,
    user_id INTEGER NOT NULL REFERENCES users(id),
    position INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(server_name, user_id)
  )`;

  await sql`CREATE TABLE sticky_notes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) UNIQUE,
    content TEXT NOT NULL DEFAULT '',
    color VARCHAR(20) NOT NULL DEFAULT 'yellow',
    expires_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
  )`;

  console.log('Kullanıcılar ekleniyor...\n');

  const usersData = [
    { name: 'Özgün Küçük', email: 'ozgun', password: 'ozgun123' },
    { name: 'Kıvanç Er', email: 'kivanc', password: 'kivanc123' },
    { name: 'Coşkun Fırat Dursun', email: 'coskun', password: 'coskun123' },
    { name: 'Mehmet Emin Taşkın', email: 'mehmet', password: 'mehmet123' },
    { name: 'Burak Şahin', email: 'burak', password: 'burak123' },
    { name: 'Mustafa Özyörük', email: 'mustafa', password: 'mustafa123' },
    { name: 'Sertan Singeç', email: 'sertan', password: 'sertan123' },
    { name: 'Oğuzhan İnandı', email: 'oguzhan', password: 'oguzhan123' },
  ];

  for (const u of usersData) {
    const hash = await bcrypt.hash(u.password, 12);
    await sql`INSERT INTO users (name, email, password_hash) VALUES (${u.name}, ${u.email}, ${hash})`;
  }

  console.log('=== Veritabanı başarıyla sıfırlandı ve kullanıcılar eklendi! ===\n');
  console.log('Kullanıcı Bilgileri:');
  console.log('─'.repeat(50));
  usersData.forEach((u) => {
    console.log(`  ${u.name.padEnd(25)} | Kullanıcı: ${u.email.padEnd(10)} | Şifre: ${u.password}`);
  });
  console.log('─'.repeat(50));
}

resetAndSeed().catch(console.error);
