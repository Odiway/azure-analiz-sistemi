const { neon } = require('@neondatabase/serverless');
const bcrypt = require('bcryptjs');

async function seedAdmin() {
  const sql = neon(process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_iMEkhCxw2t1e@ep-small-boat-alvqfb02-pooler.c-3.eu-central-1.aws.neon.tech/neondb?sslmode=require');
  const hash = await bcrypt.hash('admin123', 12);
  
  await sql`INSERT INTO users (name, email, password_hash, department, role) 
    VALUES ('Admin', 'admin', ${hash}, 'Yönetim', 'admin') 
    ON CONFLICT (email) DO UPDATE SET role = 'admin', password_hash = ${hash}`;
  
  console.log('Admin user created/updated successfully');
}

seedAdmin().catch(console.error);
