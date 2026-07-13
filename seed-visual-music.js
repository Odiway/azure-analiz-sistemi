// Görsel (bayrak-zor, futbol kulübü, basketbol takımı) + Müzik/şarkı sözleri soruları
// Her biri E şıklı, duplikat korumalı
const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const dbUrl = fs.readFileSync('.env', 'utf-8').split('\n').find(l => l.startsWith('DATABASE_URL=')).replace('DATABASE_URL=', '').trim();
const sql = neon(dbUrl);

const FLAG = (n) => `https://commons.wikimedia.org/wiki/Special:FilePath/Flag_of_${n}`;
const IMG  = (n) => `https://commons.wikimedia.org/wiki/Special:FilePath/${n}`;

// ──────────────────────────────────────────────────
// 1. ZOR BAYRAKLAR (az bilinen ülkeler)
// ──────────────────────────────────────────────────
const hardFlags = [
  // Baltık
  { q:"Bu bayrak hangi ülkeye aittir?", a:"Letonya",    b:"Avusturya",  c:"Hırvatistan", d:"Danimarka",  e:"İsveç",      correct:"A", cat:"Görsel - Bayraklar", img:FLAG("Latvia.svg") },
  { q:"Bu bayrak hangi ülkeye aittir?", a:"Litvanya",   b:"Nijer",      c:"Fildişi Sahili",d:"Bulgaristan",e:"Senegal",  correct:"A", cat:"Görsel - Bayraklar", img:FLAG("Lithuania.svg") },
  { q:"Bu bayrak hangi ülkeye aittir?", a:"Finlandiya", b:"Estonya",    c:"İsveç",       d:"İzlanda",    e:"Norveç",     correct:"B", cat:"Görsel - Bayraklar", img:FLAG("Estonia.svg") },
  // Balkan
  { q:"Bu bayrak hangi ülkeye aittir?", a:"Avusturya",  b:"Polonya",    c:"Hırvatistan", d:"Macaristan", e:"Çek Cumhuriyeti", correct:"C", cat:"Görsel - Bayraklar", img:FLAG("Croatia.svg") },
  { q:"Bu bayrak hangi ülkeye aittir?", a:"Makedonya",  b:"Sırbistan",  c:"Kosova",      d:"Karadağ",    e:"Bosna-Hersek", correct:"B", cat:"Görsel - Bayraklar", img:FLAG("Serbia.svg") },
  { q:"Bu bayrak hangi ülkeye aittir?", a:"Hırvatistan",b:"Sırbistan",  c:"Karadağ",     d:"Bosna-Hersek",e:"Slovenya",  correct:"D", cat:"Görsel - Bayraklar", img:FLAG("Bosnia_and_Herzegovina.svg") },
  { q:"Bu bayrak hangi ülkeye aittir?", a:"Slovenya",   b:"Slovakya",   c:"Çek Cumhuriyeti",d:"Hırvatistan",e:"Karadağ", correct:"A", cat:"Görsel - Bayraklar", img:FLAG("Slovenia.svg") },
  { q:"Bu bayrak hangi ülkeye aittir?", a:"Sırbistan",  b:"Romanya",    c:"Bulgaristan",  d:"Karadağ",   e:"Kuzey Makedonya", correct:"D", cat:"Görsel - Bayraklar", img:FLAG("Montenegro.svg") },
  // Kafkasya
  { q:"Bu bayrak hangi ülkeye aittir?", a:"Türkiye",    b:"Tacikistan", c:"Ermenistan",  d:"Türkmenistan",e:"Kırgızistan",correct:"C", cat:"Görsel - Bayraklar", img:FLAG("Armenia.svg") },
  { q:"Bu bayrak hangi ülkeye aittir?", a:"Azerbaycan", b:"Gürcistan",  c:"Ermenistan",  d:"Moldova",    e:"Kazakistan", correct:"B", cat:"Görsel - Bayraklar", img:FLAG("Georgia.svg") },
  { q:"Bu bayrak hangi ülkeye aittir?", a:"Tacikistan", b:"Kırgızistan",c:"Özbekistan",  d:"Kazakistan", e:"Afganistan", correct:"D", cat:"Görsel - Bayraklar", img:FLAG("Kazakhstan.svg") },
  // Asya
  { q:"Bu bayrak hangi ülkeye aittir?", a:"Nepal",      b:"Çin",        c:"Moğolistan",  d:"Tayvan",     e:"Kazakistan", correct:"C", cat:"Görsel - Bayraklar", img:FLAG("Mongolia.svg") },
  { q:"Bu bayrak hangi ülkeye aittir?", a:"Tayland",    b:"Kamboçya",   c:"Sri Lanka",   d:"Myanmar",    e:"Malezya",    correct:"D", cat:"Görsel - Bayraklar", img:FLAG("Myanmar.svg") },
  { q:"Bu bayrak hangi ülkeye aittir?", a:"Hindistan",  b:"Pakistan",   c:"Bangladeş",   d:"Nepal",      e:"Sri Lanka",  correct:"E", cat:"Görsel - Bayraklar", img:FLAG("Sri_Lanka.svg") },
  // Latin Amerika
  { q:"Bu bayrak hangi ülkeye aittir?", a:"Bolivya",    b:"Kolombiya",  c:"Paraguay",    d:"Uruguay",    e:"Peru",       correct:"C", cat:"Görsel - Bayraklar", img:FLAG("Paraguay.svg") },
  { q:"Bu bayrak hangi ülkeye aittir?", a:"Peru",       b:"Kolombiya",  c:"Ekvador",     d:"Venezüela",  e:"Bolivya",    correct:"E", cat:"Görsel - Bayraklar", img:FLAG("Bolivia.svg") },
  { q:"Bu bayrak hangi ülkeye aittir?", a:"Guatemala",  b:"Honduras",   c:"Costa Rica",  d:"El Salvador",e:"Nikaragua",  correct:"C", cat:"Görsel - Bayraklar", img:FLAG("Costa_Rica.svg") },
  // Afrika
  { q:"Bu bayrak hangi ülkeye aittir?", a:"Nijerya",    b:"Gana",       c:"Fildişi Sahili",d:"Togo",     e:"Benim",      correct:"B", cat:"Görsel - Bayraklar", img:FLAG("Ghana.svg") },
  { q:"Bu bayrak hangi ülkeye aittir?", a:"Gana",       b:"Mali",       c:"Senegal",     d:"Gambiya",    e:"Gine",       correct:"C", cat:"Görsel - Bayraklar", img:FLAG("Senegal.svg") },
  { q:"Bu bayrak hangi ülkeye aittir?", a:"Libya",      b:"Cezayir",    c:"Tunus",       d:"Fas",        e:"Mısır",      correct:"C", cat:"Görsel - Bayraklar", img:FLAG("Tunisia.svg") },
  { q:"Bu bayrak hangi ülkeye aittir?", a:"Etiyopya",   b:"Eritre",     c:"Kenya",       d:"Kamerun",    e:"Gabon",      correct:"A", cat:"Görsel - Bayraklar", img:FLAG("Ethiopia.svg") },
  { q:"Bu bayrak hangi ülkeye aittir?", a:"Tanzanya",   b:"Mozambik",   c:"Malawi",      d:"Zambia",     e:"Zimbabwe",   correct:"D", cat:"Görsel - Bayraklar", img:FLAG("Zambia.svg") },
  // Diğer
  { q:"Bu bayrak hangi ülkeye aittir?", a:"Kazakistan", b:"Özbekistan", c:"Türkmenistan",d:"Azerbaycan", e:"Kırgızistan",correct:"C", cat:"Görsel - Bayraklar", img:FLAG("Turkmenistan.svg") },
  { q:"Bu bayrak hangi ülkeye aittir?", a:"Finlandiya", b:"İzlanda",    c:"Letonya",     d:"Litvanya",   e:"Belarus",    correct:"E", cat:"Görsel - Bayraklar", img:FLAG("Belarus.svg") },
  { q:"Bu bayrak hangi ülkeye aittir?", a:"Jamaika",    b:"Trinidad",   c:"Barbados",    d:"Belize",     e:"Dominik",    correct:"A", cat:"Görsel - Bayraklar", img:FLAG("Jamaica.svg") },
];

