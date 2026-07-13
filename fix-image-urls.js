// Spor logo URL'lerini güvenilir kaynaklara günceller:
// NBA → cdn.nba.com (resmi NBA CDN, kesin çalışır)
// Futbol → en.wikipedia.org/wiki/Special:Redirect/file/ (Wikipedia + Commons arar)
const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const dbUrl = fs.readFileSync('.env', 'utf-8').split('\n').find(l => l.startsWith('DATABASE_URL=')).replace('DATABASE_URL=', '').trim();
const sql = neon(dbUrl);

const WP = (f) => `https://en.wikipedia.org/wiki/Special:Redirect/file/${f}`;
const NBA = (id) => `https://cdn.nba.com/logos/nba/${id}/global/L/logo.svg`;

// NBA takım ID'leri (resmi NBA CDN)
const nbaMap = {
  'Chicago_Bulls_logo.svg':          NBA(1610612741),
  'Miami_Heat.svg':                   NBA(1610612748),
  'Oklahoma_City_Thunder.svg':        NBA(1610612760),
  'Denver_Nuggets.svg':               NBA(1610612743),
  'Milwaukee_Bucks.svg':              NBA(1610612749),
  'Houston_Rockets.svg':              NBA(1610612745),
  'Memphis_Grizzlies.svg':            NBA(1610612763),
  'Portland_Trail_Blazers_logo.svg':  NBA(1610612757),
  'Toronto_Raptors_logo.svg':         NBA(1610612761),
  'Minnesota_Timberwolves.svg':       NBA(1610612750),
  'Indiana_Pacers.svg':               NBA(1610612754),
  'New_Orleans_Pelicans.svg':         NBA(1610612740),
  'Sacramento_Kings.svg':             NBA(1610612758),
  'Brooklyn_Nets.svg':                NBA(1610612751),
  'Utah_Jazz_logo.svg':               NBA(1610612762),
};

// Futbol kulübü logo dosya adları → Wikipedia Special:Redirect
const footballMap = {
  'AFC_Ajax.svg':                             WP('Ajax_Amsterdam.svg'),
  'FC_Porto.svg':                             WP('FC_Porto.svg'),
  'SL_Benfica.svg':                           WP('SL_Benfica.svg'),
  'Rangers_FC_logo.svg':                      WP('Rangers_FC_logo.svg'),
  'Celtic_FC.svg':                            WP('Celtic_FC_crest.svg'),
  'AS_Roma_logo_(2017).svg':                  WP('AS_Roma_logo_(2017).svg'),
  'Olympique_de_Marseille_logo.svg':          WP('Olympique_de_Marseille_logo.svg'),
  'Club_Atletico_River_Plate.svg':            WP('Club_Atletico_River_Plate.svg'),
  'Boca_Juniors_logo18.svg':                  WP('Boca_Juniors_logo18.svg'),
  'Fenerbahce_SK.svg':                        WP('Fenerbahce_SK.svg'),
  'RSC_Anderlecht.svg':                       WP('RSC_Anderlecht_logo.svg'),
  'PSV_Eindhoven.svg':                        WP('PSV_Eindhoven.svg'),
  'Clube_de_Regatas_do_Flamengo_logo.svg':    WP('Clube_de_Regatas_do_Flamengo_logo.svg'),
  'Malm\u00f6_FF.svg':                        WP('Malm\u00f6_FF.svg'),
  'HNK_Hajduk_Split_logo.svg':               WP('HNK_Hajduk_Split_logo.svg'),
};

async function run() {
  let updated = 0;

  // NBA güncellemeleri
  for (const [filename, newUrl] of Object.entries(nbaMap)) {
    const oldUrl = `https://commons.wikimedia.org/wiki/Special:FilePath/${filename}`;
    const res = await sql`UPDATE quiz_questions SET image_url = ${newUrl} WHERE image_url = ${oldUrl}`;
    if (res.count > 0) { console.log(`NBA ✓ ${filename.replace('.svg','')}`); updated += res.count; }
  }

  // Futbol güncellemeleri
  for (const [filename, newUrl] of Object.entries(footballMap)) {
    const oldUrl = `https://commons.wikimedia.org/wiki/Special:FilePath/${filename}`;
    const res = await sql`UPDATE quiz_questions SET image_url = ${newUrl} WHERE image_url = ${oldUrl}`;
    if (res.count > 0) { console.log(`Futbol ✓ ${filename.replace('.svg','').replace('.png','')}`); updated += res.count; }
  }

  console.log(`\nGüncellenen satır: ${updated}`);

  // Doğrulama
  const sports = await sql`SELECT id, image_url FROM quiz_questions WHERE category = 'Görsel - Spor' ORDER BY id`;
  console.log('\nGörsel - Spor URL kontrol:');
  for (const r of sports) console.log(' ', r.id, r.image_url.substring(0, 80));
  process.exit(0);
}

run().catch(e => { console.error(e); process.exit(1); });
