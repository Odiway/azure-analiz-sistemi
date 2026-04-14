const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const envContent = fs.readFileSync('.env', 'utf-8');
const dbUrl = envContent.split('\n').find(l => l.startsWith('DATABASE_URL=')).replace('DATABASE_URL=', '').trim();
const sql = neon(dbUrl);

const questions = [
  // ===== ZOR GENEL KÜLTÜR =====
  { q: "Hangi antlaşma ile Osmanlı Devleti resmen sona ermiştir?", a: "Sevr Antlaşması", b: "Lozan Antlaşması", c: "Mondros Ateşkesi", d: "Mudanya Ateşkesi", correct: "B", cat: "Genel Kültür" },
  { q: "Fibonacci dizisinde 8. terim kaçtır?", a: "13", b: "21", c: "34", d: "55", correct: "B", cat: "Genel Kültür" },
  { q: "Hangi ülke dünyanın en fazla ada sayısına sahiptir?", a: "Endonezya", b: "Filipinler", c: "İsveç", d: "Norveç", correct: "C", cat: "Genel Kültür" },
  { q: "Mariana Çukuru hangi okyanusta yer alır?", a: "Atlas Okyanusu", b: "Hint Okyanusu", c: "Pasifik Okyanusu", d: "Kuzey Buz Denizi", correct: "C", cat: "Genel Kültür" },
  { q: "Hangisi BM Güvenlik Konseyi'nin daimi üyesi değildir?", a: "Fransa", b: "Almanya", c: "Çin", d: "Rusya", correct: "B", cat: "Genel Kültür" },
  { q: "Dünya'nın en uzun sınır hattı hangi iki ülke arasındadır?", a: "ABD-Meksika", b: "Rusya-Kazakistan", c: "ABD-Kanada", d: "Çin-Moğolistan", correct: "C", cat: "Genel Kültür" },
  { q: "Hangi şehir iki kıtada yer almaz?", a: "İstanbul", b: "Kahire", c: "Panama", d: "Atina", correct: "D", cat: "Genel Kültür" },
  { q: "Esperanto dili kim tarafından oluşturulmuştur?", a: "Noam Chomsky", b: "Ludwig Zamenhof", c: "Ferdinand de Saussure", d: "Wilhelm von Humboldt", correct: "B", cat: "Genel Kültür" },
  { q: "Dünya üzerinde en çok konuşulan 2. dil hangisidir (anadil)?", a: "İngilizce", b: "Hintçe", c: "İspanyolca", d: "Arapça", correct: "C", cat: "Genel Kültür" },
  { q: "'Bin Bir Gece Masalları' hangi edebiyata aittir?", a: "Fars", b: "Arap", c: "Hint", d: "Türk", correct: "B", cat: "Genel Kültür" },
  { q: "Hangi ülkenin bayrağında yeşil renk bulunmaz?", a: "Brezilya", b: "Japonya", c: "Nijerya", d: "Pakistan", correct: "B", cat: "Genel Kültür" },
  { q: "ISO 9001 standardı neyle ilgilidir?", a: "Bilgi Güvenliği", b: "Çevre Yönetimi", c: "Kalite Yönetimi", d: "İş Sağlığı", correct: "C", cat: "Genel Kültür" },
  { q: "Dünya'nın en yüksek şelalesi hangisidir?", a: "Niagara", b: "Angel Şelalesi", c: "Victoria", d: "İguazu", correct: "B", cat: "Genel Kültür" },
  { q: "Suudi Arabistan'ın para birimi nedir?", a: "Dirhem", b: "Dinar", c: "Riyal", d: "Lira", correct: "C", cat: "Genel Kültür" },
  { q: "Hangisi Nobel ödülü kategorilerinden biri değildir?", a: "Matematik", b: "Edebiyat", c: "Ekonomi", d: "Barış", correct: "A", cat: "Genel Kültür" },

  // ===== ZOR BİLİM & TEKNOLOJİ =====
  { q: "Kuantum mekaniğinde Heisenberg'in belirsizlik ilkesi neyi ifade eder?", a: "Enerjinin korunumu", b: "Konum ve momentumun aynı anda kesin ölçülemeyeceği", c: "Işığın dalga-parçacık ikiliği", d: "Atomun bölünemezliği", correct: "B", cat: "Bilim & Teknoloji" },
  { q: "TCP/IP modelinde kaç katman vardır?", a: "3", b: "4", c: "5", d: "7", correct: "B", cat: "Bilim & Teknoloji" },
  { q: "CRISPR teknolojisi hangi alanda kullanılır?", a: "Yapay zeka", b: "Gen düzenleme", c: "Kuantum hesaplama", d: "Blockchain", correct: "B", cat: "Bilim & Teknoloji" },
  { q: "Hangi programlama paradigması yan etkisiz fonksiyonlara dayanır?", a: "Nesne yönelimli", b: "Prosedürel", c: "Fonksiyonel", d: "Mantıksal", correct: "C", cat: "Bilim & Teknoloji" },
  { q: "Moore Yasası neyi öngörür?", a: "Veri aktarım hızının ikiye katlanması", b: "Transistör sayısının ~2 yılda ikiye katlanması", c: "Disk kapasitesinin her yıl üçe katlanması", d: "Yazılım karmaşıklığının azalması", correct: "B", cat: "Bilim & Teknoloji" },
  { q: "Karadelik (black hole) kavramını ilk kez kim öne sürmüştür?", a: "Einstein", b: "Hawking", c: "John Michell", d: "Newton", correct: "C", cat: "Bilim & Teknoloji" },
  { q: "Hangi element en yüksek erime noktasına sahiptir?", a: "Demir", b: "Tungsten", c: "Titanyum", d: "Platin", correct: "B", cat: "Bilim & Teknoloji" },
  { q: "LinAlg'da bir matrisin determinantı 0 ise matris nasıl adlandırılır?", a: "Ortogonal", b: "Singular (Tekil)", c: "Simetrik", d: "Üniter", correct: "B", cat: "Bilim & Teknoloji" },
  { q: "SHA-256 algoritması kaç bitlik hash çıktısı üretir?", a: "128", b: "192", c: "256", d: "512", correct: "C", cat: "Bilim & Teknoloji" },
  { q: "Higgs Bozonu hangi yılda deneysel olarak doğrulanmıştır?", a: "2008", b: "2010", c: "2012", d: "2014", correct: "C", cat: "Bilim & Teknoloji" },
  { q: "Hangi veri yapısı LIFO (Last In First Out) prensibiyle çalışır?", a: "Queue", b: "Stack", c: "Linked List", d: "Tree", correct: "B", cat: "Bilim & Teknoloji" },
  { q: "Bir nötron yıldızının yoğunluğu yaklaşık ne kadardır?", a: "10⁸ kg/m³", b: "10¹¹ kg/m³", c: "10¹⁴ kg/m³", d: "10¹⁷ kg/m³", correct: "D", cat: "Bilim & Teknoloji" },
  { q: "CAE analizlerinde Von Mises gerilmesi neyi temsil eder?", a: "Maksimum kayma gerilmesi", b: "Eşdeğer (etkili) gerilme", c: "Hidrostatik basınç", d: "Çekme gerilmesi", correct: "B", cat: "Bilim & Teknoloji" },
  { q: "FEM (Sonlu Elemanlar Yöntemi) hangi matematiksel yaklaşıma dayanır?", a: "Fourier dönüşümü", b: "Laplace dönüşümü", c: "Galerkin yöntemi", d: "Monte Carlo simülasyonu", correct: "C", cat: "Bilim & Teknoloji" },
  { q: "Reynolds sayısı neyi belirler?", a: "Isı transfer oranını", b: "Akışın laminer mi türbülanslı mı olduğunu", c: "Basınç düşüşünü", d: "Viskoziteyi", correct: "B", cat: "Bilim & Teknoloji" },

  // ===== ZOR TARİH =====
  { q: "Rönesans hangi şehirde başlamıştır?", a: "Roma", b: "Floransa", c: "Venedik", d: "Milano", correct: "B", cat: "Tarih" },
  { q: "Çanakkale Savaşı hangi yılda başlamıştır?", a: "1914", b: "1915", c: "1916", d: "1917", correct: "B", cat: "Tarih" },
  { q: "Magna Carta hangi yılda imzalanmıştır?", a: "1066", b: "1215", c: "1453", d: "1789", correct: "B", cat: "Tarih" },
  { q: "Soğuk Savaş döneminde Berlin Duvarı kaç yılında yıkılmıştır?", a: "1987", b: "1988", c: "1989", d: "1990", correct: "C", cat: "Tarih" },
  { q: "Hangisi Osmanlı'nın kuruluş döneminde fethettiği ilk önemli kaledir?", a: "Karacahisar", b: "Bilecik", c: "İnegöl", d: "Bursa", correct: "A", cat: "Tarih" },
  { q: "Sanayi Devrimi ilk olarak hangi ülkede başlamıştır?", a: "Fransa", b: "Almanya", c: "İngiltere", d: "ABD", correct: "C", cat: "Tarih" },
  { q: "Sümerler hangi yazı sistemini geliştirmiştir?", a: "Hiyeroglif", b: "Alfabe", c: "Çivi yazısı", d: "Piktogram", correct: "C", cat: "Tarih" },
  { q: "Waterloo Savaşı'nda Napolyon'u kim yenmiştir?", a: "Nelson", b: "Wellington", c: "Kutuzov", d: "Blücher", correct: "B", cat: "Tarih" },
  { q: "İpek Yolu hangi iki medeniyeti birbirine bağlıyordu?", a: "Roma-Mısır", b: "Çin-Roma", c: "Hindistan-Pers", d: "Japonya-Avrupa", correct: "B", cat: "Tarih" },
  { q: "Türkiye Cumhuriyeti'nin ilk anayasası hangi yıl kabul edilmiştir?", a: "1921", b: "1923", c: "1924", d: "1926", correct: "C", cat: "Tarih" },
  { q: "Vikingler hangi kıtaya Kolomb'dan önce ulaşmıştır?", a: "Afrika", b: "Güney Amerika", c: "Kuzey Amerika", d: "Avustralya", correct: "C", cat: "Tarih" },
  { q: "Hangisi 7 Harikadan biri değildir?", a: "İskenderiye Feneri", b: "Babil Asma Bahçeleri", c: "Roma Kolezyumu", d: "Rodos Heykeli", correct: "C", cat: "Tarih" },

  // ===== ZOR COĞRAFYA =====
  { q: "Dünya'nın en büyük gölü hangisidir?", a: "Baykal Gölü", b: "Hazar Denizi", c: "Superior Gölü", d: "Victoria Gölü", correct: "B", cat: "Coğrafya" },
  { q: "Hangi ülke dünyanın en çok zaman dilimi kullanan ülkesidir?", a: "Rusya", b: "ABD", c: "Fransa", d: "İngiltere", correct: "C", cat: "Coğrafya" },
  { q: "Sahara Çölü hangi kıtadaki en büyük sıcak çöldür?", a: "Asya", b: "Afrika", c: "Avustralya", d: "Güney Amerika", correct: "B", cat: "Coğrafya" },
  { q: "Türkiye'nin en uzun nehri hangisidir?", a: "Fırat", b: "Kızılırmak", c: "Sakarya", d: "Dicle", correct: "B", cat: "Coğrafya" },
  { q: "Hangi boğaz Avrupa ile Asya'yı ayırır?", a: "Cebelitarık", b: "Malakka", c: "İstanbul Boğazı", d: "Süveyş", correct: "C", cat: "Coğrafya" },
  { q: "Dünya'nın en kurak yeri neresidir?", a: "Sahara", b: "Gobi", c: "Atacama Çölü", d: "Kalahari", correct: "C", cat: "Coğrafya" },
  { q: "Hangi ülkenin kara sınırı yoktur?", a: "İzlanda", b: "Yeni Zelanda", c: "Küba", d: "Hepsi", correct: "D", cat: "Coğrafya" },
  { q: "Amazon Nehri hangi okyanusa dökülür?", a: "Pasifik", b: "Atlas", c: "Hint", d: "Kuzey Buz Denizi", correct: "B", cat: "Coğrafya" },
  { q: "Everest Dağı hangi iki ülkenin sınırında yer alır?", a: "Çin-Hindistan", b: "Nepal-Çin", c: "Nepal-Hindistan", d: "Çin-Pakistan", correct: "B", cat: "Coğrafya" },
  { q: "Hangi göl dünyanın en derin gölüdür?", a: "Hazar Denizi", b: "Tanganika", c: "Baykal", d: "Superior", correct: "C", cat: "Coğrafya" },

  // ===== ZOR MÜHENDİSLİK & OTOMOTİV =====
  { q: "Otobüs şasisi tasarımında kullanılan temel FEA analiz türü hangisidir?", a: "Modal analiz", b: "Statik yapısal analiz", c: "CFD analiz", d: "Termal analiz", correct: "B", cat: "Mühendislik" },
  { q: "Çeliğin elastisite modülü yaklaşık kaç GPa'dır?", a: "70", b: "120", c: "200", d: "350", correct: "C", cat: "Mühendislik" },
  { q: "Bir aracın ağırlık merkezi yükseldikçe ne olur?", a: "Yakıt verimliliği artar", b: "Devrilme riski artar", c: "Fren mesafesi azalır", d: "Süspansiyon sertleşir", correct: "B", cat: "Mühendislik" },
  { q: "Euro 6 emisyon standardı temel olarak hangi gazın sınırını düşürmüştür?", a: "CO₂", b: "NOx", c: "SO₂", d: "O₃", correct: "B", cat: "Mühendislik" },
  { q: "Alüminyumun yoğunluğu çeliğe göre yaklaşık kaçta kaçıdır?", a: "1/2", b: "1/3", c: "1/4", d: "1/5", correct: "B", cat: "Mühendislik" },
  { q: "Bir yapısal analizde 'mesh refinement' ne işe yarar?", a: "Hesaplama süresini azaltır", b: "Sonuçların doğruluğunu artırır", c: "Malzeme özelliklerini değiştirir", d: "Sınır koşullarını otomatik belirler", correct: "B", cat: "Mühendislik" },
  { q: "Yorulma (fatigue) analizi hangi tür yükleme altında yapılır?", a: "Statik", b: "Tekrarlı (çevrimsel)", c: "Darbe", d: "Termal", correct: "B", cat: "Mühendislik" },
  { q: "Poisson oranı neyi ifade eder?", a: "Gerilme-birim şekil değiştirme ilişkisi", b: "Enine daralma / boyuna uzama oranı", c: "Elastik enerji yoğunluğu", d: "Kayma modülü", correct: "B", cat: "Mühendislik" },
  { q: "Kompozit malzemelerde hangi matris türü en yaygındır?", a: "Metal matris", b: "Seramik matris", c: "Polimer matris", d: "Karbon matris", correct: "C", cat: "Mühendislik" },
  { q: "Bir otobüste monokok yapı ne anlama gelir?", a: "Ayrık şasi ve gövde", b: "Gövde ve şasinin tek parça olması", c: "Çift katlı yapı", d: "Hafif metal şasi", correct: "B", cat: "Mühendislik" },
  { q: "CFD analizinde türbülans modeli olarak kullanılan k-epsilon ne tür bir modeldir?", a: "Laminer akış modeli", b: "İki denklemli RANS modeli", c: "DNS modeli", d: "LES modeli", correct: "B", cat: "Mühendislik" },
  { q: "Stress-strain eğrisinde 'yield point' neyi gösterir?", a: "Kırılma noktası", b: "Elastik sınır aşılarak plastik deformasyonun başladığı nokta", c: "Maksimum gerilme", d: "Yorulma sınırı", correct: "B", cat: "Mühendislik" },

  // ===== ZOR SPOR =====
  { q: "FIFA Dünya Kupası'nı en çok kazanan ülke hangisidir?", a: "Almanya", b: "İtalya", c: "Arjantin", d: "Brezilya", correct: "D", cat: "Spor" },
  { q: "Bir maraton tam olarak kaç km'dir?", a: "40.195", b: "41.195", c: "42.195", d: "43.195", correct: "C", cat: "Spor" },
  { q: "Hangi spor dalında 'love' terimi sıfır anlamında kullanılır?", a: "Badminton", b: "Tenis", c: "Masa tenisi", d: "Squash", correct: "B", cat: "Spor" },
  { q: "Beşiktaş, Fenerbahçe ve Galatasaray dışında hangi Türk kulübü UEFA Kupası finali oynamıştır?", a: "Trabzonspor", b: "Hiçbiri", c: "Bursaspor", d: "Başakşehir", correct: "B", cat: "Spor" },
  { q: "Formula 1'de en çok Dünya Şampiyonluğu kazanan pilot kimdir?", a: "Ayrton Senna", b: "Michael Schumacher", c: "Lewis Hamilton", d: "Sebastian Vettel", correct: "C", cat: "Spor" },
  { q: "Olimpiyat bayrağındaki beş halka neyi temsil eder?", a: "Beş kıta", b: "Beş spor dalı", c: "Beş element", d: "Beş ülke", correct: "A", cat: "Spor" },
  { q: "NBA tarihinde en çok sayı atan oyuncu kimdir?", a: "Michael Jordan", b: "Kobe Bryant", c: "Kareem Abdul-Jabbar", d: "LeBron James", correct: "D", cat: "Spor" },
  { q: "Kriket maçında bir 'over' kaç atıştan oluşur?", a: "4", b: "5", c: "6", d: "8", correct: "C", cat: "Spor" },

  // ===== ZOR SANAT & EDEBİYAT =====
  { q: "Hangisi Fyodor Dostoyevski'nin eseri değildir?", a: "Suç ve Ceza", b: "Anna Karenina", c: "Karamazov Kardeşler", d: "Budala", correct: "B", cat: "Sanat & Edebiyat" },
  { q: "'Guernica' tablosu hangi savaşı konu alır?", a: "I. Dünya Savaşı", b: "İspanya İç Savaşı", c: "II. Dünya Savaşı", d: "Kore Savaşı", correct: "B", cat: "Sanat & Edebiyat" },
  { q: "Türk edebiyatında 'Safahat' kimin eseridir?", a: "Namık Kemal", b: "Ziya Gökalp", c: "Mehmet Akif Ersoy", d: "Tevfik Fikret", correct: "C", cat: "Sanat & Edebiyat" },
  { q: "Hangisi Impressionism (İzlenimcilik) akımının temsilcisi değildir?", a: "Monet", b: "Renoir", c: "Salvador Dalí", d: "Degas", correct: "C", cat: "Sanat & Edebiyat" },
  { q: "Shakespeare'in 'Hamlet' oyununda ünlü tirad hangi cümleyle başlar?", a: "To be, or not to be", b: "Friends, Romans, countrymen", c: "All the world's a stage", d: "What's in a name?", correct: "A", cat: "Sanat & Edebiyat" },
  { q: "'Yüz Yıllık Yalnızlık' romanının yazarı kimdir?", a: "Jorge Luis Borges", b: "Gabriel García Márquez", c: "Mario Vargas Llosa", d: "Pablo Neruda", correct: "B", cat: "Sanat & Edebiyat" },
  { q: "Orhan Pamuk hangi eseriyle Nobel Edebiyat Ödülü almıştır?", a: "Kar", b: "Benim Adım Kırmızı", c: "Masumiyet Müzesi", d: "Tüm eserleri bir bütün olarak", correct: "D", cat: "Sanat & Edebiyat" },
  { q: "Barok dönemin en ünlü bestecilerinden biri hangisidir?", a: "Beethoven", b: "Mozart", c: "Bach", d: "Chopin", correct: "C", cat: "Sanat & Edebiyat" },

  // ===== ZOR MATEMATİK & MANTIK =====
  { q: "Euler sayısı (e) yaklaşık kaçtır?", a: "2.414", b: "2.618", c: "2.718", d: "2.828", correct: "C", cat: "Matematik & Mantık" },
  { q: "Bir küpün kaç köşesi vardır?", a: "6", b: "8", c: "10", d: "12", correct: "B", cat: "Matematik & Mantık" },
  { q: "Altın oran (φ) yaklaşık kaçtır?", a: "1.414", b: "1.618", c: "1.732", d: "2.236", correct: "B", cat: "Matematik & Mantık" },
  { q: "0! (sıfır faktöriyel) kaça eşittir?", a: "0", b: "1", c: "Tanımsız", d: "Sonsuz", correct: "B", cat: "Matematik & Mantık" },
  { q: "Hangisi bir asal sayı değildir?", a: "97", b: "91", c: "89", d: "83", correct: "B", cat: "Matematik & Mantık" },
  { q: "log₂(1024) kaçtır?", a: "8", b: "9", c: "10", d: "11", correct: "C", cat: "Matematik & Mantık" },
  { q: "Bir dairenin çevresinin çapına oranı neye eşittir?", a: "e", b: "π", c: "φ", d: "√2", correct: "B", cat: "Matematik & Mantık" },
  { q: "3^0 + 3^1 + 3^2 kaç eder?", a: "12", b: "13", c: "14", d: "15", correct: "B", cat: "Matematik & Mantık" },
  { q: "Bir üçgenin iç açıları toplamı kaç derecedir?", a: "90", b: "180", c: "270", d: "360", correct: "B", cat: "Matematik & Mantık" },
  { q: "√(144 + 25) kaçtır?", a: "12", b: "13", c: "14", d: "15", correct: "B", cat: "Matematik & Mantık" },

  // ===== ZOR FİLM & KÜLTÜR =====
  { q: "Hangisi Christopher Nolan'ın yönettiği bir film değildir?", a: "Inception", b: "Blade Runner 2049", c: "Interstellar", d: "Tenet", correct: "B", cat: "Film & Kültür" },
  { q: "Oscar'da En İyi Film ödülünü kazanan ilk animasyon film hangisidir?", a: "Toy Story", b: "Henüz kazanan olmadı", c: "Shrek", d: "Up", correct: "B", cat: "Film & Kültür" },
  { q: "Matrix filminde kırmızı hapı yutan karakter kimdir?", a: "Morpheus", b: "Trinity", c: "Neo", d: "Agent Smith", correct: "C", cat: "Film & Kültür" },
  { q: "'Yüzüklerin Efendisi' serisini kim yazmıştır?", a: "C.S. Lewis", b: "J.R.R. Tolkien", c: "J.K. Rowling", d: "George R.R. Martin", correct: "B", cat: "Film & Kültür" },
  { q: "Hangisi bir Akira Kurosawa filmidir?", a: "Tokyo Story", b: "Rashomon", c: "Spirited Away", d: "In the Mood for Love", correct: "B", cat: "Film & Kültür" },
  { q: "Breaking Bad dizisinde Walter White'ın takma adı nedir?", a: "The Chef", b: "Heisenberg", c: "Blue Sky", d: "The Professor", correct: "B", cat: "Film & Kültür" },
  { q: "Hangisi Stanley Kubrick'in filmi değildir?", a: "2001: A Space Odyssey", b: "The Shining", c: "Taxi Driver", d: "A Clockwork Orange", correct: "C", cat: "Film & Kültür" },
  { q: "IMDB'de en yüksek puan alan film hangisidir (2024)?", a: "The Godfather", b: "The Shawshank Redemption", c: "Schindler's List", d: "The Dark Knight", correct: "B", cat: "Film & Kültür" },

  // ===== ZOR MÜZİK =====
  { q: "Hangi müzik aletinin 88 tuşu vardır?", a: "Akordeon", b: "Org", c: "Piyano", d: "Klavsen", correct: "C", cat: "Müzik" },
  { q: "Beethoven'ın 9. Senfonisi'nin son bölümünde hangi şiir kullanılmıştır?", a: "Goethe - Faust", b: "Schiller - Neşeye Övgü", c: "Shakespeare - Sonnet 18", d: "Byron - Don Juan", correct: "B", cat: "Müzik" },
  { q: "Hangisi bir Türk müzik makamı değildir?", a: "Hicaz", b: "Rast", c: "Allegro", d: "Hüseyni", correct: "C", cat: "Müzik" },
  { q: "Pink Floyd'un en ünlü albümü hangisidir?", a: "Wish You Were Here", b: "The Dark Side of the Moon", c: "Animals", d: "The Wall", correct: "B", cat: "Müzik" },
  { q: "Bir orkestrada en çok sayıda bulunan enstrüman grubu hangisidir?", a: "Nefesli çalgılar", b: "Vurmalı çalgılar", c: "Yaylı çalgılar", d: "Üflemeli çalgılar", correct: "C", cat: "Müzik" },
];

async function seed() {
  let added = 0;
  let skipped = 0;
  
  for (const q of questions) {
    try {
      // Check if exact question already exists
      const existing = await sql`SELECT id FROM quiz_questions WHERE question = ${q.q}`;
      if (existing.length > 0) {
        skipped++;
        continue;
      }
      await sql`
        INSERT INTO quiz_questions (question, option_a, option_b, option_c, option_d, correct_option, category)
        VALUES (${q.q}, ${q.a}, ${q.b}, ${q.c}, ${q.d}, ${q.correct}, ${q.cat})
      `;
      added++;
    } catch (e) {
      console.error('Error inserting:', q.q, e.message);
    }
  }
  
  const total = await sql`SELECT COUNT(*) as cnt FROM quiz_questions`;
  console.log(`Added ${added} new questions, skipped ${skipped} duplicates`);
  console.log(`Total questions in DB: ${total[0].cnt}`);
}

seed().catch(console.error);