// ──────────────────────────────────────────────────
// 2. FUTBOL KULÜBÜ ARMALAARI
// ──────────────────────────────────────────────────
const footballClubs = [
  { q:"Bu arma hangi futbol kulübüne aittir?", a:"Ajax Amsterdam",  b:"PSV Eindhoven",  c:"Feyenoord",     d:"AZ Alkmaar",   e:"Utrecht",       correct:"A", cat:"Görsel - Spor", img:IMG("AFC_Ajax.svg") },
  { q:"Bu arma hangi futbol kulübüne aittir?", a:"Benfica",         b:"Sporting CP",    c:"Porto",         d:"Braga",        e:"Vitória",       correct:"C", cat:"Görsel - Spor", img:IMG("FC_Porto.svg") },
  { q:"Bu arma hangi futbol kulübüne aittir?", a:"Porto",           b:"Benfica",        c:"Sporting CP",   d:"Braga",        e:"Gil Vicente",   correct:"B", cat:"Görsel - Spor", img:IMG("SL_Benfica.svg") },
  { q:"Bu arma hangi futbol kulübüne aittir?", a:"Celtic",          b:"Rangers",        c:"Hearts",        d:"Aberdeen",     e:"Hibernian",     correct:"B", cat:"Görsel - Spor", img:IMG("Rangers_FC_logo.svg") },
  { q:"Bu arma hangi futbol kulübüne aittir?", a:"Rangers",         b:"Celtic",         c:"Hearts",        d:"Dundee",       e:"Motherwell",    correct:"A", cat:"Görsel - Spor", img:IMG("Celtic_FC.svg") },
  { q:"Bu arma hangi futbol kulübüne aittir?", a:"Napoli",          b:"AS Roma",        c:"Lazio",         d:"Fiorentina",   e:"Atalanta",      correct:"B", cat:"Görsel - Spor", img:IMG("AS_Roma_logo_(2017).svg") },
  { q:"Bu arma hangi futbol kulübüne aittir?", a:"Olympique Marsilya", b:"AS Monaco",  c:"Nice",          d:"Lyon",         e:"Bordeaux",      correct:"A", cat:"Görsel - Spor", img:IMG("Olympique_de_Marseille_logo.svg") },
  { q:"Bu arma hangi futbol kulübüne aittir?", a:"Boca Juniors",    b:"River Plate",    c:"San Lorenzo",   d:"Racing Club",  e:"Independiente", correct:"B", cat:"Görsel - Spor", img:IMG("Club_Atletico_River_Plate.svg") },
  { q:"Bu arma hangi futbol kulübüne aittir?", a:"River Plate",     b:"Boca Juniors",   c:"Vélez Sársfield",d:"Huracán",     e:"Lanús",         correct:"A", cat:"Görsel - Spor", img:IMG("Boca_Juniors_logo18.svg") },
  { q:"Bu arma hangi futbol kulübüne aittir?", a:"Galatasaray",     b:"Fenerbahçe",     c:"Beşiktaş",      d:"Trabzonspor",  e:"Başakşehir",    correct:"B", cat:"Görsel - Spor", img:IMG("Fenerbahce_SK.svg") },
  { q:"Bu arma hangi futbol kulübüne aittir?", a:"Anderlecht",      b:"Club Brugge",    c:"Standard Liège",d:"Genk",         e:"Gent",          correct:"A", cat:"Görsel - Spor", img:IMG("RSC_Anderlecht.svg") },
  { q:"Bu arma hangi futbol kulübüne aittir?", a:"PSV Eindhoven",   b:"Ajax Amsterdam", c:"Feyenoord",     d:"Twente",       e:"Groningen",     correct:"A", cat:"Görsel - Spor", img:IMG("PSV_Eindhoven.svg") },
  { q:"Bu arma hangi futbol kulübüne aittir?", a:"Flamengo",        b:"Santos",         c:"São Paulo",     d:"Corinthians",  e:"Palmeiras",     correct:"A", cat:"Görsel - Spor", img:IMG("Clube_de_Regatas_do_Flamengo_logo.svg") },
  { q:"Bu arma hangi futbol kulübüne aittir?", a:"Rosenborg",       b:"Brøndby",        c:"Malmö FF",      d:"IFK Göteborg", e:"Djurgårdens",   correct:"C", cat:"Görsel - Spor", img:IMG("Malmö_FF.svg") },
  { q:"Bu arma hangi futbol kulübüne aittir?", a:"Dinamo Zagreb",   b:"Hajduk Split",   c:"NK Rijeka",     d:"Osijek",       e:"Lokomotiv Zagreb", correct:"B", cat:"Görsel - Spor", img:IMG("HNK_Hajduk_Split_logo.svg") },
];

