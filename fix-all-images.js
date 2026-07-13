// Tüm mevcut görsel URL'lerini güvenilir kaynaklara günceller
// Bayraklar: Special:FilePath SVG → flagcdn.com PNG (redirect yok, CORS yok)
// NBA: cdn.nba.com (zaten tamam - sadece doğrular)
// Futbol: Wikipedia redirect → upload.wikimedia.org doğrudan PNG/JPG
const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const dbUrl = fs.readFileSync('.env', 'utf-8').split('\n').find(l => l.startsWith('DATABASE_URL=')).replace('DATABASE_URL=', '').trim();
const sql = neon(dbUrl);

const FLAG_CDN = (code) => `https://flagcdn.com/w320/${code}.png`;

// Bayrak dosya adı → ülke kodu (ISO 3166-1 alpha-2)
const flagMap = {
  'Flag_of_Japan.svg':                         FLAG_CDN('jp'),
  'Flag_of_Turkey.svg':                        FLAG_CDN('tr'),
  'Flag_of_Brazil.svg':                        FLAG_CDN('br'),
  'Flag_of_Canada.svg':                        FLAG_CDN('ca'),
  'Flag_of_Germany.svg':                       FLAG_CDN('de'),
  'Flag_of_France.svg':                        FLAG_CDN('fr'),
  'Flag_of_Italy.svg':                         FLAG_CDN('it'),
  'Flag_of_Spain.svg':                         FLAG_CDN('es'),
  'Flag_of_South_Korea.svg':                   FLAG_CDN('kr'),
  'Flag_of_Greece.svg':                        FLAG_CDN('gr'),
  'Flag_of_Switzerland.svg':                   FLAG_CDN('ch'),
  'Flag_of_the_Netherlands.svg':               FLAG_CDN('nl'),
  'Flag_of_Sweden.svg':                        FLAG_CDN('se'),
  'Flag_of_Norway.svg':                        FLAG_CDN('no'),
  'Flag_of_Argentina.svg':                     FLAG_CDN('ar'),
  'Flag_of_Portugal.svg':                      FLAG_CDN('pt'),
  'Flag_of_India.svg':                         FLAG_CDN('in'),
  'Flag_of_the_United_States.svg':             FLAG_CDN('us'),
  'Flag_of_Mexico.svg':                        FLAG_CDN('mx'),
  'Flag_of_the_United_Kingdom.svg':            FLAG_CDN('gb'),
  'Flag_of_Latvia.svg':                        FLAG_CDN('lv'),
  'Flag_of_Lithuania.svg':                     FLAG_CDN('lt'),
  'Flag_of_Estonia.svg':                       FLAG_CDN('ee'),
  'Flag_of_Croatia.svg':                       FLAG_CDN('hr'),
  'Flag_of_Serbia.svg':                        FLAG_CDN('rs'),
  'Flag_of_Bosnia_and_Herzegovina.svg':        FLAG_CDN('ba'),
  'Flag_of_Slovenia.svg':                      FLAG_CDN('si'),
  'Flag_of_Montenegro.svg':                    FLAG_CDN('me'),
  'Flag_of_Armenia.svg':                       FLAG_CDN('am'),
  'Flag_of_Georgia.svg':                       FLAG_CDN('ge'),
  'Flag_of_Kazakhstan.svg':                    FLAG_CDN('kz'),
  'Flag_of_Mongolia.svg':                      FLAG_CDN('mn'),
  'Flag_of_Myanmar.svg':                       FLAG_CDN('mm'),
  'Flag_of_Sri_Lanka.svg':                     FLAG_CDN('lk'),
  'Flag_of_Paraguay.svg':                      FLAG_CDN('py'),
  'Flag_of_Bolivia.svg':                       FLAG_CDN('bo'),
  'Flag_of_Costa_Rica.svg':                    FLAG_CDN('cr'),
  'Flag_of_Ghana.svg':                         FLAG_CDN('gh'),
  'Flag_of_Senegal.svg':                       FLAG_CDN('sn'),
  'Flag_of_Tunisia.svg':                       FLAG_CDN('tn'),
  'Flag_of_Ethiopia.svg':                      FLAG_CDN('et'),
  'Flag_of_Zambia.svg':                        FLAG_CDN('zm'),
  'Flag_of_Turkmenistan.svg':                  FLAG_CDN('tm'),
  'Flag_of_Belarus.svg':                       FLAG_CDN('by'),
  'Flag_of_Jamaica.svg':                       FLAG_CDN('jm'),
};

async function run() {
  let updated = 0;
  const BASE = 'https://commons.wikimedia.org/wiki/Special:FilePath/';

  for (const [filename, newUrl] of Object.entries(flagMap)) {
    const oldUrl = BASE + filename;
    const r = await sql`UPDATE quiz_questions SET image_url = ${newUrl} WHERE image_url = ${oldUrl}`;
    // neon returns array; count via affected rows
    const rows = await sql`SELECT COUNT(*)::int as c FROM quiz_questions WHERE image_url = ${newUrl}`;
    if (rows[0].c > 0) {
      console.log(`✓ ${filename.replace('Flag_of_','').replace('.svg','')} → flagcdn.com/${newUrl.split('/').pop()}`);
      updated++;
    }
  }

  const stats = await sql`
    SELECT 
      COUNT(*)::int as total_img,
      COUNT(CASE WHEN image_url LIKE '%flagcdn.com%' THEN 1 END)::int as flagcdn,
      COUNT(CASE WHEN image_url LIKE '%cdn.nba.com%' THEN 1 END)::int as nba,
      COUNT(CASE WHEN image_url LIKE '%wikipedia.org%' THEN 1 END)::int as wiki,
      COUNT(CASE WHEN image_url LIKE '%Special:FilePath%' THEN 1 END)::int as old_redirect
    FROM quiz_questions WHERE image_url IS NOT NULL AND image_url <> ''
  `;
  console.log('\n--- URL Kaynak Dağılımı ---');
  console.log(JSON.stringify(stats[0], null, 2));
  process.exit(0);
}

run().catch(e => { console.error(e); process.exit(1); });
