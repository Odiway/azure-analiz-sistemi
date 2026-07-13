// Her soruya E şıkkı ekler (kategori bazlı distractor havuzundan)
const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const dbUrl = fs.readFileSync('.env', 'utf-8').split('\n').find(l => l.startsWith('DATABASE_URL=')).replace('DATABASE_URL=', '').trim();
const sql = neon(dbUrl);

const POOLS = {
  'Genel Kültür': [
    'İsviçre', 'Norveç', 'Danimarka', 'Portekiz', 'Belçika', 'Hollanda', 'Avusturya',
    'Yeni Zelanda', 'Singapur', 'Malezya', 'Tayland', 'Vietnam', 'Filipinler',
    'Napolyon', 'Kleopatra', 'Sezar', 'Churchill', 'Gandhi', 'Mandela', 'Lincoln',
    'Stockholm', 'Kopenhag', 'Amsterdam', 'Brüksel', 'Viyana', 'Lizbon', 'Varsova',
    '1776', '1848', '1917', '1968', '2004', '2008', '2016',
    '42', '77', '88', '99', '108', '128', '256', '512', '1024',
    'Leonardo da Vinci', 'Michelangelo', 'Galileo', 'Copernicus', 'Kepler',
    'Himalayalar', 'Andes', 'Alpler', 'Karpatlar', 'Atlas Dağları', 'Kafkaslar',
    'Amazon', 'Missisipi', 'Volga', 'Yangtze', 'Mekong', 'Ob', 'İndus',
    'İspanya', 'Polonya', 'Romanya', 'Çek Cumhuriyeti', 'Macaristan', 'Slovakya',
    'Lima', 'Bogota', 'Caracas', 'Buenos Aires', 'Santiago', 'La Paz', 'Quito',
  ],
  'Bilim & Teknoloji': [
    'Helyum', 'Neon', 'Argon', 'Kripton', 'Ksenon', 'Radon', 'Oganesson',
    'Titanyum', 'Vanadyum', 'Krom', 'Mangan', 'Kobalt', 'Nikel', 'Germanyum',
    'Merkür', 'Venüs', 'Mars', 'Jüpiter', 'Satürn', 'Uranüs', 'Neptün',
    'Röntgen', 'Marie Curie', 'Faraday', 'Pasteur', 'Tesla', 'Edison', 'Bohr',
    'Metre', 'Kilogram', 'Saniye', 'Amper', 'Kelvin', 'Mol', 'Kandela',
    'Python', 'Java', 'Rust', 'Swift', 'Kotlin', 'Go', 'Haskell',
    'RNA', 'ATP', 'ADP', 'DNA', 'mRNA', 'rRNA', 'tRNA',
    'Mitokondri', 'Ribozom', 'Golgi', 'Lizozom', 'Sentrozom', 'Kloroplast',
    'Graviton', 'Foton', 'Elektron', 'Proton', 'Nötron', 'Muon', 'Tau',
    'Kuark', 'Gluon', 'Bozon', 'Higgs', 'Fermion', 'Lepton',
    'Silikon', 'Germanyum', 'Galyum', 'İndiyum', 'Kadmiyum', 'Toryum',
  ],
  'Tarih': [
    '1066', '1215', '1347', '1492', '1517', '1588', '1618', '1683', '1776',
    '1789', '1815', '1848', '1861', '1871', '1905', '1914', '1929', '1933',
    'Napolyon', 'Bismarck', 'Cromwell', 'Robespierre', 'Talleyrand', 'Metternich',
    'Cengiz Han', 'Timur', 'Hülegü', 'Batu Han', 'Ögedey', 'Kubilay',
    'Waterloo', 'Trafalgar', 'Austerlitz', 'Sedan', 'Somme', 'Verdun', 'Midway',
    'Osmanlı İmparatorluğu', 'Bizans İmparatorluğu', 'Roma İmparatorluğu', 'Selçuklu',
    'Habsburg', 'Hohenzollern', 'Romanov', 'Bourbon', 'Tudor', 'Stuart',
    'Viyana', 'Berlin', 'Paris', 'Londra', 'Madrid', 'Lizbon', 'Varşova',
    'I. Dünya Savaşı', 'II. Dünya Savaşı', 'Soğuk Savaş', 'Kore Savaşı', 'Vietnam Savaşı',
  ],
  'Coğrafya': [
    'Amazon', 'Nil', 'Missisipi', 'Volga', 'Yangtze', 'Mekong', 'Ob', 'İndus',
    'Andes', 'Himalayalar', 'Alpler', 'Karpatlar', 'Kafkaslar', 'Atlas Dağları',
    'Arjantin', 'Şili', 'Peru', 'Kolombiya', 'Venezuela', 'Ekvador', 'Bolivya', 'Uruguay',
    'Norveç', 'İsveç', 'Finlandiya', 'Danimarka', 'İzlanda', 'İrlanda', 'Estonya',
    'Cezayir', 'Libya', 'Etiyopya', 'Tanzanya', 'Mozambik', 'Madagaskar', 'Zimbabwe',
    'Buenos Aires', 'Lima', 'Bogota', 'Lagos', 'Kinşasa', 'Kahire', 'Nairobi', 'Addis Ababa',
    'Kongo', 'Zambezi', 'Limpopo', 'Niger', 'Senegal', 'Volta', 'Benue',
    'Adriyatik', 'Ege', 'Karadeniz', 'Hazar', 'Kızıl Deniz', 'Arap Denizi', 'Mercan Denizi',
    'Grönland', 'Borneo', 'Madagaskar', 'Honshu', 'Sumatra', 'Sulawesi',
  ],
  'Spor': [
    'Arjantin', 'Hollanda', 'Portekiz', 'Belçika', 'Uruguay', 'Çek Cumhuriyeti', 'Hırvatistan',
    'Ronaldo', 'Messi', 'Neymar', 'Mbappé', 'Salah', 'Lewandowski', 'Haaland', 'Kane',
    'Serena Williams', 'Federer', 'Nadal', 'Djokovic', 'Murray', 'Medvedev',
    'Bolt', 'Johnson', 'Lewis', 'Bailey', 'Powell', 'Gay', 'Blake',
    'Real Madrid', 'Barcelona', 'Juventus', 'PSG', 'Chelsea', 'Arsenal', 'Dortmund',
    'NBA', 'NFL', 'NHL', 'MLB', 'ATP', 'WTA', 'UCI',
    'Maraton', 'Triatlon', 'Pentatlon', 'Dekatlon', 'Biatlon', 'Tekvando', 'Capoeira',
    'Sürüş', 'Yelken', 'Kürek', 'Kano', 'Yüzme', 'Dalış', 'Su Topu',
  ],
  'Matematik & Mantık': [
    '3.14159', '2.71828', '1.41421', '1.73205', '1.61803', '0.57721', '2.30258',
    '7', '11', '13', '17', '19', '23', '29', '31', '37', '41', '43', '47',
    '100', '121', '144', '169', '196', '225', '256', '289', '324', '361', '400',
    'Öklid', 'Pisagor', 'Arşimet', 'Fermat', 'Pascal', 'Gauss', 'Euler', 'Riemann',
    'Üçgen', 'Dörtgen', 'Beşgen', 'Altıgen', 'Yedigen', 'Sekizgen', 'Ongen',
    'Toplama', 'Çıkarma', 'Çarpma', 'Bölme', 'Üs alma', 'Köklü ifade', 'Logaritma',
    'Sınır', 'Türev', 'İntegral', 'Diferansiyel', 'Matris', 'Determinant', 'Vektör',
  ],
  'Mühendislik': [
    'Alüminyum', 'Titanyum', 'Çelik', 'Dökme Demir', 'Paslanmaz Çelik', 'Bakır', 'Pirinç',
    'Pascal', 'Newton', 'Joule', 'Watt', 'Amper', 'Volt', 'Ohm', 'Farad',
    'Kesme Gerilmesi', 'Basınç', 'Çekme Mukavemeti', 'Eğilme Momentı', 'Burulma', 'Yorulma',
    'Hidrolik', 'Pnömatik', 'Elektrik', 'Elektronik', 'Mekanik', 'Termal', 'Kimyasal',
    'CAD', 'CAM', 'FEM', 'CFD', 'BIM', 'CNC', 'PLC',
    'ISO', 'ASTM', 'DIN', 'JIS', 'EN', 'ANSI', 'API',
    'Tork', 'Güç', 'Enerji', 'Verim', 'Momentum', 'İvme', 'Hız',
  ],
  'Araç Bilgisi': [
    'Toyota', 'Honda', 'Ford', 'Chevrolet', 'BMW', 'Mercedes', 'Audi', 'Volkswagen',
    'Turbo', 'Kompresör', 'Dizel', 'Benzin', 'Hibrit', 'Elektrik', 'LPG',
    'ABS', 'ESP', 'TCS', 'EBD', 'BAS', 'ASR', 'LKA',
    'Kardan', 'Diferansiyel', 'Transmisyon', 'Debriyaj', 'Amortisör', 'Triger',
    'Subap', 'Piston', 'Krank Mili', 'Kam Mili', 'Egzoz Manifoldu', 'Katalitik Konvertör',
    'Lastik', 'Jant', 'Balata', 'Disk', 'Kaliper', 'Yay', 'Spiral Yay',
    'Porsche', 'Ferrari', 'Lamborghini', 'Maserati', 'Bugatti', 'Rolls-Royce', 'Bentley',
  ],
  'Teknoloji': [
    'Python', 'Java', 'C++', 'Rust', 'Swift', 'Kotlin', 'Go', 'Haskell', 'Scala',
    'HTTP', 'HTTPS', 'FTP', 'SMTP', 'DNS', 'DHCP', 'SSH', 'TLS', 'UDP',
    'RAM', 'ROM', 'SSD', 'HDD', 'GPU', 'CPU', 'NPU', 'FPGA', 'ASIC',
    'Linux', 'Windows', 'macOS', 'Android', 'iOS', 'ChromeOS', 'FreeBSD',
    'MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'Cassandra', 'Oracle', 'SQLite',
    'React', 'Angular', 'Vue', 'Svelte', 'Next.js', 'Nuxt', 'Remix',
    'AWS', 'Azure', 'Google Cloud', 'Oracle Cloud', 'IBM Cloud', 'Heroku', 'Vercel',
    'Docker', 'Kubernetes', 'Terraform', 'Ansible', 'Jenkins', 'GitLab', 'GitHub',
  ],
  'Futbol': [
    'Arjantin', 'Hollanda', 'Portekiz', 'Belçika', 'Uruguay', 'Hırvatistan', 'Danimarka',
    'Ronaldo', 'Messi', 'Neymar', 'Mbappé', 'Haaland', 'Kane', 'Bellingham', 'Vinicius',
    'Real Madrid', 'Barcelona', 'Juventus', 'PSG', 'Chelsea', 'Arsenal', 'Dortmund',
    'Serie A', 'Bundesliga', 'Ligue 1', 'Süper Lig', 'Eredivisie', 'Primeira Liga',
    'Stamford Bridge', 'Camp Nou', 'Allianz Arena', 'Anfield', 'Signal Iduna Park',
    'Pelé', 'Maradona', 'Cruyff', 'Beckenbauer', 'Platini', 'Zidane', 'Ronaldinho',
    'Offside', 'Penaltı', 'Serbest Vuruş', 'Köşe Vuruşu', 'Taç', 'Faul', 'Sarı Kart',
  ],
  'Sanat & Edebiyat': [
    'Shakespeare', 'Tolstoy', 'Dostoyevski', 'Kafka', 'Hemingway', 'Faulkner', 'Márquez',
    'Monet', 'Van Gogh', 'Picasso', 'Dali', 'Rembrandt', 'Vermeer', 'Turner', 'Caravaggio',
    'Mozart', 'Beethoven', 'Bach', 'Chopin', 'Debussy', 'Brahms', 'Schubert', 'Liszt',
    'Hamlet', 'Faust', 'Don Kişot', 'Savaş ve Barış', 'Suç ve Ceza', 'Dönüşüm',
    'Nazım Hikmet', 'Orhan Pamuk', 'Yaşar Kemal', 'Tanpınar', 'Sait Faik', 'Sabahattin Ali',
    'Empresyonizm', 'Kübizm', 'Sürrealizm', 'Fütürizm', 'Dadaizm', 'Ekspresyonizm',
    'Roma', 'Floransa', 'Venedik', 'Paris', 'Amsterdam', 'Viyana', 'Londra',
  ],
  'Film & Kültür': [
    'Spielberg', 'Kubrick', 'Hitchcock', 'Scorsese', 'Coppola', 'Tarantino', 'Nolan',
    'Marlon Brando', 'Robert De Niro', 'Al Pacino', 'Jack Nicholson', 'Meryl Streep',
    'Casablanca', 'Citizen Kane', 'Vertigo', 'Metropolis', 'La Dolce Vita', 'Rashomon',
    'Oscar', 'BAFTA', 'Cannes', 'Berlin', 'Venedik', 'Sundance', 'TIFF',
    'Warner Bros', 'Universal', 'Paramount', 'Sony Pictures', 'Disney', 'Netflix',
    'Atatürk', 'Ghandi', 'Schindler', 'Gladyatör', 'Titanik', 'Avatar', 'Interstellar',
  ],
  'Sinema & Pop Kültür': [
    'Spielberg', 'Nolan', 'Tarantino', 'Kubrick', 'Scorsese', 'Fincher', 'Villeneuve',
    'Marvel', 'DC', 'Lucasfilm', 'Pixar', 'DreamWorks', 'A24', 'Blumhouse',
    'Oscar', 'Emmy', 'Grammy', 'Tony', 'BAFTA', 'Cannes', 'Golden Globe',
    'Inception', 'Matrix', 'Interstellar', 'Avatar', 'Titanik', 'Star Wars', 'Lord of the Rings',
    'Batman', 'Superman', 'Spider-Man', 'Iron Man', 'Thor', 'Captain America', 'Black Panther',
  ],
  'Müzik': [
    'Gitar', 'Piyano', 'Keman', 'Flüt', 'Oboe', 'Klarnet', 'Fagot', 'Kontrabas',
    'Trompet', 'Trombon', 'Tuba', 'Korno', 'Saksafon', 'Korneto', 'Flugelhorn',
    'The Beatles', 'Rolling Stones', 'Pink Floyd', 'Led Zeppelin', 'Queen', 'AC/DC',
    'Michael Jackson', 'Elvis Presley', 'Freddie Mercury', 'Bob Dylan', 'David Bowie',
    'Barış Manço', 'Zülfü Livaneli', 'Sezen Aksu', 'Tarkan', 'Fazıl Say', 'Ajda Pekkan',
    'Do majör', 'Re minör', 'Mi bemol', 'Fa diyez', 'Sol majör', 'La minör', 'Si majör',
  ],
  'Yemek & Mutfak': [
    'Fesleğen', 'Kekik', 'Biberiye', 'Adaçayı', 'Nane', 'Dereotu', 'Maydanoz',
    'Zencefil', 'Zerdeçal', 'Karanfil', 'Tarçın', 'Kimyon', 'Köri', 'Safran',
    'Fransa', 'İtalya', 'Japonya', 'Tayland', 'Hindistan', 'Meksika', 'Peru',
    'Parmesan', 'Mozzarella', 'Brie', 'Camembert', 'Gouda', 'Edam', 'Gruyère',
    'Sauvignon Blanc', 'Chardonnay', 'Pinot Noir', 'Cabernet', 'Merlot', 'Riesling',
    'Teriyaki', 'Tempura', 'Sashimi', 'Ramen', 'Udon', 'Miso', 'Edamame',
  ],
  'Otomotiv & Mühendislik': [
    'Toyota', 'Volkswagen', 'Ford', 'BMW', 'Mercedes-Benz', 'Audi', 'Porsche', 'Ferrari',
    'ABS', 'ESP', 'EPS', 'ADAS', 'ACC', 'LKA', 'BSM',
    'Turbo', 'Kompresör', 'Intercooler', 'EGR', 'DPF', 'SCR', 'GPF',
    'Alüminyum', 'Karbon Fiber', 'Magnezyum', 'Titanyum', 'Çelik', 'Plastik',
    'Krank Mili', 'Kam Mili', 'Triger Zinciri', 'Subap', 'Silindir Kafası', 'Blok',
  ],
  'Doğa & Hayvanlar': [
    'Aslan', 'Kaplan', 'Leopar', 'Jaguar', 'Puma', 'Çita', 'Kar Leoparı',
    'Fil', 'Gergedan', 'Hipopotam', 'Zürafa', 'Deve', 'Bizon', 'Geyik',
    'Amazon', 'Kongo', 'Borneo', 'Sumatra', 'Papua', 'Madagaskar', 'Pantanal',
    'Mercan', 'Alg', 'Yosun', 'Eğrelti Otu', 'Bambu', 'Sekoya', 'Baobab',
    'Köpek Balığı', 'Katil Balina', 'Hammerhead', 'Manta Işını', 'Ahtapot', 'Mürekkep Balığı',
    'Kartal', 'Şahin', 'Atmaca', 'Pelikan', 'Flamingo', 'Albatros', 'Penguen',
  ],
  'Sanat & Kültür': [
    'Empresyonizm', 'Kübizm', 'Sürrealizm', 'Fütürizm', 'Dadaizm', 'Ekspresyonizm', 'Pop Art',
    'Monet', 'Van Gogh', 'Picasso', 'Dali', 'Warhol', 'Lichtenstein', 'Hockney',
    'Shakespeare', 'Dante', 'Goethe', 'Cervantes', 'Tolstoy', 'Hugo', 'Dickens',
    'Louvre', 'MoMA', 'Tate Modern', 'Uffizi', 'Prado', 'Hermitage', 'Guggenheim',
    'Michelangelo', 'Leonardo', 'Raphael', 'Tiziano', 'Botticelli', 'Donatello',
  ],
  'Görsel - Bayraklar': [
    'Portekiz', 'Polonya', 'Romanya', 'Bulgaristan', 'Sırbistan', 'Hırvatistan',
    'Slovenya', 'Slovakya', 'Çek Cumhuriyeti', 'Avusturya', 'İsviçre', 'Belçika',
    'Küba', 'Panama', 'Honduras', 'Guatemala', 'Costa Rica', 'El Salvador', 'Nikaragua',
    'Kazakistan', 'Özbekistan', 'Türkmenistan', 'Kırgızistan', 'Tacikistan', 'Afganistan',
    'Tanzanya', 'Uganda', 'Ruanda', 'Burundi', 'Mozambik', 'Zambia', 'Malawi',
  ],
};

