// ~130 yeni görsel soru: zor bayraklar, ünlü tablolar, dünya mirası yapılar,
// araba markaları, diğer spor, hayvanlar, uzay, sanatçılar
// Tüm görseller flagcdn.com PNG veya Wikimedia Commons doğrudan JPG/PNG
const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const dbUrl = fs.readFileSync('.env', 'utf-8').split('\n').find(l => l.startsWith('DATABASE_URL=')).replace('DATABASE_URL=', '').trim();
const sql = neon(dbUrl);

const F = (code) => `https://flagcdn.com/w320/${code}.png`;
const WC = (file) => `https://upload.wikimedia.org/wikipedia/commons/${file}`;
const WE = (file) => `https://upload.wikimedia.org/wikipedia/en/${file}`;
const NBA = (id)  => `https://cdn.nba.com/logos/nba/${id}/global/L/logo.svg`;
const WP  = (f)   => `https://en.wikipedia.org/wiki/Special:Redirect/file/${f}`;

const questions = [

  // ══════════════════════════════════════════════
  // 1. ZOR BAYRAKLAR – flagcdn.com PNG (güvenilir)
  // ══════════════════════════════════════════════
  // Orta Doğu & Körfez
  { q:"Bu bayrak hangi ülkeye aittir?", a:"Katar",       b:"Bahreyn",     c:"BAE",          d:"Umman",       e:"Kuveyt",      correct:"A", cat:"Görsel - Bayraklar", img:F("qa") },
  { q:"Bu bayrak hangi ülkeye aittir?", a:"Katar",       b:"Bahreyn",     c:"Umman",         d:"Suudi Arabistan",e:"Kuveyt",    correct:"B", cat:"Görsel - Bayraklar", img:F("bh") },
  { q:"Bu bayrak hangi ülkeye aittir?", a:"BAE",         b:"Katar",       c:"Bahreyn",       d:"Irak",        e:"Suriye",      correct:"A", cat:"Görsel - Bayraklar", img:F("ae") },
  { q:"Bu bayrak hangi ülkeye aittir?", a:"Yemen",       b:"Suriye",      c:"Lübnan",        d:"Ürdün",       e:"Filistin",    correct:"D", cat:"Görsel - Bayraklar", img:F("jo") },
  { q:"Bu bayrak hangi ülkeye aittir?", a:"Suriye",      b:"Irak",        c:"Yemen",         d:"Libya",       e:"Sudan",       correct:"C", cat:"Görsel - Bayraklar", img:F("ye") },
  // Asya & Pasifik
  { q:"Bu bayrak hangi ülkeye aittir?", a:"Kamboçya",    b:"Laos",        c:"Vietnam",       d:"Tayland",     e:"Myanmar",     correct:"A", cat:"Görsel - Bayraklar", img:F("kh") },
  { q:"Bu bayrak hangi ülkeye aittir?", a:"Bhutan",      b:"Nepal",       c:"Tibet",         d:"Sri Lanka",   e:"Maldivler",   correct:"B", cat:"Görsel - Bayraklar", img:F("np") },
  { q:"Bu bayrak hangi ülkeye aittir?", a:"Fiji",        b:"Papua Yeni Gine",c:"Yeni Zelanda",d:"Samoa",      e:"Tonga",       correct:"A", cat:"Görsel - Bayraklar", img:F("fj") },
  { q:"Bu bayrak hangi ülkeye aittir?", a:"Filipinler",  b:"Endonezya",   c:"Malezya",       d:"Brunei",      e:"Doğu Timor",  correct:"A", cat:"Görsel - Bayraklar", img:F("ph") },
  { q:"Bu bayrak hangi ülkeye aittir?", a:"Moğolistan",  b:"Kazakistan",  c:"Özbekistan",    d:"Kırgızistan", e:"Tacikistan",  correct:"D", cat:"Görsel - Bayraklar", img:F("kg") },
  // Afrika
  { q:"Bu bayrak hangi ülkeye aittir?", a:"Nijerya",     b:"Kamerun",     c:"Gana",          d:"Togo",        e:"Benin",       correct:"B", cat:"Görsel - Bayraklar", img:F("cm") },
  { q:"Bu bayrak hangi ülkeye aittir?", a:"Mozambik",    b:"Zimbabwe",    c:"Malawi",        d:"Zambia",      e:"Angola",      correct:"A", cat:"Görsel - Bayraklar", img:F("mz") },
  { q:"Bu bayrak hangi ülkeye aittir?", a:"Madagaskar",  b:"Komor Adaları",c:"Seyşeller",    d:"Mauritius",   e:"Maldivler",   correct:"A", cat:"Görsel - Bayraklar", img:F("mg") },
  { q:"Bu bayrak hangi ülkeye aittir?", a:"Kenya",       b:"Uganda",      c:"Ruanda",        d:"Burundi",     e:"Tanzanya",    correct:"A", cat:"Görsel - Bayraklar", img:F("ke") },
  { q:"Bu bayrak hangi ülkeye aittir?", a:"Nijer",       b:"Mali",        c:"Burkina Faso",  d:"Çad",         e:"Orta Afrika", correct:"A", cat:"Görsel - Bayraklar", img:F("ne") },
  // Avrupa
  { q:"Bu bayrak hangi ülkeye aittir?", a:"Arnavutluk",  b:"Sırbistan",   c:"Kosova",        d:"Kuzey Makedonya",e:"Bulgaristan",correct:"A", cat:"Görsel - Bayraklar", img:F("al") },
  { q:"Bu bayrak hangi ülkeye aittir?", a:"Moldova",     b:"Romanya",     c:"Ukrayna",       d:"Bulgaristan", e:"Macaristan",  correct:"A", cat:"Görsel - Bayraklar", img:F("md") },
  { q:"Bu bayrak hangi ülkeye aittir?", a:"San Marino",  b:"Vatican",     c:"Lihtenştayn",   d:"Monako",      e:"Andorra",     correct:"D", cat:"Görsel - Bayraklar", img:F("mc") },
  { q:"Bu bayrak hangi ülkeye aittir?", a:"Malta",       b:"Kıbrıs",      c:"İtalya",        d:"Hırvatistan", e:"Arnavutluk",  correct:"B", cat:"Görsel - Bayraklar", img:F("cy") },
  { q:"Bu bayrak hangi ülkeye aittir?", a:"İzlanda",     b:"Norveç",      c:"Danimarka",     d:"Faroe Adaları",e:"Finlandiya",  correct:"A", cat:"Görsel - Bayraklar", img:F("is") },
  // Amerika
  { q:"Bu bayrak hangi ülkeye aittir?", a:"Küba",        b:"Portekiz",    c:"Şili",          d:"Puerto Rico", e:"Panama",      correct:"A", cat:"Görsel - Bayraklar", img:F("cu") },
  { q:"Bu bayrak hangi ülkeye aittir?", a:"Trinidad ve Tobago",b:"Barbados",c:"Dominik Cumhuriyeti",d:"Haiti",e:"Jamaika",      correct:"A", cat:"Görsel - Bayraklar", img:F("tt") },
  { q:"Bu bayrak hangi ülkeye aittir?", a:"Kolombiya",   b:"Ekvador",     c:"Peru",          d:"Venezuela",   e:"Guyana",      correct:"A", cat:"Görsel - Bayraklar", img:F("co") },
  { q:"Bu bayrak hangi ülkeye aittir?", a:"Honduras",    b:"El Salvador", c:"Guatemala",     d:"Nikaragua",   e:"Belize",      correct:"A", cat:"Görsel - Bayraklar", img:F("hn") },
  { q:"Bu bayrak hangi ülkeye aittir?", a:"Uruguay",     b:"Arjantin",    c:"Paraguay",      d:"Bolivya",     e:"Şili",        correct:"A", cat:"Görsel - Bayraklar", img:F("uy") },

  // ══════════════════════════════════════════════
  // 2. ÜNLÜ TABLOLAR – Wikimedia Commons doğrudan JPG
  // ══════════════════════════════════════════════
  { q:"Bu tablo hangi sanatçıya aittir?", a:"Rafael",      b:"Tiziano",    c:"Leonardo da Vinci", d:"Michelangelo", e:"Botticelli",
    correct:"C", cat:"Görsel - Sanat",
    img:"https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg/300px-Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg" },

  { q:"Bu tablo hangi sanatçıya aittir?", a:"Paul Gauguin",b:"Van Gogh",   c:"Monet",             d:"Degas",        e:"Cézanne",
    correct:"B", cat:"Görsel - Sanat",
    img:"https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg/300px-Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg" },

  { q:"Bu tablo hangi sanatçıya aittir?", a:"Manet",       b:"Renoir",     c:"Pissarro",          d:"Monet",        e:"Sisley",
    correct:"D", cat:"Görsel - Sanat",
    img:"https://upload.wikimedia.org/wikipedia/commons/thumb/a/aa/Claude_Monet_-_Water_Lilies_-_1906%2C_Ryerson.jpg/300px-Claude_Monet_-_Water_Lilies_-_1906%2C_Ryerson.jpg" },

  { q:"\"Çığlık\" tablosunun yaratıcısı kimdir?", a:"Gustav Klimt",b:"Edvard Munch",c:"Egon Schiele",d:"Ernst Ludwig Kirchner",e:"Emil Nolde",
    correct:"B", cat:"Görsel - Sanat",
    img:"https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Edvard_Munch%2C_1893%2C_The_Scream%2C_oil%2C_tempera_and_pastel_on_cardboard%2C_91_x_73_cm%2C_National_Gallery_of_Norway.jpg/300px-Edvard_Munch%2C_1893%2C_The_Scream%2C_oil%2C_tempera_and_pastel_on_cardboard%2C_91_x_73_cm%2C_National_Gallery_of_Norway.jpg" },

  { q:"\"Venüs'ün Doğuşu\" tablosunun yaratıcısı kimdir?", a:"Raphael",   b:"Leonardo",   c:"Sandro Botticelli", d:"Michelangelo", e:"Tiziano",
    correct:"C", cat:"Görsel - Sanat",
    img:"https://upload.wikimedia.org/wikipedia/commons/thumb/2/26/Sandro_Botticelli_-_La_nascita_di_Venere_-_Google_Art_Project_-_edited.jpg/300px-Sandro_Botticelli_-_La_nascita_di_Venere_-_Google_Art_Project_-_edited.jpg" },

  { q:"\"İnci Küpeli Kız\" tablosunun yaratıcısı kimdir?", a:"Rembrandt", b:"Van Dyck",   c:"Rubens",            d:"Johannes Vermeer",e:"Frans Hals",
    correct:"D", cat:"Görsel - Sanat",
    img:"https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/1665_Girl_with_a_Pearl_Earring.jpg/300px-1665_Girl_with_a_Pearl_Earring.jpg" },

  { q:"\"Guernica\" tablosunun yaratıcısı kimdir?", a:"Salvador Dalí",b:"Pablo Picasso",c:"Joan Miró",d:"Frida Kahlo",e:"Diego Rivera",
    correct:"B", cat:"Görsel - Sanat",
    img:"https://upload.wikimedia.org/wikipedia/en/7/74/PicassoGuernica.jpg" },

  { q:"\"Belleğin Azmi\" (Eriyen Saatler) tablosunun yaratıcısı kimdir?", a:"René Magritte",b:"Salvador Dalí",c:"Max Ernst",d:"Giorgio de Chirico",e:"Joan Miró",
    correct:"B", cat:"Görsel - Sanat",
    img:"https://upload.wikimedia.org/wikipedia/en/d/dd/The_Persistence_of_Memory.jpg" },

  { q:"Bu tablo hangi sanatçıya aittir?", a:"Rembrandt",   b:"Rubens",     c:"Van Eyck",          d:"Hals",         e:"Vermeer",
    correct:"A", cat:"Görsel - Sanat",
    img:"https://upload.wikimedia.org/wikipedia/commons/thumb/b/bd/Rembrandt_van_Rijn_-_Self-Portrait_-_Google_Art_Project.jpg/300px-Rembrandt_van_Rijn_-_Self-Portrait_-_Google_Art_Project.jpg" },

  { q:"\"Son Akşam Yemeği\" tablosu kimin eseridir?", a:"Michelangelo",b:"Raphael",    c:"Leonardo da Vinci",  d:"Tiziano",      e:"Caravaggio",
    correct:"C", cat:"Görsel - Sanat",
    img:"https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/%22The_Last_Supper%22_by_Leonardo_da_Vinci.jpg/300px-%22The_Last_Supper%22_by_Leonardo_da_Vinci.jpg" },

  { q:"Bu tablo hangi akıma aittir?", a:"Romantizm",      b:"Natüralizm",  c:"Kübizm",            d:"Ekspresyonizm",e:"Sürrealizm",
    correct:"C", cat:"Görsel - Sanat",
    img:"https://upload.wikimedia.org/wikipedia/en/thumb/1/1c/Pablo_Picasso%2C_1907%2C_Les_Demoiselles_d%27Avignon.jpg/300px-Pablo_Picasso%2C_1907%2C_Les_Demoiselles_d%27Avignon.jpg" },

  { q:"\"Büyük Dalga\" eseri hangi sanatçıya aittir?", a:"Hiroshige",    b:"Utamaro",     c:"Katsushika Hokusai",d:"Kuniyoshi",   e:"Yoshitoshi",
    correct:"C", cat:"Görsel - Sanat",
    img:"https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Tsunami_by_hokusai_19th_century.jpg/300px-Tsunami_by_hokusai_19th_century.jpg" },

  { q:"\"Adam'ın Yaratılışı\" Sistine Şapeli'ndeki fresk kimin eseridir?", a:"Rafael",  b:"Botticelli",  c:"Perugino",          d:"Michelangelo", e:"Ghirlandaio",
    correct:"D", cat:"Görsel - Sanat",
    img:"https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/Michelangelo_-_Creation_of_Adam_%28cropped%29.jpg/300px-Michelangelo_-_Creation_of_Adam_%28cropped%29.jpg" },

  // ══════════════════════════════════════════════
  // 3. DÜNYA MİRASI YAPILAR – Wikimedia Commons JPG
  // ══════════════════════════════════════════════
  { q:"Bu yapı hangi ülkede bulunmaktadır?", a:"İtalya",    b:"Yunanistan",  c:"İspanya",           d:"Türkiye",      e:"Mısır",
    correct:"A", cat:"Görsel - Yapılar",
    img:"https://upload.wikimedia.org/wikipedia/commons/thumb/d/de/Colosseo_2020.jpg/320px-Colosseo_2020.jpg" },

  { q:"Bu yapı hangi ülkede bulunmaktadır?", a:"Mısır",     b:"Hindistan",   c:"Pakistan",          d:"Türkiye",      e:"İran",
    correct:"B", cat:"Görsel - Yapılar",
    img:"https://upload.wikimedia.org/wikipedia/commons/thumb/b/bd/Taj_Mahal%2C_Agra%2C_India_edit3.jpg/320px-Taj_Mahal%2C_Agra%2C_India_edit3.jpg" },

  { q:"Bu yapı hangi şehirde bulunmaktadır?", a:"Londra",   b:"Amsterdam",   c:"Brüksel",           d:"Paris",        e:"Berlin",
    correct:"D", cat:"Görsel - Yapılar",
    img:"https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/Tour_Eiffel_Wikimedia_Commons_%28cropped%29.jpg/300px-Tour_Eiffel_Wikimedia_Commons_%28cropped%29.jpg" },

  { q:"Bu yapı hangi şehirde bulunmaktadır?", a:"İstanbul", b:"Atina",       c:"Roma",              d:"Kahire",       e:"Kudüs",
    correct:"B", cat:"Görsel - Yapılar",
    img:"https://upload.wikimedia.org/wikipedia/commons/thumb/d/da/The_Parthenon_in_Athens.jpg/320px-The_Parthenon_in_Athens.jpg" },

  { q:"Bu yapı hangi şehirde bulunmaktadır?", a:"Sidney",   b:"Melbourne",   c:"Auckland",          d:"Wellington",   e:"Brisbane",
    correct:"A", cat:"Görsel - Yapılar",
    img:"https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Sydney_Australia._%2821753579706%29.jpg/320px-Sydney_Australia._%2821753579706%29.jpg" },

  { q:"Bu yapı hangi ülkede bulunmaktadır?", a:"Peru",      b:"Bolivya",     c:"Ekvador",           d:"Kolombiya",    e:"Şili",
    correct:"A", cat:"Görsel - Yapılar",
    img:"https://upload.wikimedia.org/wikipedia/commons/thumb/e/eb/Machu_Picchu%2C_Peru.jpg/320px-Machu_Picchu%2C_Peru.jpg" },

  { q:"Bu yapı hangi ülkede bulunmaktadır?", a:"Kamboçya",  b:"Tayland",     c:"Vietnam",           d:"Laos",         e:"Myanmar",
    correct:"A", cat:"Görsel - Yapılar",
    img:"https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/Angkor_Wat_from_the_air.jpg/320px-Angkor_Wat_from_the_air.jpg" },

  { q:"Bu yapı hangi şehirde bulunmaktadır?", a:"Moskova",  b:"St. Petersburg",c:"Kiev",            d:"Minsk",        e:"Kazan",
    correct:"A", cat:"Görsel - Yapılar",
    img:"https://upload.wikimedia.org/wikipedia/commons/thumb/6/64/Moscow_July_2011-7a.jpg/300px-Moscow_July_2011-7a.jpg" },

  { q:"Bu yapı hangi şehirde bulunmaktadır?", a:"Barcelona",b:"Madrid",      c:"Sevilla",           d:"Bilbao",       e:"Valencia",
    correct:"A", cat:"Görsel - Yapılar",
    img:"https://upload.wikimedia.org/wikipedia/commons/thumb/b/be/Sagrada_Familia_01.jpg/300px-Sagrada_Familia_01.jpg" },

  { q:"Bu yapı hangi şehirde bulunmaktadır?", a:"Londra",   b:"Dublin",      c:"Edinburgh",         d:"Manchester",   e:"Liverpool",
    correct:"A", cat:"Görsel - Yapılar",
    img:"https://upload.wikimedia.org/wikipedia/commons/thumb/9/93/Clock_Tower_-_Palace_of_Westminster%2C_London_-_May_2007.jpg/300px-Clock_Tower_-_Palace_of_Westminster%2C_London_-_May_2007.jpg" },

  { q:"Bu yapı hangi şehirde bulunmaktadır?", a:"Washington D.C.",b:"New York",c:"Boston",          d:"Philadelphia", e:"Chicago",
    correct:"B", cat:"Görsel - Yapılar",
    img:"https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Statue_of_Liberty_7.jpg/300px-Statue_of_Liberty_7.jpg" },

  { q:"Pisa Kulesi hangi ülkededir?", a:"Fransa",           b:"İspanya",     c:"İtalya",            d:"Portekiz",     e:"Yunanistan",
    correct:"C", cat:"Görsel - Yapılar",
    img:"https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/The_Leaning_Tower_of_Pisa_SB.jpeg/300px-The_Leaning_Tower_of_Pisa_SB.jpeg" },

  { q:"Bu yapı hangi şehirde bulunmaktadır?", a:"İstanbul", b:"Kahire",      c:"Bağdat",            d:"Tahran",       e:"Amman",
    correct:"A", cat:"Görsel - Yapılar",
    img:"https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Hagia_Sophia_Istanbul_2023.jpg/320px-Hagia_Sophia_Istanbul_2023.jpg" },

  // ══════════════════════════════════════════════
  // 4. ARABA MARKA LOGOLARI – Wikipedia doğrudan SVG/PNG
  // ══════════════════════════════════════════════
  { q:"Bu logo hangi otomobil markasına aittir?", a:"Rolls-Royce",b:"Bentley",c:"Aston Martin",d:"Jaguar",e:"McLaren",
    correct:"B", cat:"Görsel - Otomotiv",
    img:WP("Bentley_logo.svg") },

  { q:"Bu logo hangi otomobil markasına aittir?", a:"Bentley",b:"Ferrari",c:"Lamborghini",d:"Maserati",e:"Alfa Romeo",
    correct:"D", cat:"Görsel - Otomotiv",
    img:WP("Maserati_logo.svg") },

  { q:"Bu logo hangi otomobil markasına aittir?", a:"Ferrari",b:"Lamborghini",c:"Alfa Romeo",d:"Maserati",e:"Bugatti",
    correct:"C", cat:"Görsel - Otomotiv",
    img:WP("Alfa_Romeo_Logo.png") },

  { q:"Bu logo hangi otomobil markasına aittir?", a:"Porsche",b:"BMW",c:"Mercedes",d:"Audi",e:"Volkswagen",
    correct:"A", cat:"Görsel - Otomotiv",
    img:WP("Porsche_logo.svg") },

  { q:"Bu logo hangi otomobil markasına aittir?", a:"Toyota",b:"Honda",c:"Subaru",d:"Mitsubishi",e:"Mazda",
    correct:"C", cat:"Görsel - Otomotiv",
    img:WP("Subaru_Logo.svg") },

  { q:"Bu logo hangi otomobil markasına aittir?", a:"Ford",b:"Chevrolet",c:"Dodge",d:"Jeep",e:"Cadillac",
    correct:"B", cat:"Görsel - Otomotiv",
    img:WP("Chevrolet_logo.svg") },

  { q:"Bu logo hangi otomobil markasına aittir?", a:"Volvo",b:"Saab",c:"SEAT",d:"Skoda",e:"Lada",
    correct:"A", cat:"Görsel - Otomotiv",
    img:WP("Volvo_logo.svg") },

  { q:"Bu logo hangi otomobil markasına aittir?", a:"KIA",b:"Hyundai",c:"Genesis",d:"Ssangyong",e:"Daewoo",
    correct:"B", cat:"Görsel - Otomotiv",
    img:WP("Hyundai_Motor_Company_logo.svg") },

  { q:"Bu logo hangi otomobil markasına aittir?", a:"Peugeot",b:"Citroën",c:"Renault",d:"Fiat",e:"Seat",
    correct:"A", cat:"Görsel - Otomotiv",
    img:WP("Peugeot_logo.svg") },

  { q:"Bu logo hangi otomobil markasına aittir?", a:"Ford",b:"Lincoln",c:"Tesla",d:"Rivian",e:"Lucid",
    correct:"C", cat:"Görsel - Otomotiv",
    img:WP("Tesla_Motors.svg") },

  // ══════════════════════════════════════════════
  // 5. F1 TAKIMLARI – Wikipedia redirect SVG
  // ══════════════════════════════════════════════
  { q:"Bu logo hangi Formula 1 takımına aittir?", a:"McLaren",b:"Ferrari",c:"Red Bull",d:"Mercedes",e:"Alpine",
    correct:"B", cat:"Görsel - Spor",
    img:WP("Scuderia_Ferrari_Logo.svg") },

  { q:"Bu logo hangi Formula 1 takımına aittir?", a:"Ferrari",b:"Red Bull",c:"Mercedes",d:"McLaren",e:"Aston Martin",
    correct:"D", cat:"Görsel - Spor",
    img:WP("McLaren_Racing_logo.svg") },

  { q:"Bu logo hangi Formula 1 takımına aittir?", a:"Alpine",b:"AlphaTauri",c:"Williams",d:"Haas",e:"Alfa Romeo",
    correct:"C", cat:"Görsel - Spor",
    img:WP("Williams_Racing_logo.svg") },

  // ══════════════════════════════════════════════
  // 6. DAHA FAZLA NBA TAKIMI
  // ══════════════════════════════════════════════
  { q:"Bu logo hangi NBA takımına aittir?", a:"Los Angeles Lakers",b:"LA Clippers",c:"Phoenix Suns",d:"Sacramento Kings",e:"Golden State Warriors",
    correct:"A", cat:"Görsel - Spor", img:NBA(1610612747) },
  { q:"Bu logo hangi NBA takımına aittir?", a:"Houston Rockets",b:"Dallas Mavericks",c:"San Antonio Spurs",d:"New Orleans Pelicans",e:"Memphis Grizzlies",
    correct:"C", cat:"Görsel - Spor", img:NBA(1610612759) },
  { q:"Bu logo hangi NBA takımına aittir?", a:"Dallas Mavericks",b:"Houston Rockets",c:"Oklahoma City Thunder",d:"Utah Jazz",e:"Denver Nuggets",
    correct:"A", cat:"Görsel - Spor", img:NBA(1610612742) },
  { q:"Bu logo hangi NBA takımına aittir?", a:"Boston Celtics",b:"New York Knicks",c:"Philadelphia 76ers",d:"Toronto Raptors",e:"Brooklyn Nets",
    correct:"A", cat:"Görsel - Spor", img:NBA(1610612738) },
  { q:"Bu logo hangi NBA takımına aittir?", a:"Denver Nuggets",b:"Phoenix Suns",c:"LA Clippers",d:"Sacramento Kings",e:"Golden State Warriors",
    correct:"B", cat:"Görsel - Spor", img:NBA(1610612756) },
  { q:"Bu logo hangi NBA takımına aittir?", a:"Atlanta Hawks",b:"Miami Heat",c:"Charlotte Hornets",d:"Orlando Magic",e:"Washington Wizards",
    correct:"A", cat:"Görsel - Spor", img:NBA(1610612737) },
  { q:"Bu logo hangi NBA takımına aittir?", a:"Chicago Bulls",b:"Cleveland Cavaliers",c:"Detroit Pistons",d:"Indiana Pacers",e:"Milwaukee Bucks",
    correct:"B", cat:"Görsel - Spor", img:NBA(1610612739) },

  // ══════════════════════════════════════════════
  // 7. HAYVANLAR – Wikimedia Commons JPG
  // ══════════════════════════════════════════════
  { q:"Bu hayvan hangi türe aittir?", a:"Aslan",b:"Jaguar",c:"Çita",d:"Leopar",e:"Puma",
    correct:"C", cat:"Görsel - Doğa",
    img:"https://upload.wikimedia.org/wikipedia/commons/thumb/4/40/Cheetah_at_a_Swedish_zoo_%28cropped%29.jpg/320px-Cheetah_at_a_Swedish_zoo_%28cropped%29.jpg" },

  { q:"Bu hayvan hangi kıtada yaşar?", a:"Afrika",b:"Asya",c:"Güney Amerika",d:"Avustralya",e:"Kuzey Amerika",
    correct:"D", cat:"Görsel - Doğa",
    img:"https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Oryctolagus_cuniculus_Tasmania_2_crop.jpg/320px-Oryctolagus_cuniculus_Tasmania_2_crop.jpg" },

  { q:"Bu hayvan hangi türe aittir?", a:"Kutup Tilkisi",b:"Kutup Ayısı",c:"Ren Geyiği",d:"Misk Öküzü",e:"Arktik Kurt",
    correct:"B", cat:"Görsel - Doğa",
    img:"https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Ursus_maritimus_Polar_bear_with_cub_2.jpg/320px-Ursus_maritimus_Polar_bear_with_cub_2.jpg" },

  { q:"Bu hayvan hangi isimle bilinir?", a:"Zürafa",b:"Okapi",c:"Bongo",d:"Nyala",e:"Kudu",
    correct:"B", cat:"Görsel - Doğa",
    img:"https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Okapi2.jpg/320px-Okapi2.jpg" },

  { q:"Bu hayvan hangi türe aittir?", a:"Deniz Aslanı",b:"Fok",c:"Mors",d:"Deniz Ayısı",e:"Dugong",
    correct:"C", cat:"Görsel - Doğa",
    img:"https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/Walrus_-_Kamogawa_Seaworld_-_2013-11-17_-_3.jpg/320px-Walrus_-_Kamogawa_Seaworld_-_2013-11-17_-_3.jpg" },

  // ══════════════════════════════════════════════
  // 8. UZAY & BİLİM – NASA/Wikimedia JPG
  // ══════════════════════════════════════════════
  { q:"Bu uzay cismi hangisidir?", a:"Mars",b:"Jüpiter",c:"Satürn",d:"Uranüs",e:"Neptün",
    correct:"C", cat:"Görsel - Bilim",
    img:"https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Saturn_with_auroras.jpg/320px-Saturn_with_auroras.jpg" },

  { q:"Bu uzay cismi hangisidir?", a:"Ay",b:"Mars",c:"Merkür",d:"Venüs",e:"Deimos",
    correct:"B", cat:"Görsel - Bilim",
    img:"https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/OSIRIS_Mars_true_color.jpg/320px-OSIRIS_Mars_true_color.jpg" },

  { q:"Bu uzay cismi hangisidir?", a:"Satürn",b:"Jüpiter",c:"Uranüs",d:"Neptün",e:"Plüton",
    correct:"B", cat:"Görsel - Bilim",
    img:"https://upload.wikimedia.org/wikipedia/commons/thumb/2/2b/Jupiter_and_its_shrunken_Great_Red_Spot.jpg/320px-Jupiter_and_its_shrunken_Great_Red_Spot.jpg" },

  { q:"Bu galaksi hangisidir?", a:"Andromeda",b:"Samanyolu",c:"Üçgen Galaksisi",d:"Whirlpool",e:"Pinwheel",
    correct:"A", cat:"Görsel - Bilim",
    img:"https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Andromeda_Galaxy_560mm_FL.jpg/320px-Andromeda_Galaxy_560mm_FL.jpg" },

  // ══════════════════════════════════════════════
  // 9. LOGOLAR / MARKA TANIMLAMA
  // ══════════════════════════════════════════════
  { q:"Bu logo hangi teknoloji şirketine aittir?", a:"Microsoft",b:"Google",c:"Meta",d:"Amazon",e:"Apple",
    correct:"E", cat:"Görsel - Teknoloji",
    img:WP("Apple_logo_black.svg") },

  { q:"Bu logo hangi teknoloji şirketine aittir?", a:"Apple",b:"Samsung",c:"Google",d:"Microsoft",e:"Meta",
    correct:"D", cat:"Görsel - Teknoloji",
    img:WP("Microsoft_logo_(2012).svg") },

  { q:"Bu logo hangi teknoloji şirketine aittir?", a:"Yahoo",b:"Bing",c:"Google",d:"DuckDuckGo",e:"Baidu",
    correct:"C", cat:"Görsel - Teknoloji",
    img:WP("Google_2015_logo.svg") },

  { q:"Bu logo hangi sosyal medya platformuna aittir?", a:"Twitter/X",b:"Instagram",c:"Facebook",d:"TikTok",e:"Snapchat",
    correct:"B", cat:"Görsel - Teknoloji",
    img:WP("Instagram_logo_2022.svg") },

  { q:"Bu logo hangi video platformuna aittir?", a:"Vimeo",b:"Dailymotion",c:"Netflix",d:"YouTube",e:"Twitch",
    correct:"D", cat:"Görsel - Teknoloji",
    img:WP("YouTube_logo_2017.svg") },

  { q:"Bu logo hangi platformuna aittir?", a:"Amazon",b:"eBay",c:"Alibaba",d:"Shopify",e:"Etsy",
    correct:"A", cat:"Görsel - Teknoloji",
    img:WP("Amazon_logo.svg") },

  { q:"Bu logo hangi spor markasına aittir?", a:"Adidas",b:"Puma",c:"New Balance",d:"Nike",e:"Reebok",
    correct:"D", cat:"Görsel - Marka",
    img:WP("Nike_logo.svg") },

  { q:"Bu logo hangi spor markasına aittir?", a:"Nike",b:"Puma",c:"Adidas",d:"Umbro",e:"Hummel",
    correct:"C", cat:"Görsel - Marka",
    img:WP("Adidas_Logo.svg") },

  { q:"Bu logo hangi spor markasına aittir?", a:"Nike",b:"Adidas",c:"New Balance",d:"Puma",e:"Fila",
    correct:"D", cat:"Görsel - Marka",
    img:WP("Puma_logo.svg") },

  // ══════════════════════════════════════════════
  // 10. MÜZİK GRUBU / SANATÇI – Wikipedia JPG
  // ══════════════════════════════════════════════
  { q:"Bu logo hangi müzik grubuna aittir?", a:"The Beatles",b:"The Rolling Stones",c:"Led Zeppelin",d:"Pink Floyd",e:"Queen",
    correct:"B", cat:"Görsel - Müzik",
    img:WP("The_Rolling_Stones_Logo.svg") },

  { q:"Bu logo hangi müzik grubuna aittir?", a:"Metallica",b:"AC/DC",c:"Iron Maiden",d:"Judas Priest",e:"Black Sabbath",
    correct:"B", cat:"Görsel - Müzik",
    img:WP("ACDC_logo.svg") },

  { q:"Bu logo hangi müzik grubuna aittir?", a:"AC/DC",b:"Metallica",c:"Iron Maiden",d:"Pantera",e:"Megadeth",
    correct:"C", cat:"Görsel - Müzik",
    img:WP("Iron_Maiden_Logo.png") },

  { q:"Bu logo hangi müzik grubuna aittir?", a:"Pink Floyd",b:"Yes",c:"Rush",d:"Nirvana",e:"Pearl Jam",
    correct:"D", cat:"Görsel - Müzik",
    img:WP("Nirvana_logo.svg") },

  // ══════════════════════════════════════════════
  // 11. TARİHİ KİŞİLİKLER – Wikimedia JPG portreler
  // ══════════════════════════════════════════════
  { q:"Bu fotoğraftaki bilim insanı kimdir?", a:"Isaac Newton",b:"Charles Darwin",c:"Albert Einstein",d:"Nikola Tesla",e:"Max Planck",
    correct:"C", cat:"Görsel - Tarih",
    img:"https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Albert_Einstein_Head.jpg/300px-Albert_Einstein_Head.jpg" },

  { q:"Bu portredeki kişi kimdir?", a:"Ludwig van Beethoven",b:"Wolfgang Amadeus Mozart",c:"Johann Sebastian Bach",d:"Franz Schubert",e:"Franz Liszt",
    correct:"B", cat:"Görsel - Tarih",
    img:"https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/Croce-Mozart-Detail.jpg/300px-Croce-Mozart-Detail.jpg" },

  { q:"Bu portredeki kişi kimdir?", a:"George Washington",b:"Abraham Lincoln",c:"Thomas Jefferson",d:"Benjamin Franklin",e:"John Adams",
    correct:"B", cat:"Görsel - Tarih",
    img:"https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Abraham_Lincoln_O-77_matte_collodion_print.jpg/300px-Abraham_Lincoln_O-77_matte_collodion_print.jpg" },

  { q:"Bu portredeki kişi kimdir?", a:"Karl Marx",b:"Friedrich Engels",c:"Vladimir Lenin",d:"Leon Troçki",e:"Joseph Stalin",
    correct:"A", cat:"Görsel - Tarih",
    img:"https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Karl_Marx_001.jpg/300px-Karl_Marx_001.jpg" },

];