// ──────────────────────────────────────────────────
// 3. BASKETBOL TAKIMI LOGOLARI (NBA)
// ──────────────────────────────────────────────────
const basketballTeams = [
  { q:"Bu logo hangi NBA takımına aittir?", a:"Chicago Bulls",      b:"Miami Heat",       c:"Houston Rockets",d:"Portland Trail Blazers",e:"Indiana Pacers", correct:"A", cat:"Görsel - Spor", img:IMG("Chicago_Bulls_logo.svg") },
  { q:"Bu logo hangi NBA takımına aittir?", a:"Boston Celtics",     b:"Orlando Magic",    c:"Miami Heat",     d:"Atlanta Hawks",  e:"Charlotte Hornets",correct:"C", cat:"Görsel - Spor", img:IMG("Miami_Heat.svg") },
  { q:"Bu logo hangi NBA takımına aittir?", a:"Oklahoma City Thunder",b:"Denver Nuggets", c:"Utah Jazz",      d:"Memphis Grizzlies",e:"New Orleans Pelicans",correct:"A", cat:"Görsel - Spor", img:IMG("Oklahoma_City_Thunder.svg") },
  { q:"Bu logo hangi NBA takımına aittir?", a:"Sacramento Kings",   b:"Houston Rockets",  c:"Denver Nuggets", d:"Phoenix Suns",   e:"Utah Jazz",     correct:"C", cat:"Görsel - Spor", img:IMG("Denver_Nuggets.svg") },
  { q:"Bu logo hangi NBA takımına aittir?", a:"Milwaukee Bucks",    b:"Indiana Pacers",   c:"Detroit Pistons",d:"Toronto Raptors", e:"Cleveland Cavaliers", correct:"A", cat:"Görsel - Spor", img:IMG("Milwaukee_Bucks.svg") },
  { q:"Bu logo hangi NBA takımına aittir?", a:"Houston Rockets",    b:"Chicago Bulls",    c:"Oklahoma City",  d:"Portland Trail Blazers",e:"Sacramento Kings", correct:"A", cat:"Görsel - Spor", img:IMG("Houston_Rockets.svg") },
  { q:"Bu logo hangi NBA takımına aittir?", a:"Utah Jazz",          b:"Memphis Grizzlies",c:"Oklahoma City",  d:"Denver Nuggets", e:"New Orleans Pelicans", correct:"B", cat:"Görsel - Spor", img:IMG("Memphis_Grizzlies.svg") },
  { q:"Bu logo hangi NBA takımına aittir?", a:"Portland Trail Blazers",b:"Houston Rockets",c:"Chicago Bulls", d:"Indiana Pacers", e:"Sacramento Kings", correct:"A", cat:"Görsel - Spor", img:IMG("Portland_Trail_Blazers_logo.svg") },
  { q:"Bu logo hangi NBA takımına aittir?", a:"Toronto Raptors",    b:"Milwaukee Bucks",  c:"Indiana Pacers", d:"Charlotte Hornets",e:"Orlando Magic", correct:"A", cat:"Görsel - Spor", img:IMG("Toronto_Raptors_logo.svg") },
  { q:"Bu logo hangi NBA takımına aittir?", a:"Minnesota Timberwolves",b:"Utah Jazz",     c:"Memphis Grizzlies",d:"Oklahoma City",e:"New Orleans Pelicans",correct:"A", cat:"Görsel - Spor", img:IMG("Minnesota_Timberwolves.svg") },
  { q:"Bu logo hangi NBA takımına aittir?", a:"Indiana Pacers",     b:"Milwaukee Bucks",  c:"Cleveland Cavaliers",d:"Detroit Pistons",e:"Chicago Bulls", correct:"A", cat:"Görsel - Spor", img:IMG("Indiana_Pacers.svg") },
  { q:"Bu logo hangi NBA takımına aittir?", a:"New Orleans Pelicans",b:"Memphis Grizzlies",c:"Charlotte Hornets",d:"Atlanta Hawks",e:"Orlando Magic",  correct:"A", cat:"Görsel - Spor", img:IMG("New_Orleans_Pelicans.svg") },
  { q:"Bu logo hangi NBA takımına aittir?", a:"Sacramento Kings",   b:"Phoenix Suns",     c:"Denver Nuggets", d:"Utah Jazz",      e:"Dallas Mavericks",correct:"A", cat:"Görsel - Spor", img:IMG("Sacramento_Kings.svg") },
  { q:"Bu logo hangi NBA takımına aittir?", a:"Brooklyn Nets",      b:"New York Knicks",  c:"Boston Celtics", d:"Philadelphia 76ers",e:"Toronto Raptors",correct:"A", cat:"Görsel - Spor", img:IMG("Brooklyn_Nets.svg") },
  { q:"Bu logo hangi NBA takımına aittir?", a:"Utah Jazz",          b:"Denver Nuggets",   c:"Oklahoma City",  d:"Sacramento Kings",e:"New Orleans Pelicans",correct:"A", cat:"Görsel - Spor", img:IMG("Utah_Jazz_logo.svg") },
];

