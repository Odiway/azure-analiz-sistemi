const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const envContent = fs.readFileSync('.env', 'utf-8');
const dbUrl = envContent.split('\n').find(l => l.startsWith('DATABASE_URL=')).replace('DATABASE_URL=', '').trim();
const sql = neon(dbUrl);

// Yazılım/programlama ile ilgili silinecek sorulardaki anahtar kelimeler
const softwareKeywords = [
  'IPv6', 'NoSQL', 'veritabanı', 'Linux', 'TypeScript', 'React', 'Docker', 'REST API',
  'SOLID prensip', 'Big-O', 'SQL', 'hash fonksiyon', 'cache bellek', 'message queue',
  'programlama paradigma', 'programlama dili', 'OSI model', 'TCP/IP', 'container',
  'Git versiyon', 'HTTP durum', 'DNS ne işe', 'şifreleme algoritma', 'WebSocket',
  'fonksiyonel programlama', 'Kubernetes', 'Dockerfile', 'bulut bilişim', 'Jenkins',
  'siber güvenlik', 'Refactoring', 'Figma', 'MongoDB', 'PostgreSQL', 'Cassandra',
  'Redis', 'Nginx', 'Apache', 'RabbitMQ', 'işletim sistemi çekirdeğ', 'kuantum bilgisayar',
  'CPU', 'PARALLEL JOIN', 'Merge Sort', 'Bubble Sort', 'Selection Sort', 'Insertion Sort',
  'programlama dili', 'terabayt', 'gigabayt', 'IPv6', 'CATIA', 'FEA', 'CFD', 'CAD', 'ERP',
  'Hangisi bir programlama'
];