// ──────────────────────────────────────────────────
const LETTERS = ['A','B','C','D','E'];
function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function run() {
  console.log(`Yüklenecek soru: ${questions.length}`);
  let inserted = 0, skipped = 0, ti = 0;

  for (const item of questions) {
    const raw = [
      { L:'A', t: item.a }, { L:'B', t: item.b }, { L:'C', t: item.c },
      { L:'D', t: item.d }, { L:'E', t: item.e },
    ].filter(o => o.t);

    const n = raw.length;
    const correct = raw.find(o => o.L === item.correct);
    if (!correct) { console.warn('Cevap yok, atlandı:', item.q.slice(0,40)); continue; }

    const others = shuffle(raw.filter(o => o.L !== item.correct).map(o => o.t));
    const pos = ti % n;
    const finals = [];
    let oi = 0;
    for (let p = 0; p < n; p++) finals.push(p === pos ? correct.t : others[oi++]);
    const newCorrect = LETTERS[pos];
    const [oa, ob, oc, od, oe] = finals;

    // Duplikat koruma: aynı soru + aynı seçenekler
    const ex = await sql`SELECT id FROM quiz_questions WHERE question = ${item.q} AND option_a = ${oa} LIMIT 1`;
    if (ex.length > 0) { skipped++; continue; }
    // Görsel soruları için image_url da kontrol et
    if (item.img) {
      const exImg = await sql`SELECT id FROM quiz_questions WHERE image_url = ${item.img} AND question = ${item.q} LIMIT 1`;
      if (exImg.length > 0) { skipped++; continue; }
    }

    await sql`
      INSERT INTO quiz_questions (question, option_a, option_b, option_c, option_d, option_e, image_url, correct_option, category)
      VALUES (${item.q}, ${oa}, ${ob}, ${oc}, ${od}, ${oe || null}, ${item.img || null}, ${newCorrect}, ${item.cat})
    `;
    ti++;
    inserted++;
  }

  const total = await sql`SELECT COUNT(*)::int as t FROM quiz_questions`;
  const imgs  = await sql`SELECT COUNT(*)::int as t FROM quiz_questions WHERE image_url IS NOT NULL AND image_url <> ''`;
  const src   = await sql`
    SELECT 
      COUNT(CASE WHEN image_url LIKE '%flagcdn%'   THEN 1 END)::int as flags,
      COUNT(CASE WHEN image_url LIKE '%cdn.nba.com%'THEN 1 END)::int as nba,
      COUNT(CASE WHEN image_url LIKE '%wikipedia.org%'THEN 1 END)::int as wiki,
      COUNT(CASE WHEN image_url LIKE '%wikimedia.org%'THEN 1 END)::int as wm
    FROM quiz_questions WHERE image_url IS NOT NULL
  `;

  console.log(`\nEklendi: ${inserted} | Atlandı: ${skipped}`);
  console.log(`Toplam soru: ${total[0].t} | Görselli: ${imgs[0].t}`);
  console.log(`Kaynak: flagcdn=${src[0].flags}, NBA=${src[0].nba}, Wikipedia=${src[0].wiki}, Wikimedia=${src[0].wm}`);
  process.exit(0);
}
run().catch(e => { console.error(e); process.exit(1); });
