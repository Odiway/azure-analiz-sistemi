const { neon } = require('@neondatabase/serverless');
const XLSX = require('xlsx');
const path = require('path');

async function seedWorkItems() {
  const sql = neon(
    process.env.DATABASE_URL ||
      'postgresql://neondb_owner:npg_iMEkhCxw2t1e@ep-small-boat-alvqfb02-pooler.c-3.eu-central-1.aws.neon.tech/neondb?sslmode=require'
  );

  console.log('İş takip tabloları oluşturuluyor...');

  await sql`DROP TABLE IF EXISTS work_logs CASCADE`;
  await sql`DROP TABLE IF EXISTS work_items CASCADE`;

  await sql`CREATE TABLE work_items (
    id SERIAL PRIMARY KEY,
    project_code VARCHAR(20) NOT NULL,
    project_name VARCHAR(255) NOT NULL,
    task_name VARCHAR(500) NOT NULL,
    assigned_to VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Başlanmadı',
    priority VARCHAR(20) NOT NULL DEFAULT 'Orta',
    category VARCHAR(100),
    start_date DATE,
    target_date DATE,
    completed_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
  )`;

  await sql`CREATE TABLE work_logs (
    id SERIAL PRIMARY KEY,
    work_item_id INTEGER NOT NULL REFERENCES work_items(id) ON DELETE CASCADE,
    user_name VARCHAR(100) NOT NULL,
    hours DECIMAL(5,1) NOT NULL DEFAULT 0,
    log_date DATE NOT NULL DEFAULT CURRENT_DATE,
    week_number INTEGER NOT NULL,
    year INTEGER NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
  )`;

  await sql`CREATE INDEX idx_work_items_assigned ON work_items(assigned_to)`;
  await sql`CREATE INDEX idx_work_items_status ON work_items(status)`;
  await sql`CREATE INDEX idx_work_items_project ON work_items(project_code)`;
  await sql`CREATE INDEX idx_work_logs_item ON work_logs(work_item_id)`;
  await sql`CREATE INDEX idx_work_logs_date ON work_logs(log_date)`;
  await sql`CREATE INDEX idx_work_logs_user ON work_logs(user_name)`;
  await sql`CREATE INDEX idx_work_logs_week ON work_logs(year, week_number)`;

  console.log('Tablolar oluşturuldu. Excel verileri okunuyor...');

  // Read Excel
  const filePath = path.join(__dirname, 'CAE_İş_Planı_V02.xlsx');
  const wb = XLSX.readFile(filePath);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

  // Row 2 has week start dates as serial numbers (columns 5+)
  const weekStartDates = data[2].slice(5);
  const weekEndDates = data[3].slice(5);

  // Convert Excel serial to JS Date
  function excelDateToJS(serial) {
    if (!serial || typeof serial !== 'number') return null;
    const epoch = new Date(1899, 11, 30);
    return new Date(epoch.getTime() + serial * 86400000);
  }

  // Get ISO week number
  function getWeekNumber(d) {
    const date = new Date(d.getTime());
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7));
    const week1 = new Date(date.getFullYear(), 0, 4);
    return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
  }

  // Person name mapping (Excel short name -> first name for assigned_to)
  const nameMap = {
    'Kıvanç': 'Kıvanç',
    'Taşkın': 'Taşkın',
    'Burak': 'Burak',
    'Coşkun': 'Coşkun',
    'Sertan': 'Sertan',
    'Mustafa': 'Mustafa',
    'Oğuzhan': 'Oğuzhan',
    'BIAS': 'BIAS',
    'TEMPA': 'TEMPA',
    'ERER': 'ERER',
    '-': 'Atanmamış',
  };

  let itemCount = 0;
  let logCount = 0;

  for (let i = 4; i < data.length; i++) {
    const row = data[i];
    const projectCode = (row[0] || '').toString().trim();
    const projectName = (row[1] || '').toString().trim();
    const taskName = (row[2] || '').toString().trim();
    const assignedTo = nameMap[row[3]] || (row[3] || 'Atanmamış').toString().trim();
    let status = (row[4] || 'Başlanmadı').toString().trim();

    if (!projectCode && !taskName) continue;

    // Normalize status
    if (status === '-') status = 'Başlanmadı';
    if (status === 'SAT') status = 'Tamamlandı';

    // Determine priority based on status and deadlines
    let priority = 'Orta';
    if (status === 'Devam Ediyor') priority = 'Yüksek';
    if (status === 'Tamamlandı') priority = 'Düşük';
    if (status === 'Data Bekleniyor') priority = 'Orta';

    // Find first and last non-empty week columns for start/target dates
    let startDate = null;
    let targetDate = null;
    const weeklyData = row.slice(5);

    for (let w = 0; w < weeklyData.length; w++) {
      if (weeklyData[w] !== '' && weeklyData[w] !== null && weeklyData[w] !== undefined) {
        const sd = excelDateToJS(weekStartDates[w]);
        const ed = excelDateToJS(weekEndDates[w]);
        if (sd && !startDate) startDate = sd;
        if (ed) targetDate = ed;
      }
    }

    // If completed, set completed_date = target_date
    const completedDate = status === 'Tamamlandı' ? targetDate : null;

    // Determine category from task name
    let category = 'Genel';
    const tn = taskName.toLowerCase();
    if (tn.includes('aero') || tn.includes('cfd') || tn.includes('termal') || tn.includes('defroster') || tn.includes('hvac')) category = 'Aerodinamik/Termal';
    else if (tn.includes('r66') || tn.includes('r29') || tn.includes('r93') || tn.includes('r100') || tn.includes('fmvss') || tn.includes('rollover')) category = 'Regülasyon';
    else if (tn.includes('şasi') || tn.includes('chassis') || tn.includes('chasis')) category = 'Şasi';
    else if (tn.includes('modal') || tn.includes('nvh') || tn.includes('korelasyon')) category = 'NVH/Modal';
    else if (tn.includes('fatigue') || tn.includes('yorulma')) category = 'Yorulma';
    else if (tn.includes('komponent') || tn.includes('braket') || tn.includes('bracket')) category = 'Komponent';
    else if (tn.includes('model') || tn.includes('fem') || tn.includes('cad')) category = 'Modelleme';
    else if (tn.includes('süreç') || tn.includes('is süreçleri')) category = 'Süreç';
    else if (tn.includes('dijital') || tn.includes('it') || tn.includes('db') || tn.includes('server') || tn.includes('fleet') || tn.includes('emission') || tn.includes('otomasyon')) category = 'Dijitalizasyon';
    else if (tn.includes('sunum') || tn.includes('makale') || tn.includes('doküman')) category = 'Dokümantasyon';
    else if (tn.includes('bütçe') || tn.includes('lisans')) category = 'Yönetim';

    const startStr = startDate ? startDate.toISOString().split('T')[0] : null;
    const targetStr = targetDate ? targetDate.toISOString().split('T')[0] : null;
    const completedStr = completedDate ? completedDate.toISOString().split('T')[0] : null;

    const result = await sql`INSERT INTO work_items 
      (project_code, project_name, task_name, assigned_to, status, priority, category, start_date, target_date, completed_date)
      VALUES (${projectCode}, ${projectName}, ${taskName}, ${assignedTo}, ${status}, ${priority}, ${category}, ${startStr}, ${targetStr}, ${completedStr})
      RETURNING id`;

    const workItemId = result[0].id;
    itemCount++;

    // Insert work logs for weeks with numeric hours
    for (let w = 0; w < weeklyData.length; w++) {
      const val = weeklyData[w];
      if (typeof val === 'number' && val > 0) {
        const weekDate = excelDateToJS(weekStartDates[w]);
        if (weekDate) {
          const wn = getWeekNumber(weekDate);
          const yr = weekDate.getFullYear();
          const dateStr = weekDate.toISOString().split('T')[0];
          await sql`INSERT INTO work_logs (work_item_id, user_name, hours, log_date, week_number, year, description)
            VALUES (${workItemId}, ${assignedTo}, ${val}, ${dateStr}, ${wn}, ${yr}, ${'Excel import'})`;
          logCount++;
        }
      }
    }

    console.log(`  [${itemCount}] ${projectCode} | ${taskName} | ${assignedTo} | ${status}`);
  }

  console.log('\n=== İş Takip Verileri Başarıyla Yüklendi! ===');
  console.log(`Toplam ${itemCount} iş kalemi ve ${logCount} çalışma kaydı oluşturuldu.`);
}

seedWorkItems().catch(console.error);