// ──────────────────────────────────────────────────
// 4. MÜZİK – TÜRKÇE ŞARKI SÖZLERİ
// ──────────────────────────────────────────────────
const turkishLyrics = [
  { q:"'Ah şu gurbet, ne çekilir şey, ne çekilir...' Bu sözler hangi şarkıya aittir?", a:"Dönence",           b:"Kara Sevda",     c:"Halхалep Te Soran", d:"Sarı Çizmeli Mehtap", e:"Gülpembe", correct:"A", cat:"Müzik" },
  { q:"'Sarı çizmeli Mehtap, nereden çıktın karşıma...' Bu sözler hangi şarkıya aittir?", a:"Dönence",        b:"Sarı Çizmeli Mehtap", c:"Gülpembe",    d:"Kara Sevda",      e:"Lambaya Püf De", correct:"B", cat:"Müzik" },
  { q:"'Gülpembe güzelim, gözlerin sürmeli...' Bu sözler hangi şarkıya aittir?", a:"Sarı Çizmeli Mehtap", b:"Lambaya Püf De", c:"Gülpembe",       d:"Dönence",         e:"Kara Sevda",  correct:"C", cat:"Müzik" },
  { q:"'Ben sana mecburum, bilmiyorum neden...' Bu sözler hangi şarkıya aittir?", a:"Git",                  b:"Firuze",         c:"Geri Dön",        d:"Seni Seviyorum",  e:"Hadi Bakalım", correct:"B", cat:"Müzik" },
  { q:"'Git, artık git, bırak beni gitsin...' Bu sözler hangi şarkıya aittir?", a:"Firuze",                 b:"Hadi Bakalım",   c:"Geri Dön",        d:"Git",             e:"Seni Seviyorum", correct:"D", cat:"Müzik" },
  { q:"'Şımarık şımarık beni seviyorsun...' Bu sözler hangi şarkıya aittir?", a:"Kuzu Kuzu",               b:"Şımarık",        c:"Acı Aşk",         d:"Dudu",            e:"Adım Adım",   correct:"B", cat:"Müzik" },
  { q:"'Biz de gideriz, biz de gideriz aynı yollara...' Bu sözler hangi şarkıya aittir?", a:"Her Şey Seninle Güzel", b:"Eski Dost", c:"Gözlerinin Hapishanesinde", d:"Bir Derdim Var", e:"Yokluğunda", correct:"B", cat:"Müzik" },
  { q:"'Yağmur yağıyordu seni gördüğümde, şemsiyeni uzattın...' Bu sözler hangi şarkıya aittir?", a:"Eski Dost", b:"Her Şey Seninle Güzel", c:"Senden Öte", d:"Yokluğunda", e:"Vazgeçemem", correct:"B", cat:"Müzik" },
  { q:"'Asi asiiiii, asi kız...' Bu sözler hangi şarkıya aittir?", a:"Yalnızca Sen",                       b:"Sabah Olur",     c:"Asi",             d:"Haydi Söyle",     e:"Kırık Kalpler", correct:"C", cat:"Müzik" },
  { q:"'Yüksek ateş, yüksek ateş içimde...' Bu sözler hangi şarkıya aittir?", a:"Ateş Olmadan Duman Olmaz", b:"Yüksek Ateş", c:"Bir Derdim Var",  d:"Her Şeyi Yak",    e:"Uçtu Gönlüm", correct:"B", cat:"Müzik" },
  { q:"'Ne diyeyim, ne diyeyim, ne diyeyim sana...' Bu sözler hangi şarkıya aittir?", a:"Eski Dost",       b:"Bir Derdim Var", c:"Her Şey Seninle Güzel", d:"Senden Öte", e:"Yalnız Değilim", correct:"A", cat:"Müzik" },
  { q:"'Masum değiliz, masum değiliz hiçbirimiz...' Bu sözler hangi şarkıya aittir?", a:"Dünya Yalan",     b:"Her Şeyi Yak",   c:"Masum Değiliz",   d:"Cambaz",          e:"Seni Kendime Sakladım", correct:"C", cat:"Müzik" },
  { q:"'Her şeyi yak, her şeyi...' Bu sözler hangi şarkıya aittir?", a:"Masum Değiliz",                   b:"Her Şeyi Yak",   c:"Dünya Yalan",     d:"Cambaz",          e:"Beni Benimle Bırak", correct:"B", cat:"Müzik" },
  { q:"'Beni benimle bırak, git...' Bu sözler hangi şarkıya aittir?", a:"Her Şeyi Yak",                   b:"Masum Değiliz",  c:"Beni Benimle Bırak", d:"Yüksek Ateş",  e:"Uçtu Gönlüm", correct:"C", cat:"Müzik" },
  { q:"'Adı aşk, adı aşk, bu acının adı aşk...' Bu sözler hangi şarkıya aittir?", a:"Acı Aşk",            b:"Aşk Hikayesi",   c:"Adı Aşk",         d:"Seviyorum Seni",  e:"Aşka Düştüm", correct:"C", cat:"Müzik" },
  { q:"'Cemalim, cemalim, ah cemalim...' Bu sözler hangi şarkıya aittir?", a:"Dönence",                   b:"Cemalim",        c:"Gülpembe",        d:"Sarı Çizmeli Mehtap", e:"Kara Sevda", correct:"B", cat:"Müzik" },
  { q:"'Tamirci çırağı, yağlı ellerinde...' Bu sözler hangi şarkıya aittir?", a:"Emmi",                   b:"Mutlu Ol Yeter", c:"Tamirci Çırağı",  d:"Çirkin Dünya",    e:"Resimdeki Gözyaşları", correct:"C", cat:"Müzik" },
  { q:"'Bir eylül akşamı, güneş batarken...' Bu sözler hangi şarkıya aittir?", a:"Firuze",                 b:"Bir Eylül Akşamı", c:"Git",           d:"Hadi Bakalım",    e:"Seni Seviyorum", correct:"B", cat:"Müzik" },
  { q:"'Seni seviyorum, seni seviyorum, her gün biraz daha...' Bu sözler hangi şarkıya aittir?", a:"Seni Seviyorum", b:"Aşk Hikayesi", c:"Firuze",  d:"Ben Sana Aşığım", e:"Seviyorum Seni", correct:"A", cat:"Müzik" },
  { q:"'Dağlar dağlar, duman dağlar...' Bu sözler hangi şarkıya aittir?", a:"Yeşil Dağlar",               b:"Dağlar Dağlar",  c:"Çukurova",        d:"Ana Gibi Yar Olmaz", e:"Kınalı Keklik", correct:"B", cat:"Müzik" },
  { q:"'Neredesin sen, ben seni çok özledim...' Bu sözler hangi şarkıya aittir?", a:"Geri Dön",            b:"Özledim",        c:"Git Bakalım",     d:"Seni Arıyorum",   e:"Kayıplar", correct:"B", cat:"Müzik" },
  { q:"'Silah, silah, elimde silah var...' Bu sözler hangi şarkıya aittir?", a:"Başka Yol",               b:"Silah",          c:"Her Şeyi Yak",    d:"Savaş",           e:"Kahraman", correct:"B", cat:"Müzik" },
  { q:"'Hatırla sevgili, hatırla o günleri...' Bu sözler hangi şarkıya aittir?", a:"Hatırla Sevgili",     b:"Eski Dost",      c:"Geçmişe Selam",   d:"Anlar Mısın",     e:"Bir Zamanlar", correct:"A", cat:"Müzik" },
  { q:"'Petrol, petrol, petrol benim adım petrol...' Bu sözler hangi şarkıya aittir?", a:"Süperstar",       b:"Petrol",         c:"Kral Benim",      d:"Dünya Benim",     e:"Pop Star", correct:"B", cat:"Müzik" },
  { q:"'Super star, super star, olmak istiyorum super star...' Bu sözler hangi şarkıya aittir?", a:"Petrol", b:"Kral Benim",    c:"Super Star",      d:"Pop Star",        e:"Dünya Benim", correct:"C", cat:"Müzik" },
  { q:"'Yiğidim aslanım, yüksekten uçanım...' Bu sözler hangi şarkıya aittir?", a:"Yiğidim Aslanım",     b:"Dönence",        c:"Seni Yazdım Kalbime", d:"Kara Sevda",   e:"Gülpembe", correct:"A", cat:"Müzik" },
  { q:"'Affet beni, affet, yanlış yaptım biliyorum...' Bu sözler hangi şarkıya aittir?", a:"Hata",          b:"Yanlış",         c:"Affet",           d:"Özür",            e:"Pişman Oldum", correct:"C", cat:"Müzik" },
  { q:"'Her yerde kar var, şehir bembeyaz...' Bu sözler hangi şarkıya aittir?", a:"Kış Hikayesi",          b:"Her Yerde Kar Var", c:"Beyaz Kar",     d:"Karadeniz Akşamı",e:"Soğuk Şehir", correct:"B", cat:"Müzik" },
  { q:"'Hayatımı karartma, yeter artık...' Bu sözler hangi şarkıya aittir?", a:"Kızıl Goncalar",          b:"Gitme",          c:"Hayatımı Karartma",d:"Yeter Artık",     e:"Dur Bir Dakika", correct:"C", cat:"Müzik" },
  { q:"'Eski sevgilim, eski sevgilim, aklımdan çıkmıyorsun...' Bu sözler hangi şarkıya aittir?", a:"Hep Aynı", b:"Eski Sevgilim", c:"Ayrılık",      d:"Seni Unutamam",   e:"Geçmiş Olsun", correct:"B", cat:"Müzik" },
];