// Varsayılan havuz (bilinmeyen kategoriler için)
const DEFAULT_POOL = [
  'İsviçre', 'Norveç', 'Danimarka', 'Yeni Zelanda', 'Singapur', 'Avusturya', 'Finlandiya',
  'Napolyon', 'Kleopatra', 'Churchill', 'Gandhi', 'Mandela', 'Lincoln', 'Atatürk',
  'Stockholm', 'Kopenhag', 'Amsterdam', 'Viyana', 'Lizbon', 'Varşova', 'Prag',
  '1453', '1776', '1789', '1848', '1917', '1945', '1969',
  'Himalayalar', 'Andes', 'Alpler', 'Amazon', 'Nil', 'Volga', 'Yangtze',
  'Helyum', 'Neon', 'Argon', 'Titanyum', 'Platin', 'Palladyum', 'Rodyum',
];

function getPool(category) {
  if (!category) return DEFAULT_POOL;
  // Tam eşleşme
  if (POOLS[category]) return POOLS[category];
  // Kısmi eşleşme
  for (const key of Object.keys(POOLS)) {
    if (category.includes(key) || key.includes(category)) return POOLS[key];
  }
  return DEFAULT_POOL;
}

async function run() {
  const rows = await sql`
    SELECT id, category, option_a, option_b, option_c, option_d
    FROM quiz_questions
    WHERE option_e IS NULL OR option_e = ''
    ORDER BY id
  `;
  console.log('E şıkkı eklenecek soru sayısı:', rows.length);

  let updated = 0;
  let fallback = 0;

  for (const r of rows) {
    const existing = new Set(
      [r.option_a, r.option_b, r.option_c, r.option_d]
        .filter(Boolean)
        .map(s => s.toLowerCase().trim())
    );

    const pool = getPool(r.category);
    const shuffled = [...pool].sort(() => Math.random() - 0.5);

    let chosen = null;
    for (const d of shuffled) {
      if (!existing.has(d.toLowerCase().trim())) {
        chosen = d;
        break;
      }
    }

    if (!chosen) {
      // Son çare: havuzun tamamından dene
      for (const d of DEFAULT_POOL) {
        if (!existing.has(d.toLowerCase().trim())) { chosen = d; break; }
      }
    }
    if (!chosen) {
      // Mutlak son çare: rastgele sayı
      chosen = String(Math.floor(Math.random() * 9000) + 1000);
      fallback++;
    }

    await sql`UPDATE quiz_questions SET option_e = ${chosen} WHERE id = ${r.id}`;
    updated++;
    if (updated % 100 === 0) console.log(`  ${updated}/${rows.length} güncellendi...`);
  }

  const stats = await sql`
    SELECT COUNT(*)::int as total,
           COUNT(CASE WHEN option_e IS NOT NULL AND option_e <> '' THEN 1 END)::int as with_e
    FROM quiz_questions
  `;
  console.log(`\nTamamlandı! Güncellenen: ${updated} | Fallback: ${fallback}`);
  console.log(`Toplam: ${stats[0].total} | E şıklı: ${stats[0].with_e}`);
  process.exit(0);
}

run().catch(e => { console.error(e); process.exit(1); });