// Yeni Futbol soruları
const footballQuestions = [
  { q: "FIFA Dünya Kupası'nı en çok kazanan ülke hangisidir?", a: "Almanya", b: "İtalya", c: "Brezilya", d: "Arjantin", correct: "C", cat: "Futbol" },
  { q: "Cristiano Ronaldo hangi ülkelidir?", a: "Brezilya", b: "İspanya", c: "Portekiz", d: "İtalya", correct: "C", cat: "Futbol" },
  { q: "Şampiyonlar Ligi'ni en çok kazanan kulüp hangisidir?", a: "Barcelona", b: "AC Milan", c: "Real Madrid", d: "Bayern Münih", correct: "C", cat: "Futbol" },
  { q: "2022 FIFA Dünya Kupası hangi ülkede düzenlendi?", a: "Rusya", b: "Katar", c: "BAE", d: "Suudi Arabistan", correct: "B", cat: "Futbol" },
  { q: "Galatasaray hangi yılda UEFA Kupası'nı kazandı?", a: "1999", b: "2000", c: "2001", d: "2002", correct: "B", cat: "Futbol" },
  { q: "Bir futbol maçında normal süre kaç dakikadır?", a: "80", b: "85", c: "90", d: "100", correct: "C", cat: "Futbol" },
  { q: "Ofsayt kuralı hangi yıl FIFA tarafından kabul edildi?", a: "1863", b: "1925", c: "1950", d: "1970", correct: "B", cat: "Futbol" },
  { q: "Lionel Messi kaç Ballon d'Or ödülü kazanmıştır?", a: "5", b: "6", c: "7", d: "8", correct: "D", cat: "Futbol" },
  { q: "Premier Lig'in en çok gol atan oyuncusu kimdir?", a: "Wayne Rooney", b: "Thierry Henry", c: "Alan Shearer", d: "Andrew Cole", correct: "C", cat: "Futbol" },
  { q: "Fenerbahçe kaç kez Türkiye Süper Lig şampiyonu olmuştur?", a: "19", b: "21", c: "25", d: "28", correct: "A", cat: "Futbol" },
  { q: "Maradona'nın 'Tanrı'nın Eli' golü hangi Dünya Kupası'nda atıldı?", a: "1982", b: "1986", c: "1990", d: "1994", correct: "B", cat: "Futbol" },
  { q: "Hangi futbolcu 'CR7' lakabıyla bilinir?", a: "Carlos Roberto", b: "Cristiano Ronaldo", c: "Claudio Reyna", d: "Cafu Roberto", correct: "B", cat: "Futbol" },
  { q: "La Liga'da en çok gol atan oyuncu kimdir?", a: "Cristiano Ronaldo", b: "Raul", c: "Lionel Messi", d: "Telmo Zarra", correct: "C", cat: "Futbol" },
  { q: "İlk FIFA Dünya Kupası hangi yılda düzenlendi?", a: "1926", b: "1930", c: "1934", d: "1938", correct: "B", cat: "Futbol" },
  { q: "İlk Dünya Kupası'nı hangi ülke kazandı?", a: "Brezilya", b: "Arjantin", c: "Uruguay", d: "İtalya", correct: "C", cat: "Futbol" },
  { q: "Beşiktaş'ın stadyumu hangisidir?", a: "Ali Sami Yen", b: "Tüpraş Stadyumu", c: "Atatürk Olimpiyat", d: "Şükrü Saracoğlu", correct: "B", cat: "Futbol" },
  { q: "VAR teknolojisi ilk hangi Dünya Kupası'nda kullanıldı?", a: "2014", b: "2018", c: "2022", d: "2010", correct: "B", cat: "Futbol" },
  { q: "UEFA Avrupa Şampiyonası kaç yılda bir düzenlenir?", a: "2", b: "3", c: "4", d: "5", correct: "C", cat: "Futbol" },
  { q: "Hangi futbolcu 'Kral' lakabıyla anılır (Türkiye)?", a: "Hakan Şükür", b: "Metin Oktay", c: "Lefter Küçükandonyadis", d: "Tanju Çolak", correct: "B", cat: "Futbol" },
  { q: "2024 Avrupa Şampiyonası hangi ülkede düzenlendi?", a: "İngiltere", b: "Fransa", c: "Almanya", d: "İspanya", correct: "C", cat: "Futbol" },
  { q: "Hangi futbolcu tek bir Dünya Kupası'nda en çok gol atmıştır?", a: "Pelé", b: "Just Fontaine", c: "Miroslav Klose", d: "Gerd Müller", correct: "B", cat: "Futbol" },
  { q: "Trabzonspor hangi yılda Süper Lig şampiyonu oldu (en son)?", a: "2020", b: "2021", c: "2022", d: "2023", correct: "C", cat: "Futbol" },
  { q: "Bir futbol sahasının uzunluğu yaklaşık kaç metredir?", a: "80-90", b: "90-120", c: "120-140", d: "140-160", correct: "B", cat: "Futbol" },
  { q: "Neymar hangi ülkelidir?", a: "Arjantin", b: "Kolombiya", c: "Brezilya", d: "Portekiz", correct: "C", cat: "Futbol" },
  { q: "Bayern Münih hangi ülkenin kulübüdür?", a: "Avusturya", b: "İsviçre", c: "Hollanda", d: "Almanya", correct: "D", cat: "Futbol" },
  { q: "Dünya Kupası tarihinde en çok gol atan oyuncu kimdir?", a: "Ronaldo", b: "Pelé", c: "Miroslav Klose", d: "Gerd Müller", correct: "C", cat: "Futbol" },
  { q: "Hangisi İstanbul derbisi sayılmaz?", a: "Galatasaray-Fenerbahçe", b: "Beşiktaş-Galatasaray", c: "Fenerbahçe-Trabzonspor", d: "Beşiktaş-Fenerbahçe", correct: "C", cat: "Futbol" },
  { q: "El Clasico hangi iki takım arasında oynanır?", a: "Milan-Inter", b: "Real Madrid-Barcelona", c: "Liverpool-ManUtd", d: "Bayern-Dortmund", correct: "B", cat: "Futbol" },
  { q: "Hakan Şükür, 2002 Dünya Kupası'nda kaçıncı saniyede gol attı?", a: "7", b: "11", c: "15", d: "20", correct: "B", cat: "Futbol" },
  { q: "Futbolda kırmızı kart ne anlama gelir?", a: "Uyarı", b: "Oyundan atılma", c: "Penaltı", d: "Faul", correct: "B", cat: "Futbol" },
  { q: "Manchester United'ın efsanevi stadyumu hangisidir?", a: "Anfield", b: "Stamford Bridge", c: "Old Trafford", d: "Emirates", correct: "C", cat: "Futbol" },
  { q: "Hangi ülke 2014 Dünya Kupası'nda 7-1 yenildi?", a: "İspanya", b: "İtalya", c: "Brezilya", d: "Arjantin", correct: "C", cat: "Futbol" },
  { q: "Galatasaray'ın en çok gol atan yabancı oyuncusu kimdir?", a: "Hagi", b: "Muslera", c: "Drogba", d: "Icardi", correct: "A", cat: "Futbol" },
  { q: "Liverpool'un meşhur marşı hangisidir?", a: "We Are The Champions", b: "You'll Never Walk Alone", c: "Glory Glory", d: "Hala Madrid", correct: "B", cat: "Futbol" },
  { q: "Erling Haaland hangi ülkelidir?", a: "İsveç", b: "Danimarka", c: "Norveç", d: "Finlandiya", correct: "C", cat: "Futbol" },
  { q: "Kylian Mbappé hangi kulüpte forma giydi (2024)?", a: "PSG", b: "Real Madrid", c: "Manchester City", d: "Barcelona", correct: "B", cat: "Futbol" },
  { q: "Serie A hangi ülkenin futbol ligidir?", a: "İspanya", b: "Fransa", c: "İtalya", d: "Almanya", correct: "C", cat: "Futbol" },
  { q: "Futbol topunun ağırlığı yaklaşık kaç gramdır?", a: "250-300", b: "350-400", c: "410-450", d: "500-550", correct: "C", cat: "Futbol" },
  { q: "Türkiye A Milli Takımı 2008 Euro'da kaçıncı oldu?", a: "Çeyrek final", b: "Yarı final", c: "Final", d: "Grup aşaması", correct: "B", cat: "Futbol" },
  { q: "Diego Maradona hangi kulüpte efsane oldu?", a: "AC Milan", b: "Juventus", c: "Napoli", d: "Inter", correct: "C", cat: "Futbol" },
  { q: "Zinedine Zidane'ın kırmızı kart gördüğü 2006 finali kime karşıydı?", a: "Brezilya", b: "Almanya", c: "İtalya", d: "Portekiz", correct: "C", cat: "Futbol" },
  { q: "Bir futbol takımında sahada kaç oyuncu bulunur?", a: "9", b: "10", c: "11", d: "12", correct: "C", cat: "Futbol" },
  { q: "Şampiyonlar Ligi'nin eski adı neydi?", a: "UEFA Cup", b: "Avrupa Kupası", c: "Avrupa Şampiyon Kulüpler Kupası", d: "Kıtalar Kupası", correct: "C", cat: "Futbol" },
  { q: "Luka Modric hangi ülkelidir?", a: "Sırbistan", b: "Slovenya", c: "Hırvatistan", d: "Bosna Hersek", correct: "C", cat: "Futbol" },
  { q: "Süper Lig'de en çok şampiyonluk hangi kulübe aittir?", a: "Beşiktaş", b: "Fenerbahçe", c: "Trabzonspor", d: "Galatasaray", correct: "D", cat: "Futbol" },
  { q: "Robert Lewandowski 9 dakikada kaç gol attı (rekor)?", a: "3", b: "4", c: "5", d: "6", correct: "C", cat: "Futbol" },
  { q: "Hangi futbolcu 'Parmak 10' lakabıyla bilinir?", a: "Zidane", b: "Platini", c: "Pelé", d: "Maradona", correct: "D", cat: "Futbol" },
  { q: "Fenerbahçe'nin stadyumu hangisidir?", a: "Vodafone Park", b: "RAMS Park", c: "Ülker Stadyumu", d: "Atatürk Olimpiyat", correct: "C", cat: "Futbol" },
  { q: "Johan Cruyff hangi futbol felsefesini temsil eder?", a: "Catenaccio", b: "Tiki-taka", c: "Toplam futbol", d: "Gegenpressing", correct: "C", cat: "Futbol" },
  { q: "Pep Guardiola'nın taktik sistemi hangisidir?", a: "Catenaccio", b: "Tiki-taka", c: "Park the bus", d: "Route one", correct: "B", cat: "Futbol" },
];