// ──────────────────────────────────────────────────
// 5. MÜZİK – ULUSLARARASI ŞARKI SÖZLERİ
// ──────────────────────────────────────────────────
const intlLyrics = [
  { q:"'Is this the real life? Is this just fantasy? Caught in a landslide...' Bu sözler hangi şarkıya aittir?", a:"Killer Queen",      b:"Bohemian Rhapsody", c:"We Will Rock You",d:"Don't Stop Me Now", e:"Under Pressure", correct:"B", cat:"Müzik" },
  { q:"'On a dark desert highway, cool wind in my hair...' Bu sözler hangi şarkıya aittir?", a:"Take It Easy",       b:"Life in the Fast Lane", c:"Hotel California", d:"Desperado",     e:"One of These Nights", correct:"C", cat:"Müzik" },
  { q:"'I hear the drums echoing tonight, but she hears only whispers...' Bu sözler hangi şarkıya aittir?", a:"Rosanna",         b:"I'll Be Over You",  c:"Africa",          d:"Pamela",          e:"Hold the Line", correct:"C", cat:"Müzik" },
  { q:"'Yesterday, all my troubles seemed so far away...' Bu sözler hangi şarkıya aittir?", a:"Let It Be",         b:"Hey Jude",          c:"Yesterday",       d:"Come Together",   e:"Blackbird", correct:"C", cat:"Müzik" },
  { q:"'So close, no matter how far, couldn't be much more from the heart...' Bu sözler hangi şarkıya aittir?", a:"Enter Sandman",  b:"The Unforgiven",    c:"Nothing Else Matters", d:"Fade to Black", e:"Master of Puppets", correct:"C", cat:"Müzik" },
  { q:"'Tommy used to work on the docks, union's been on strike...' Bu sözler hangi şarkıya aittir?", a:"You Give Love a Bad Name", b:"Livin' on a Prayer", c:"Bad Medicine", d:"Wanted Dead or Alive", e:"Born to Be My Baby", correct:"B", cat:"Müzik" },
  { q:"'Hello, is it me you're looking for? I can see it in your eyes...' Bu sözler hangi şarkıya aittir?", a:"All Night Long",  b:"Running with the Night", c:"Dancing on the Ceiling", d:"Hello",        e:"Say You Say Me", correct:"D", cat:"Müzik" },
  { q:"'I came in like a wrecking ball, I never hit so hard in love...' Bu sözler hangi şarkıya aittir?", a:"Party in the U.S.A.", b:"Wrecking Ball",   c:"Malibu",          d:"Flowers",         e:"Midnight Sky", correct:"B", cat:"Müzik" },
  { q:"'Just a small town girl, living in a lonely world...' Bu sözler hangi şarkıya aittir?", a:"Any Way You Want It", b:"Who's Crying Now", c:"Faithfully",     d:"Open Arms",       e:"Don't Stop Believin'", correct:"E", cat:"Müzik" },
  { q:"'Every breath you take, every move you make, I'll be watching you...' Bu sözler hangi şarkıya aittir?", a:"Roxanne",         b:"Message in a Bottle", c:"Every Breath You Take", d:"Don't Stand So Close to Me", e:"Walking on the Moon", correct:"C", cat:"Müzik" },
  { q:"'I want to break free, I want to break free from your lies...' Bu sözler hangi şarkıya aittir?", a:"I Was Born to Love You", b:"I Want to Break Free", c:"Somebody to Love", d:"Under Pressure", e:"Killer Queen", correct:"B", cat:"Müzik" },
  { q:"'Cause I'm easy come, easy go, little high, little low...' Bu sözler hangi şarkıya aittir?", a:"Don't Stop Me Now", b:"We Are the Champions", c:"Bohemian Rhapsody", d:"Killer Queen",   e:"Radio Ga Ga", correct:"C", cat:"Müzik" },
  { q:"'With the lights out, it's less dangerous, here we are now, entertain us...' Bu sözler hangi şarkıya aittir?", a:"Come as You Are", b:"Lithium",         c:"In Bloom",        d:"Smells Like Teen Spirit", e:"Heart-Shaped Box", correct:"D", cat:"Müzik" },
  { q:"'And I would walk 500 miles and I would walk 500 more...' Bu sözler hangi şarkıya aittir?", a:"500 Miles",        b:"Letter from America", c:"I'm Gonna Be (500 Miles)", d:"Don't You Forget About Me", e:"Sunshine on Leith", correct:"C", cat:"Müzik" },
  { q:"'Highway to hell, I'm on the highway to hell...' Bu sözler hangi şarkıya aittir?", a:"Back in Black",     b:"Thunderstruck",     c:"You Shook Me All Night Long", d:"Highway to Hell", e:"Hells Bells", correct:"D", cat:"Müzik" },
];

