// Zorlu görsel ve müzik soruları – düşünmek gerektiren sorular
const { neon } = require('@neondatabase/serverless');
const crypto = require('crypto');
const fs = require('fs');
const dbUrl = fs.readFileSync('.env', 'utf-8').split('\n').find(l => l.startsWith('DATABASE_URL=')).replace('DATABASE_URL=', '').trim();
const sql = neon(dbUrl);

const F  = (code) => `https://flagcdn.com/w320/${code}.png`;
const WT = (ns, filename, w=300) => {
  const hash = crypto.createHash('md5').update(filename).digest('hex');
  const enc  = filename.replace(/'/g,'%27').replace(/,/g,'%2C').replace(/\(/g,'%28').replace(/\)/g,'%29').replace(/"/g,'%22');
  return `https://upload.wikimedia.org/wikipedia/${ns}/thumb/${hash[0]}/${hash.substring(0,2)}/${enc}/${w}px-${enc}`;
};
const NBA = (id) => `https://cdn.nba.com/logos/nba/${id}/global/L/logo.svg`;

const questions = [

  // ══════════ ÇOK ZOR BAYRAKLAR ══════════
  // Pasifik adaları & mikro devletler
  { q:"Bu bayrak hangi ülkeye aittir?", a:"Tonga",b:"Samoa",c:"Tuvalu",d:"Nauru",e:"Kiribati",
    correct:"D", cat:"Görsel - Bayraklar", img:F("nr") },
  { q:"Bu bayrak hangi ülkeye aittir?", a:"Nauru",b:"Tuvalu",c:"Palau",d:"Mikronezya",e:"Vanuatu",
    correct:"B", cat:"Görsel - Bayraklar", img:F("tv") },
  { q:"Bu bayrak hangi ülkeye aittir?", a:"Solomon Adaları",b:"Vanuatu",c:"Fiji",d:"Papua Yeni Gine",e:"Kiribati",
    correct:"E", cat:"Görsel - Bayraklar", img:F("ki") },
  { q:"Bu bayrak hangi ülkeye aittir?", a:"Papua Yeni Gine",b:"Mikronezya",c:"Marshall Adaları",d:"Nauru",e:"Palau",
    correct:"E", cat:"Görsel - Bayraklar", img:F("pw") },
  { q:"Bu bayrak hangi ülkeye aittir?", a:"Vanuatu",b:"Solomon Adaları",c:"Fiji",d:"Tonga",e:"Samoa",
    correct:"A", cat:"Görsel - Bayraklar", img:F("vu") },
  // Afrika – az bilinen
  { q:"Bu bayrak hangi ülkeye aittir?", a:"Svaziland",b:"Lesoto",c:"Güney Afrika",d:"Botsvana",e:"Namibya",
    correct:"B", cat:"Görsel - Bayraklar", img:F("ls") },
  { q:"Bu bayrak hangi ülkeye aittir?", a:"Lesoto",b:"Mozambik",c:"Esvatini (Svaziland)",d:"Zimbabve",e:"Malavi",
    correct:"C", cat:"Görsel - Bayraklar", img:F("sz") },
  { q:"Bu bayrak hangi ülkeye aittir?", a:"Etiyopya",b:"Eritre",c:"Cibuti",d:"Somali",e:"Kenya",
    correct:"B", cat:"Görsel - Bayraklar", img:F("er") },
  { q:"Bu bayrak hangi ülkeye aittir?", a:"Eritre",b:"Etiyopya",c:"Kenya",d:"Cibuti",e:"Sudan",
    correct:"D", cat:"Görsel - Bayraklar", img:F("dj") },
  { q:"Bu bayrak hangi ülkeye aittir?", a:"São Tomé ve Príncipe",b:"Kamerun",c:"Gabon",d:"Ekvator Ginesi",e:"Kongo",
    correct:"D", cat:"Görsel - Bayraklar", img:F("gq") },
  { q:"Bu bayrak hangi ülkeye aittir?", a:"Ekvator Ginesi",b:"São Tomé ve Príncipe",c:"Kongo",d:"Gabon",e:"Angola",
    correct:"B", cat:"Görsel - Bayraklar", img:F("st") },
  { q:"Bu bayrak hangi ülkeye aittir?", a:"Sudan",b:"Güney Sudan",c:"Eritre",d:"Etiyopya",e:"Nijer",
    correct:"B", cat:"Görsel - Bayraklar", img:F("ss") },
  { q:"Bu bayrak hangi ülkeye aittir?", a:"Madagaskar",b:"Komor Adaları",c:"Seyşeller",d:"Mauritius",e:"Maldivler",
    correct:"B", cat:"Görsel - Bayraklar", img:F("km") },
  // Orta Asya & Arap coğrafyası
  { q:"Bu bayrak hangi ülkeye aittir?", a:"Özbekistan",b:"Tacikistan",c:"Kırgızistan",d:"Afganistan",e:"Pakistan",
    correct:"B", cat:"Görsel - Bayraklar", img:F("tj") },
  { q:"Bu bayrak hangi ülkeye aittir?", a:"Irak",b:"Suriye",c:"Yemen",d:"Libya",e:"Filistin",
    correct:"E", cat:"Görsel - Bayraklar", img:F("ps") },
  { q:"Bu bayrak hangi ülkeye aittir?", a:"Lübnan",b:"Ürdün",c:"Suriye",d:"Irak",e:"Yemen",
    correct:"A", cat:"Görsel - Bayraklar", img:F("lb") },
  { q:"Bu bayrak hangi ülkeye aittir?", a:"Papua Yeni Gine",b:"Zimbabwe",c:"Rwanda",d:"Burundi",e:"Yeni Zelanda",
    correct:"A", cat:"Görsel - Bayraklar", img:F("pg") },

  // ══════════ ZOR MÜZİK SORULARI (NAKILLAR, DERİN KESMELER) ══════════
  // Turkish – verses not chorus, less obvious
  { q:"'Köpüklenmiş denizin kenarında / Durmuş düşünüyorum derin derin...' Bu sözler hangi şarkıya aittir?",
    a:"Denizin Üzerinde",b:"Bir Ömür",c:"Cehennemin Dibi",d:"Mavi Işıklar",e:"Sevgili Tanrım",
    correct:"C", cat:"Müzik" },
  { q:"'Kadehi doldur içelim / Bugün sarhoş olalım...' Bu sözler hangi şarkıya aittir?",
    a:"Meyhanede Bir Gece",b:"İçelim de Unutalım",c:"Aşk Acısı",d:"Sarhoş Olsam",e:"Kadehini Doldur",
    correct:"D", cat:"Müzik" },
  { q:"'Yıllar yılı senden bekledim / Bir gün gelip gideceksin işte böyle...' Bu sözler hangi şarkıya aittir?",
    a:"Bekledim",b:"Hep Sen",c:"Gitme Dur",d:"Öyle Bir Geçer Zaman Ki",e:"Gel Gitme",
    correct:"D", cat:"Müzik" },
  { q:"'Leylim ley, leylim ley / Dağlar taşlar inler...' Bu sözler hangi türkünün nakarat bölümüdür?",
    a:"Oy Benim Sarı Tamburım",b:"Yaylalar",c:"Dağlar Dağlar",d:"Leylim Ley",e:"Uzun İnce Bir Yoldayım",
    correct:"D", cat:"Müzik" },
  { q:"'Uzun ince bir yoldayım / Gidiyorum gündüz gece...' Bu sözler hangi sanatçıya aittir?",
    a:"Musa Eroğlu",b:"Neşet Ertaş",c:"Aşık Veysel",d:"Ali Ekber Çiçek",e:"Aşık Mahzuni Şerif",
    correct:"C", cat:"Müzik" },
  { q:"'Kum saatini izliyorum / Vakit geçmiyor ki...' Bu sözler hangi şarkıya aittir?",
    a:"Bekleyiş",b:"Bir Dakika",c:"Kum Saati",d:"Zaman Dursa",e:"Saat Gibi",
    correct:"C", cat:"Müzik" },
  // International – verses, less famous lines
  { q:"'She's buying a stairway to heaven / When she gets there she knows...' Bu sözler hangi şarkıya aittir?",
    a:"Kashmir",b:"Black Dog",c:"Stairway to Heaven",d:"Whole Lotta Love",e:"Since I've Been Loving You",
    correct:"C", cat:"Müzik" },
  { q:"'I am just a poor boy, though my story's seldom told...' Bu sözler hangi şarkıya aittir?",
    a:"Mrs. Robinson",b:"Sound of Silence",c:"The Boxer",d:"Bridge Over Troubled Water",e:"El Condor Pasa",
    correct:"C", cat:"Müzik" },
  { q:"'On a stormy sea of moving emotion / Tossed about, I'm like a ship on the ocean...' Bu sözler hangi şarkıya aittir?",
    a:"A Whiter Shade of Pale",b:"In the Air Tonight",c:"Stairway to Heaven",d:"Kashmir",e:"Comfortably Numb",
    correct:"A", cat:"Müzik" },
  { q:"'I remember when, I remember, I remember when I lost my mind...' Bu sözler hangi şarkıya aittir?",
    a:"Sour Times",b:"Gnarls Barkley - Crazy",c:"Where Is the Love",d:"Hey Ya",e:"Gold Digger",
    correct:"B", cat:"Müzik" },
  { q:"'Lying in my bed I hear the clock tick and think of you...' Bu sözler hangi şarkıya aittir?",
    a:"Every Breath You Take",b:"Time After Time",c:"Girls Just Want to Have Fun",d:"True Colors",e:"Cyndi Lauper medley",
    correct:"B", cat:"Müzik" },
  { q:"'Just a city boy, born and raised in South Detroit...' Bu sözler hangi şarkıya aittir?",
    a:"Faithfully",b:"Open Arms",c:"Anyway You Want It",d:"Don't Stop Believin'",e:"Lights",
    correct:"D", cat:"Müzik" },
  { q:"'Meet me halfway, across the sky / Out where the butterflies meet the ocean...' Bu sözler hangi şarkıya aittir?",
    a:"Meet Me Halfway",b:"Boom Boom Pow",c:"Imma Be",d:"I Gotta Feeling",e:"Just Can't Get Enough",
    correct:"A", cat:"Müzik" },
  { q:"'They're selling postcards of the hanging / They're painting the passports brown...' Bu sözler hangi şarkıya aittir?",
    a:"Hurricane",b:"Desolation Row",c:"Subterranean Homesick Blues",d:"Like a Rolling Stone",e:"Mr. Tambourine Man",
    correct:"B", cat:"Müzik" },
  { q:"'There's a lady who's sure / All that glitters is gold...' Bu sözler hangi şarkıya aittir?",
    a:"Kashmir",b:"Going to California",c:"Stairway to Heaven",d:"The Battle of Evermore",e:"Over the Hills and Far Away",
    correct:"C", cat:"Müzik" },

  // ══════════ ZOR SANAT SORULARI ══════════
  { q:"Mona Lisa hangi müzede sergilenmektedir?",
    a:"Uffizi Müzesi, Floransa",b:"Louvre Müzesi, Paris",c:"Metropolitan Müzesi, New York",d:"Prado Müzesi, Madrid",e:"British Museum, Londra",
    correct:"B", cat:"Görsel - Sanat",
    img:WT('commons','Mona_Lisa,_by_Leonardo_da_Vinci,_from_C2RMF_retouched.jpg') },
  { q:"\"Yıldızlı Gece\" hangi müzede sergilenmektedir?",
    a:"Louvre, Paris",b:"Tate Modern, Londra",c:"MoMA, New York",d:"Guggenheim, Bilbao",e:"Uffizi, Floransa",
    correct:"C", cat:"Görsel - Sanat",
    img:WT('commons','Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg') },
  { q:"Bu tablo hangi müzede bulunmaktadır?",
    a:"Louvre, Paris",b:"Ulusal Müze, Oslo",c:"Städel, Frankfurt",d:"Tate Britain, Londra",e:"Rijksmuseum, Amsterdam",
    correct:"B", cat:"Görsel - Sanat",
    img:WT('commons','Edvard_Munch,_1893,_The_Scream,_oil,_tempera_and_pastel_on_cardboard,_91_x_73_cm,_National_Gallery_of_Norway.jpg',300) },
  { q:"\"İnci Küpeli Kız\" tablosu hangi müzede sergilenmektedir?",
    a:"Rijksmuseum, Amsterdam",b:"Louvre, Paris",c:"Mauritshuis, Lahey",d:"Hermitage, St. Petersburg",e:"Prado, Madrid",
    correct:"C", cat:"Görsel - Sanat",
    img:WT('commons','1665_Girl_with_a_Pearl_Earring.jpg') },
  { q:"Bu tablo yaklaşık hangi yüzyılda yapılmıştır?",
    a:"14. yüzyıl",b:"15. yüzyıl",c:"16. yüzyıl",d:"17. yüzyıl",e:"18. yüzyıl",
    correct:"D", cat:"Görsel - Sanat",
    img:WT('commons','1665_Girl_with_a_Pearl_Earring.jpg') },
  { q:"Sistine Şapeli'ndeki \"Âdem'in Yaratılışı\" freski hangi yapıda yer almaktadır?",
    a:"Vatikan Müzeleri",b:"Floransa Katedrali",c:"St. Peter Bazilikası",d:"Pantheon",e:"Colosseum",
    correct:"A", cat:"Görsel - Sanat",
    img:WT('commons','Michelangelo_-_Creation_of_Adam_(cropped).jpg') },
  { q:"\"Büyük Dalga\" eseri hangi teknikle yapılmıştır?",
    a:"Yağlı boya",b:"Fresk",c:"Ahşap baskı (Ukiyo-e)",d:"Sulu boya",e:"Gravür",
    correct:"C", cat:"Görsel - Sanat",
    img:WT('commons','Tsunami_by_hokusai_19th_century.jpg') },

  // ══════════ ZOR YAPI SORULARI ══════════
  { q:"Angkor Wat tapınağı hangi dine adanmıştır?",
    a:"Budizm",b:"Hinduizm",c:"İslam",d:"Taoizm",e:"Şintoizm",
    correct:"B", cat:"Görsel - Yapılar",
    img:WT('commons','Angkor_Wat_from_the_air.jpg') },
  { q:"Sagrada Familia'nın mimarı kimdir?",
    a:"Santiago Calatrava",b:"Rafael Moneo",c:"Antoni Gaudí",d:"Zaha Hadid",e:"Renzo Piano",
    correct:"C", cat:"Görsel - Yapılar",
    img:WT('commons','Sagrada_Familia_01.jpg') },
  { q:"Machu Picchu hangi medeniyete aittir?",
    a:"Maya",b:"Aztek",c:"İnka",d:"Olmek",e:"Çiçimek",
    correct:"C", cat:"Görsel - Yapılar",
    img:WT('commons','Machu_Picchu,_Peru.jpg') },
  { q:"Colosseum'un gerçek adı nedir?",
    a:"Circus Maximus",b:"Forum Romanum",c:"Flavian Amfitiyatrosu",d:"Pantheon",e:"Trajan Sütunu",
    correct:"C", cat:"Görsel - Yapılar",
    img:WT('commons','Colosseo_2020.jpg') },
  { q:"Tac Mahal kim için inşa ettirilmiştir?",
    a:"Nefertiti",b:"Mumtaz Mahal",c:"Razia Sultan",d:"Sita",e:"Padmavati",
    correct:"B", cat:"Görsel - Yapılar",
    img:WT('commons','Taj_Mahal,_Agra,_India_edit3.jpg') },
  { q:"Bu yapının mimarı kimdir?",
    a:"Gustave Eiffel",b:"Haussmann",c:"Le Corbusier",d:"Renzo Piano",e:"Richard Rogers",
    correct:"A", cat:"Görsel - Yapılar",
    img:WT('commons','Tour_Eiffel_Wikimedia_Commons_(cropped).jpg') },
  { q:"St. Basil Katedrali hangi şehirdedir ve hangi dönemde inşa edilmiştir?",
    a:"St. Petersburg, 18. yy",b:"Moskova, 16. yy",c:"Moskova, 19. yy",d:"Kiev, 17. yy",e:"Kazan, 15. yy",
    correct:"B", cat:"Görsel - Yapılar",
    img:WT('commons','Moscow_July_2011-7a.jpg') },

  // ══════════ ZOR UZAY SORULARI ══════════
  { q:"Jüpiter'deki \"Büyük Kırmızı Leke\" nedir?",
    a:"Volkanik patlama izi",b:"Etkin bir fırtına/kasırga",c:"Demir oksit bölgesi",d:"Asteroit çarpma krateri",e:"Buzul bölgesi",
    correct:"B", cat:"Görsel - Bilim",
    img:WT('commons','Jupiter_and_its_shrunken_Great_Red_Spot.jpg') },
  { q:"Satürn'ün halkalarının büyük çoğunluğu neden oluşmaktadır?",
    a:"Demir tozu",b:"Metan buzu",c:"Su buzu ve kaya parçaları",d:"Helyum gazı",e:"Silikat minaralleri",
    correct:"C", cat:"Görsel - Bilim",
    img:WT('commons','Saturn_with_auroras.jpg') },
  { q:"Andromeda Galaksisi Samanyolu'na yaklaşık kaç ışık yılı uzaktadır?",
    a:"250.000",b:"2.5 milyon",c:"25 milyon",d:"250 milyon",e:"2.5 milyar",
    correct:"B", cat:"Görsel - Bilim",
    img:WT('commons','Andromeda_Galaxy_560mm_FL.jpg') },

  // ══════════ ZOR HAYVAN SORULARI ══════════
  { q:"Okapi en yakın hangi hayvanla akrabadır?",
    a:"At",b:"Geyik",c:"Zürafa",d:"Antiilop",e:"Tapir",
    correct:"C", cat:"Görsel - Doğa",
    img:WT('commons','Okapi2.jpg') },
  { q:"Çita ile leoparı birbirinden ayıran en belirgin özellik nedir?",
    a:"Kulak şekli",b:"Göz altındaki siyah çizgiler",c:"Kuyruk uzunluğu",d:"Renk tonu",e:"Boyut",
    correct:"B", cat:"Görsel - Doğa",
    img:WT('commons','Cheetah_at_a_Swedish_zoo_(cropped).jpg') },
];

const LETTERS = ['A','B','C','D','E'];
function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function run() {
  console.log(`Yüklenecek zor soru: ${questions.length}`);
  let inserted = 0, skipped = 0, ti = 0;

  for (const item of questions) {
    const raw = [
      { L:'A', t: item.a }, { L:'B', t: item.b }, { L:'C', t: item.c },
      { L:'D', t: item.d }, { L:'E', t: item.e },
    ].filter(o => o.t);

    const n = raw.length;
    const correct = raw.find(o => o.L === item.correct);
    if (!correct) { console.warn('Cevap yok, atlandı'); continue; }

    const others = shuffle(raw.filter(o => o.L !== item.correct).map(o => o.t));
    const pos = ti % n;
    const finals = [];
    let oi = 0;
    for (let p = 0; p < n; p++) finals.push(p === pos ? correct.t : others[oi++]);

    const [oa, ob, oc, od, oe] = finals;
    const newCorrect = LETTERS[pos];

    const ex = await sql`SELECT id FROM quiz_questions WHERE question = ${item.q} AND option_a = ${oa} LIMIT 1`;
    if (ex.length > 0) { skipped++; continue; }

    await sql`
      INSERT INTO quiz_questions (question, option_a, option_b, option_c, option_d, option_e, image_url, correct_option, category)
      VALUES (${item.q}, ${oa}, ${ob}, ${oc}, ${od}, ${oe || null}, ${item.img || null}, ${newCorrect}, ${item.cat})
    `;
    ti++; inserted++;
  }

  const total = await sql`SELECT COUNT(*)::int as t FROM quiz_questions`;
  const imgs  = await sql`SELECT COUNT(*)::int as t FROM quiz_questions WHERE image_url IS NOT NULL AND image_url <> ''`;
  console.log(`\nEklendi: ${inserted} | Atlandı: ${skipped}`);
  console.log(`Toplam: ${total[0].t} | Görselli: ${imgs[0].t}`);
  process.exit(0);
}
run().catch(e => { console.error(e); process.exit(1); });