// Yeni Araç Bilgisi soruları
const vehicleQuestions = [
  { q: "ABS fren sistemi ne işe yarar?", a: "Yakıt tasarrufu", b: "Fren sırasında tekerlek kilitlenmesini önler", c: "Motor performansını artırır", d: "Süspansiyon sertliği ayarlar", correct: "B", cat: "Araç Bilgisi" },
  { q: "Bir araçta 'turbo' ne işe yarar?", a: "Frenleri güçlendirir", b: "Klima verimini artırır", c: "Motora daha fazla hava basarak gücü artırır", d: "Şanzımanı korur", correct: "C", cat: "Araç Bilgisi" },
  { q: "Dizel motor ile benzinli motor arasındaki temel fark nedir?", a: "Dizel bujiyle ateşlenir", b: "Benzinli motor sıkıştırmayla ateşlenir", c: "Dizel sıkıştırmayla ateşlenir", d: "Fark yoktur", correct: "C", cat: "Araç Bilgisi" },
  { q: "ESP (Elektronik Stabilite Programı) ne yapar?", a: "Yakıt tüketimini azaltır", b: "Aracın yol tutuşunu kontrol eder", c: "Cam buğusunu önler", d: "Fren balatalarını soğutur", correct: "B", cat: "Araç Bilgisi" },
  { q: "Bir otomobilin beygir gücü (HP) neyi ifade eder?", a: "Yakıt kapasitesini", b: "Motor hacmini", c: "Motorun iş yapma kapasitesini", d: "Lastik basıncını", correct: "C", cat: "Araç Bilgisi" },
  { q: "CVT şanzıman ne demektir?", a: "Çift kavramalı şanzıman", b: "Sürekli değişken aktarma", c: "Sabit vitesli aktarma", d: "Elektrikli aktarma", correct: "B", cat: "Araç Bilgisi" },
  { q: "Araçlarda 'tork' neyi ifade eder?", a: "Hız", b: "Yakıt tüketimi", c: "Dönme kuvveti", d: "Fren gücü", correct: "C", cat: "Araç Bilgisi" },
  { q: "Katalitik konvertör (egzoz katalizörü) ne işe yarar?", a: "Motoru soğutur", b: "Zararlı gazları daha az zararlı gazlara dönüştürür", c: "Yakıt verimini artırır", d: "Ses seviyesini azaltır", correct: "B", cat: "Araç Bilgisi" },
  { q: "Lastik yanında yazan '205/55 R16' ne anlama gelir?", a: "Marka kodu", b: "Genişlik/profil/jant çapı", c: "Üretim tarihi", d: "Maksimum hız", correct: "B", cat: "Araç Bilgisi" },
  { q: "Hibrit araçlarda enerji geri kazanımı (rejeneratif frenleme) nasıl çalışır?", a: "Fren sırasında ısıyı depolar", b: "Fren sırasında elektrik motorunu jeneratör olarak kullanır", c: "Yakıtı geri dönüştürür", d: "Lastik sürtünmesini azaltır", correct: "B", cat: "Araç Bilgisi" },
  { q: "Dünyanın en çok otomobil üreten ülkesi hangisidir?", a: "ABD", b: "Japonya", c: "Almanya", d: "Çin", correct: "D", cat: "Araç Bilgisi" },
  { q: "Araçlarda 'common rail' teknolojisi neyle ilgilidir?", a: "Süspansiyon", b: "Yakıt enjeksiyon sistemi", c: "Fren sistemi", d: "Şanzıman", correct: "B", cat: "Araç Bilgisi" },
  { q: "Ferrari'nin merkezi hangi ülkededir?", a: "Almanya", b: "İtalya", c: "Fransa", d: "İngiltere", correct: "B", cat: "Araç Bilgisi" },
  { q: "Elektrikli araçlarda kWh neyi ifade eder?", a: "Motor gücü", b: "Batarya kapasitesi", c: "Şarj hızı", d: "Lastik basıncı", correct: "B", cat: "Araç Bilgisi" },
  { q: "Bir aracın 0-100 km/h hızlanma süresi neyi ölçer?", a: "Fren mesafesini", b: "Yakıt tüketimini", c: "İvmelenme performansını", d: "Yol tutuşunu", correct: "C", cat: "Araç Bilgisi" },
  { q: "Aracın şasi numarası (VIN) kaç karakterden oluşur?", a: "10", b: "13", c: "15", d: "17", correct: "D", cat: "Araç Bilgisi" },
  { q: "Hangi marka 'Das Auto' sloganıyla bilinir?", a: "BMW", b: "Audi", c: "Volkswagen", d: "Mercedes", correct: "C", cat: "Araç Bilgisi" },
  { q: "Turbo gecikmesi (turbo lag) ne demektir?", a: "Turbo arızası", b: "Gaz verildiğinde turbo basıncının geç gelmesi", c: "Turbo aşırı ısınması", d: "Turbo yağ kaçırması", correct: "B", cat: "Araç Bilgisi" },
  { q: "AdBlue sıvısı ne için kullanılır?", a: "Motor soğutma", b: "Cam yıkama", c: "Dizel egzoz emisyon azaltma", d: "Fren hidroliği", correct: "C", cat: "Araç Bilgisi" },
  { q: "Araçlarda 'diferansiyel' ne işe yarar?", a: "Vitesleri değiştirir", b: "Virajlarda tekerleklerin farklı hızlarda dönmesini sağlar", c: "Frenleri dengeler", d: "Motoru soğutur", correct: "B", cat: "Araç Bilgisi" },
  { q: "TEMSA ne tür araçlar üretir?", a: "Binek otomobil", b: "Otobüs ve midibüs", c: "Kamyon", d: "Motosiklet", correct: "B", cat: "Araç Bilgisi" },
  { q: "Toyota Corolla dünyanın en çok satan otomobili midir?", a: "Evet", b: "Hayır, VW Golf", c: "Hayır, Ford F-150", d: "Hayır, Honda Civic", correct: "A", cat: "Araç Bilgisi" },
  { q: "Bir dizel motorun sıkıştırma oranı benzinliye göre nasıldır?", a: "Daha düşük", b: "Aynı", c: "Daha yüksek", d: "Motor hacmine göre değişir", correct: "C", cat: "Araç Bilgisi" },
  { q: "Run-flat lastik ne demektir?", a: "Kış lastiği", b: "Patladıktan sonra belli mesafe gidebilen lastik", c: "Yarış lastiği", d: "Geniş tabanlı lastik", correct: "B", cat: "Araç Bilgisi" },
  { q: "LPG'li araçlarda hangi gaz yakıt olarak kullanılır?", a: "Doğalgaz", b: "Propan-bütan karışımı", c: "Hidrojen", d: "Metan", correct: "B", cat: "Araç Bilgisi" },
  { q: "Aracın 'egzoz emisyon sınıfı Euro 6' ne anlama gelir?", a: "6 silindirli motor", b: "6. nesil emisyon standardı", c: "6 litre motor hacmi", d: "6 vitesli şanzıman", correct: "B", cat: "Araç Bilgisi" },
  { q: "Tesla'nın kurucusu olarak bilinen kişi kimdir?", a: "Jeff Bezos", b: "Elon Musk", c: "Bill Gates", d: "Steve Jobs", correct: "B", cat: "Araç Bilgisi" },
  { q: "Araçlarda EGR (Exhaust Gas Recirculation) ne yapar?", a: "Egzoz sesini azaltır", b: "Egzoz gazını tekrar motora gönderir", c: "Yakıt pompasını kontrol eder", d: "Turbo basıncını ayarlar", correct: "B", cat: "Araç Bilgisi" },
  { q: "4x4 (dört çeker) sistemde hangi tekerlekler çekiş yapar?", a: "Sadece ön", b: "Sadece arka", c: "Dört tekerlek birden", d: "Değişkenli iki tekerlek", correct: "C", cat: "Araç Bilgisi" },
  { q: "Araç gösterge panelinde yağ ikaz lambası ne renktir?", a: "Yeşil", b: "Mavi", c: "Sarı/Kırmızı", d: "Beyaz", correct: "C", cat: "Araç Bilgisi" },
  { q: "Bir otobüsün ortalama hizmet ömrü yaklaşık kaç yıldır?", a: "5-8", b: "10-15", c: "15-20", d: "25-30", correct: "C", cat: "Araç Bilgisi" },
  { q: "Araçlarda 'torsiyon çubuğu' ne tür bir süspansiyon elemanıdır?", a: "Yay elemanı", b: "Amortisör", c: "Burç", d: "Rot başı", correct: "A", cat: "Araç Bilgisi" },
  { q: "Hangi yakıt türü oktanla ölçülür?", a: "Dizel", b: "LPG", c: "Benzin", d: "CNG", correct: "C", cat: "Araç Bilgisi" },
  { q: "Araçlarda 'cruise control' ne işe yarar?", a: "Otomatik park", b: "Sabit hız kontrolü", c: "Otomatik fren", d: "Şerit takibi", correct: "B", cat: "Araç Bilgisi" },
  { q: "Porsche hangi ülke kökenli bir markadır?", a: "İtalya", b: "İngiltere", c: "Almanya", d: "Fransa", correct: "C", cat: "Araç Bilgisi" },
  { q: "Araçlarda DPF (Dizel Partikül Filtresi) ne yapar?", a: "Yakıt filtreler", b: "Hava filtreler", c: "Egzoz partiküllerini tutar", d: "Yağ filtreler", correct: "C", cat: "Araç Bilgisi" },
  { q: "İlk seri üretim otomobili hangi markadır?", a: "Mercedes", b: "Ford", c: "Chevrolet", d: "BMW", correct: "B", cat: "Araç Bilgisi" },
  { q: "Çift kavramalı (DSG/DCT) şanzıman avantajı nedir?", a: "Daha ucuz", b: "Daha hafif", c: "Kesintisiz vites geçişi", d: "Daha az bakım", correct: "C", cat: "Araç Bilgisi" },
  { q: "Araçlarda 'intercooler' ne işe yarar?", a: "Klima soğutma", b: "Motor yağını soğutur", c: "Turbodan gelen sıkıştırılmış havayı soğutur", d: "Radyatör suyu soğutur", correct: "C", cat: "Araç Bilgisi" },
  { q: "ADAS (Gelişmiş Sürücü Destek Sistemleri) ne içermez?", a: "Otomatik acil fren", b: "Şerit takip", c: "Yakıt enjeksiyon", d: "Kör nokta uyarısı", correct: "C", cat: "Araç Bilgisi" },
  { q: "Bir elektrikli aracın menzili neye bağlıdır?", a: "Motor hacmine", b: "Batarya kapasitesine", c: "Vites sayısına", d: "Egzoz çapına", correct: "B", cat: "Araç Bilgisi" },
  { q: "Araçlarda 'McPherson' ne tür bir sistemdir?", a: "Fren sistemi", b: "Süspansiyon tipi", c: "Motor tipi", d: "Şanzıman tipi", correct: "B", cat: "Araç Bilgisi" },
  { q: "Bugatti Chiron'un maksimum hızı yaklaşık kaç km/h'dir?", a: "350", b: "400", c: "420", d: "490", correct: "C", cat: "Araç Bilgisi" },
  { q: "Aracın 'amortisör'ü ne işe yarar?", a: "Motoru soğutur", b: "Yol darbelerini sönümler", c: "Yakıt tasarrufu sağlar", d: "Direksiyonu hafifletir", correct: "B", cat: "Araç Bilgisi" },
  { q: "Araçlarda 'timing belt' (eksantrik kayışı) ne yapar?", a: "Klimayı çalıştırır", b: "Krank ve eksantrik mili senkronize eder", c: "Alternatörü döndürür", d: "Su pompasını çalıştırır", correct: "B", cat: "Araç Bilgisi" },
  { q: "CNG yakıt nedir?", a: "Sıvılaştırılmış petrol gazı", b: "Sıkıştırılmış doğalgaz", c: "Hidrojen yakıt", d: "Etanol karışımı", correct: "B", cat: "Araç Bilgisi" },
  { q: "Hangi marka 'Vorsprung durch Technik' sloganıyla bilinir?", a: "BMW", b: "Mercedes", c: "Audi", d: "Porsche", correct: "C", cat: "Araç Bilgisi" },
  { q: "Araçlarda 'AEB' (Autonomous Emergency Braking) ne demektir?", a: "Adaptif hız kontrol", b: "Otomatik acil frenleme", c: "Elektronik fren dağılımı", d: "Anti-blokaj sistemi", correct: "B", cat: "Araç Bilgisi" },
  { q: "Bir aracın aerodinamik 'Cd' değeri ne kadar düşükse?", a: "Daha ağırdır", b: "Daha hızlı gider", c: "Hava direnci daha azdır", d: "Motor daha güçlüdür", correct: "C", cat: "Araç Bilgisi" },
  { q: "Yarış otomobillerinde kullanılan 'slick lastik' özelliği nedir?", a: "Kış lastiği", b: "Desensiz, kuru yol lastiği", c: "Yüksek profilli lastik", d: "Zırhlı lastik", correct: "B", cat: "Araç Bilgisi" },
];

