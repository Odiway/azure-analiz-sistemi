// Wikimedia thumbnail URL'lerini MD5 hash ile doğru hesaplar ve DB günceller.
// Ayrıca Wikipedia Special:Redirect URL'lerini doğrudan upload.wikimedia.org'a çevirir.
const { neon } = require('@neondatabase/serverless');
const crypto = require('crypto');
const fs = require('fs');
const dbUrl = fs.readFileSync('.env', 'utf-8').split('\n').find(l => l.startsWith('DATABASE_URL=')).replace('DATABASE_URL=', '').trim();
const sql = neon(dbUrl);

// Wikimedia thumbnail URL'sini MD5 hash ile hesaplar (KESIN DOĞRU)
function wt(ns, filename, w = 320) {
  const hash = crypto.createHash('md5').update(filename).digest('hex');
  const d1 = hash[0];
  const d12 = hash.substring(0, 2);
  const enc = filename.replace(/'/g,'%27').replace(/,/g,'%2C').replace(/\(/g,'%28').replace(/\)/g,'%29').replace(/ /g,'_').replace(/"/g,'%22');
  return `https://upload.wikimedia.org/wikipedia/${ns}/thumb/${d1}/${d12}/${enc}/${w}px-${enc}`;
}

// Sabit güncellemeler: eski URL → yeni doğru URL
const UPDATES = [
  // ── SANAT ESERLERİ ──
  { from: /Mona_Lisa.*300px/, to: wt('commons','Mona_Lisa,_by_Leonardo_da_Vinci,_from_C2RMF_retouched.jpg',320) },
  { from: /Starry_Night.*300px/, to: wt('commons','Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg',320) },
  { from: /Water_Lilies.*300px/, to: wt('commons','Claude_Monet_-_Water_Lilies_-_1906,_Ryerson.jpg',320) },
  { from: /Edvard_Munch.*300px/, to: wt('commons','Edvard_Munch,_1893,_The_Scream,_oil,_tempera_and_pastel_on_cardboard,_91_x_73_cm,_National_Gallery_of_Norway.jpg',300) },
  { from: /Botticelli.*300px/, to: wt('commons','Sandro_Botticelli_-_La_nascita_di_Venere_-_Google_Art_Project_-_edited.jpg',320) },
  { from: /Pearl_Earring.*300px/, to: wt('commons','1665_Girl_with_a_Pearl_Earring.jpg',300) },
  { from: /Guernica/, to: wt('en','PicassoGuernica.jpg',320) },
  { from: /Persistence_of_Memory/, to: wt('en','The_Persistence_of_Memory.jpg',320) },
  { from: /Rembrandt.*Self-Portrait.*300px/, to: wt('commons','Rembrandt_van_Rijn_-_Self-Portrait_-_Google_Art_Project.jpg',300) },
  { from: /The_Last_Supper.*300px/, to: wt('commons','"The_Last_Supper"_by_Leonardo_da_Vinci.jpg',300) },
  { from: /Demoiselles.*300px/, to: wt('en',"Pablo_Picasso,_1907,_Les_Demoiselles_d'Avignon.jpg",320) },
  { from: /Tsunami_by_hokusai.*300px/, to: wt('commons','Tsunami_by_hokusai_19th_century.jpg',320) },
  { from: /Creation_of_Adam.*300px/, to: wt('commons','Michelangelo_-_Creation_of_Adam_(cropped).jpg',300) },
  // ── YAPILAR ──
  { from: /Colosseo_2020.*320px/, to: wt('commons','Colosseo_2020.jpg',320) },
  { from: /Taj_Mahal.*320px/, to: wt('commons','Taj_Mahal,_Agra,_India_edit3.jpg',320) },
  { from: /Tour_Eiffel.*300px/, to: wt('commons','Tour_Eiffel_Wikimedia_Commons_(cropped).jpg',300) },
  { from: /Parthenon.*320px/, to: wt('commons','The_Parthenon_in_Athens.jpg',320) },
  { from: /Sydney_Australia.*320px/, to: wt('commons','Sydney_Australia._(21753579706).jpg',320) },
  { from: /Machu_Picchu.*320px/, to: wt('commons','Machu_Picchu,_Peru.jpg',320) },
  { from: /Angkor_Wat.*320px/, to: wt('commons','Angkor_Wat_from_the_air.jpg',320) },
  { from: /Moscow_July.*300px/, to: wt('commons','Moscow_July_2011-7a.jpg',300) },
  { from: /Sagrada_Familia.*300px/, to: wt('commons','Sagrada_Familia_01.jpg',300) },
  { from: /Palace_of_Westminster.*300px/, to: wt('commons','Clock_Tower_-_Palace_of_Westminster,_London_-_May_2007.jpg',300) },
  { from: /Statue_of_Liberty_7.*300px/, to: wt('commons','Statue_of_Liberty_7.jpg',300) },
  { from: /Leaning_Tower.*300px/, to: wt('commons','The_Leaning_Tower_of_Pisa_SB.jpeg',300) },
  { from: /Hagia_Sophia.*320px/, to: wt('commons','Hagia_Sophia_Istanbul_2023.jpg',320) },
  // ── TARİHİ PORTRELER & BİLİM ──
  { from: /Albert_Einstein_Head.*300px/, to: wt('commons','Albert_Einstein_Head.jpg',300) },
  { from: /Croce-Mozart.*300px/, to: wt('commons','Croce-Mozart-Detail.jpg',300) },
  { from: /Abraham_Lincoln.*300px/, to: wt('commons','Abraham_Lincoln_O-77_matte_collodion_print.jpg',300) },
  { from: /Karl_Marx_001.*300px/, to: wt('commons','Karl_Marx_001.jpg',300) },
  { from: /Saturn_with_auroras.*320px/, to: wt('commons','Saturn_with_auroras.jpg',320) },
  { from: /OSIRIS_Mars.*320px/, to: wt('commons','OSIRIS_Mars_true_color.jpg',320) },
  { from: /Jupiter.*Great_Red_Spot.*320px/, to: wt('commons','Jupiter_and_its_shrunken_Great_Red_Spot.jpg',320) },
  { from: /Andromeda_Galaxy.*320px/, to: wt('commons','Andromeda_Galaxy_560mm_FL.jpg',320) },
  { from: /Cheetah_at_a_Swedish.*320px/, to: wt('commons','Cheetah_at_a_Swedish_zoo_(cropped).jpg',320) },
  { from: /Ursus_maritimus.*320px/, to: wt('commons','Ursus_maritimus_Polar_bear_with_cub_2.jpg',320) },
  { from: /Okapi2.*320px/, to: wt('commons','Okapi2.jpg',320) },
  { from: /Walrus.*Kamogawa.*320px/, to: wt('commons','Walrus_-_Kamogawa_Seaworld_-_2013-11-17_-_3.jpg',320) },
  // ── Wikipedia Special:Redirect → doğrudan Wikimedia thumbnail ──
  { from: /Special:Redirect\/file\/Bentley_logo\.svg/, to: wt('commons','Bentley_logo.svg',300) },
  { from: /Special:Redirect\/file\/Maserati_logo\.svg/, to: wt('commons','Maserati_logo.svg',300) },
  { from: /Special:Redirect\/file\/Alfa_Romeo_Logo\.png/, to: wt('commons','Alfa_Romeo_Logo.png',300) },
  { from: /Special:Redirect\/file\/Porsche_logo\.svg/, to: wt('commons','Porsche_logo.svg',300) },
  { from: /Special:Redirect\/file\/Subaru_Logo\.svg/, to: wt('commons','Subaru_Logo.svg',300) },
  { from: /Special:Redirect\/file\/Chevrolet_logo\.svg/, to: wt('commons','Chevrolet_logo.svg',300) },
  { from: /Special:Redirect\/file\/Volvo_logo\.svg/, to: wt('commons','Volvo_logo.svg',300) },
  { from: /Special:Redirect\/file\/Hyundai_Motor.*\.svg/, to: wt('commons','Hyundai_Motor_Company_logo.svg',300) },
  { from: /Special:Redirect\/file\/Peugeot_logo\.svg/, to: wt('commons','Peugeot_logo.svg',300) },
  { from: /Special:Redirect\/file\/Tesla_Motors\.svg/, to: wt('commons','Tesla_Motors.svg',300) },
  { from: /Special:Redirect\/file\/Scuderia_Ferrari.*\.svg/, to: wt('commons','Scuderia_Ferrari_Logo.svg',300) },
  { from: /Special:Redirect\/file\/McLaren_Racing.*\.svg/, to: wt('commons','McLaren_Racing_logo.svg',300) },
  { from: /Special:Redirect\/file\/Williams_Racing.*\.svg/, to: wt('commons','Williams_Racing_logo.svg',300) },
  { from: /Special:Redirect\/file\/Apple_logo.*\.svg/, to: wt('commons','Apple_logo_black.svg',300) },
  { from: /Special:Redirect\/file\/Microsoft_logo.*\.svg/, to: wt('commons','Microsoft_logo_(2012).svg',300) },
  { from: /Special:Redirect\/file\/Google_2015.*\.svg/, to: wt('commons','Google_2015_logo.svg',300) },
  { from: /Special:Redirect\/file\/Instagram.*\.svg/, to: wt('commons','Instagram_logo_2022.svg',300) },
  { from: /Special:Redirect\/file\/YouTube_logo.*\.svg/, to: wt('commons','YouTube_logo_2017.svg',300) },
  { from: /Special:Redirect\/file\/Amazon_logo\.svg/, to: wt('commons','Amazon_logo.svg',300) },
  { from: /Special:Redirect\/file\/Nike_logo\.svg/, to: wt('commons','Nike_Logo.svg',300) },
  { from: /Special:Redirect\/file\/Adidas_Logo\.svg/, to: wt('commons','Adidas_Logo.svg',300) },
  { from: /Special:Redirect\/file\/Puma_logo\.svg/, to: wt('commons','Puma_logo.svg',300) },
  { from: /Special:Redirect\/file\/The_Rolling_Stones_Logo\.svg/, to: wt('commons','The_Rolling_Stones_logo.svg',300) },
  { from: /Special:Redirect\/file\/ACDC_logo\.svg/, to: wt('en','ACDC_logo.svg',300) },
  { from: /Special:Redirect\/file\/Iron_Maiden_Logo\.png/, to: wt('en','Iron_Maiden_Logo.png',300) },
  { from: /Special:Redirect\/file\/Nirvana_logo\.svg/, to: wt('commons','Nirvana_logo.svg',300) },
  // Futbol kulüpleri
  { from: /Special:Redirect\/file\/Ajax_Amsterdam\.svg/, to: wt('en','Ajax_Amsterdam.svg',300) },
  { from: /Special:Redirect\/file\/FC_Porto\.svg/, to: wt('en','FC_Porto.svg',300) },
  { from: /Special:Redirect\/file\/SL_Benfica\.svg/, to: wt('en','SL_Benfica.svg',300) },
  { from: /Special:Redirect\/file\/Rangers_FC_logo\.svg/, to: wt('en','Rangers_FC_logo.svg',300) },
  { from: /Special:Redirect\/file\/Celtic_FC_crest\.svg/, to: wt('en','Celtic_FC_crest.svg',300) },
  { from: /Special:Redirect\/file\/AS_Roma.*\.svg/, to: wt('en','AS_Roma_logo_(2017).svg',300) },
  { from: /Special:Redirect\/file\/Olympique_de_Marseille.*\.svg/, to: wt('commons','Olympique_de_Marseille_logo.svg',300) },
  { from: /Special:Redirect\/file\/Club_Atletico_River_Plate\.svg/, to: wt('commons','Club_Atletico_River_Plate.svg',300) },
  { from: /Special:Redirect\/file\/Boca_Juniors.*\.svg/, to: wt('commons','Boca_Juniors_logo18.svg',300) },
  { from: /Special:Redirect\/file\/Fenerbahce_SK\.svg/, to: wt('en','Fenerbahce_SK.svg',300) },
  { from: /Special:Redirect\/file\/RSC_Anderlecht.*\.svg/, to: wt('commons','RSC_Anderlecht_logo.svg',300) },
  { from: /Special:Redirect\/file\/PSV_Eindhoven\.svg/, to: wt('en','PSV_Eindhoven.svg',300) },
  { from: /Special:Redirect\/file\/Clube_de_Regatas.*\.svg/, to: wt('commons','Clube_de_Regatas_do_Flamengo_logo.svg',300) },
  { from: /Special:Redirect\/file\/Malm.*FF\.svg/, to: wt('commons','Malmö_FF.svg',300) },
  { from: /Special:Redirect\/file\/HNK_Hajduk.*\.svg/, to: wt('en','HNK_Hajduk_Split_logo.svg',300) },
];

async function run() {
  // Tüm görselli soruları çek
  const rows = await sql`SELECT id, image_url FROM quiz_questions WHERE image_url IS NOT NULL AND image_url <> '' AND image_url NOT LIKE '%flagcdn.com%' AND image_url NOT LIKE '%cdn.nba.com%'`;
  console.log(`Kontrol edilecek görsel URL sayısı: ${rows.length}`);
  let updated = 0;

  for (const row of rows) {
    const oldUrl = row.image_url;
    let newUrl = oldUrl;

    for (const u of UPDATES) {
      if (u.from.test(oldUrl)) {
        newUrl = u.to;
        break;
      }
    }

    if (newUrl !== oldUrl) {
      await sql`UPDATE quiz_questions SET image_url = ${newUrl} WHERE id = ${row.id}`;
      updated++;
      console.log(`✓ id=${row.id} → ${newUrl.slice(0, 80)}...`);
    }
  }

  console.log(`\nGüncellenen: ${updated}`);
  const src = await sql`
    SELECT
      COUNT(CASE WHEN image_url LIKE '%flagcdn%'        THEN 1 END)::int as flags,
      COUNT(CASE WHEN image_url LIKE '%cdn.nba.com%'    THEN 1 END)::int as nba,
      COUNT(CASE WHEN image_url LIKE '%upload.wikimedia%' THEN 1 END)::int as direct_wiki,
      COUNT(CASE WHEN image_url LIKE '%Special:%'       THEN 1 END)::int as redirects
    FROM quiz_questions WHERE image_url IS NOT NULL AND image_url <> ''
  `;
  console.log('Kaynak dağılımı:', JSON.stringify(src[0]));
  process.exit(0);
}
run().catch(e => { console.error(e); process.exit(1); });