// ──────────────────────────────────────────────────
// YARDIMCI
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
  const allQuestions = [
    ...hardFlags,
    ...footballClubs,
    ...basketballTeams,
    ...turkishLyrics,
    ...intlLyrics,
  ];

  console.log(`Toplam yüklenecek soru: ${allQuestions.length}`);
  let inserted = 0;
  let skipped = 0;
  let ti = 0;

  for (const item of allQuestions) {
    // Şıkları topla
    const raw = [
      { L:'A', t: item.a }, { L:'B', t: item.b }, { L:'C', t: item.c },
      { L:'D', t: item.d }, { L:'E', t: item.e },
    ].filter(o => o.t);

    const n = raw.length;
    const correct = raw.find(o => o.L === item.correct);
    if (!correct) { console.warn('Cevap eşleşmedi, atlandı:', item.q); continue; }

    // Round-robin dengeli yerleştirme
    const others = shuffle(raw.filter(o => o.L !== item.correct).map(o => o.t));
    const pos = ti % n;
    const finals = [];
    let oi = 0;
    for (let p = 0; p < n; p++) finals.push(p === pos ? correct.t : others[oi++]);

    const newCorrect = LETTERS[pos];
    const [oa, ob, oc, od, oe] = finals;
    const img = item.img || null;

    // Duplikat koruma: aynı soru + aynı option_a varsa atla
    const existing = await sql`SELECT id FROM quiz_questions WHERE question = ${item.q} AND option_a = ${oa} LIMIT 1`;
    if (existing.length > 0) { skipped++; continue; }

    await sql`
      INSERT INTO quiz_questions (question, option_a, option_b, option_c, option_d, option_e, image_url, correct_option, category)
      VALUES (${item.q}, ${oa}, ${ob}, ${oc}, ${od}, ${oe}, ${img}, ${newCorrect}, ${item.cat})
    `;
    ti++;
    inserted++;
  }

  const total = await sql`SELECT COUNT(*)::int as cnt FROM quiz_questions`;
  const dist  = await sql`SELECT correct_option, COUNT(*)::int as c FROM quiz_questions GROUP BY correct_option ORDER BY correct_option`;
  const imgs  = await sql`SELECT COUNT(*)::int as c FROM quiz_questions WHERE image_url IS NOT NULL AND image_url <> ''`;
  const music = await sql`SELECT COUNT(*)::int as c FROM quiz_questions WHERE category = 'Müzik'`;

  console.log(`\nEklendi: ${inserted} | Atlandı (mevcut): ${skipped}`);
  console.log(`Toplam soru: ${total[0].cnt}`);
  console.log(`Görselli soru: ${imgs[0].c}`);
  console.log(`Müzik sorusu: ${music[0].c}`);
  console.log(`Cevap dağılımı:`, Object.fromEntries(dist.map(r => [r.correct_option, r.c])));
  process.exit(0);
}

run().catch(e => { console.error(e); process.exit(1); });