async function run() {
  try {
    // 1. Yazılım sorularını sil (önce ilişkili cevapları sil)
    console.log('Yazılım/programlama soruları siliniyor...');
    let totalDeleted = 0;
    for (const keyword of softwareKeywords) {
      // Önce bu soruların id'lerini bul
      const ids = await sql`SELECT id FROM quiz_questions WHERE question ILIKE ${'%' + keyword + '%'}`;
      if (ids.length > 0) {
        for (const row of ids) {
          await sql`DELETE FROM quiz_answers WHERE question_id = ${row.id}`;
        }
        const result = await sql`DELETE FROM quiz_questions WHERE question ILIKE ${'%' + keyword + '%'} RETURNING id`;
        totalDeleted += result.length;
        console.log(`  "${keyword}" - ${result.length} soru silindi`);
      }
    }
    console.log(`Toplam ${totalDeleted} yazılım sorusu silindi.\n`);

    // 2. Futbol soruları ekle
    console.log('Futbol soruları ekleniyor...');
    let addedFootball = 0;
    for (const q of footballQuestions) {
      await sql`INSERT INTO quiz_questions (question, option_a, option_b, option_c, option_d, correct_option, category)
        VALUES (${q.q}, ${q.a}, ${q.b}, ${q.c}, ${q.d}, ${q.correct}, ${q.cat})`;
      addedFootball++;
    }
    console.log(`${addedFootball} futbol sorusu eklendi.\n`);

    // 3. Araç bilgisi soruları ekle
    console.log('Araç Bilgisi soruları ekleniyor...');
    let addedVehicle = 0;
    for (const q of vehicleQuestions) {
      await sql`INSERT INTO quiz_questions (question, option_a, option_b, option_c, option_d, correct_option, category)
        VALUES (${q.q}, ${q.a}, ${q.b}, ${q.c}, ${q.d}, ${q.correct}, ${q.cat})`;
      addedVehicle++;
    }
    console.log(`${addedVehicle} araç bilgisi sorusu eklendi.\n`);

    // 4. Toplam soru sayısını göster
    const total = await sql`SELECT COUNT(*) as cnt FROM quiz_questions`;
    console.log(`Veritabanında toplam ${total[0].cnt} soru var.`);

    // 5. Kategori dağılımı
    const categories = await sql`SELECT category, COUNT(*) as cnt FROM quiz_questions GROUP BY category ORDER BY cnt DESC`;
    console.log('\nKategori dağılımı:');
    for (const c of categories) {
      console.log(`  ${c.category}: ${c.cnt}`);
    }
  } catch (error) {
    console.error('Hata:', error);
  }
}

run();
