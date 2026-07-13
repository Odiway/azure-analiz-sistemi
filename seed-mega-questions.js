// Zengin soru havuzu: yeni sorular + E şıklı sorular + görselli (bayrak) sorular.
// Cevaplar eklenirken round-robin ile A-B-C-D-(E) şıklarına dengeli dağıtılır.
const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const dbUrl = fs.readFileSync('.env', 'utf-8').split('\n').find(l => l.startsWith('DATABASE_URL=')).replace('DATABASE_URL=', '').trim();
const sql = neon(dbUrl);

const FLAG = (name) => `https://commons.wikimedia.org/wiki/Special:FilePath/${name}`;

const questions = [
  // ===================== GÖRSELLİ: BAYRAKLAR =====================
  { q: "Bu bayrak hangi ülkeye aittir?", a: "Japonya", b: "Bangladeş", c: "Güney Kore", d: "Palau", correct: "A", cat: "Görsel - Bayraklar", img: FLAG("Flag_of_Japan.svg") },
  { q: "Bu bayrak hangi ülkeye aittir?", a: "Azerbaycan", b: "Türkiye", c: "Tunus", d: "Pakistan", correct: "B", cat: "Görsel - Bayraklar", img: FLAG("Flag_of_Turkey.svg") },
  { q: "Bu bayrak hangi ülkeye aittir?", a: "Arjantin", b: "Kolombiya", c: "Brezilya", d: "Portekiz", correct: "C", cat: "Görsel - Bayraklar", img: FLAG("Flag_of_Brazil.svg") },
  { q: "Bu bayrak hangi ülkeye aittir?", a: "İngiltere", b: "Avustralya", c: "Yeni Zelanda", d: "Kanada", correct: "D", cat: "Görsel - Bayraklar", img: FLAG("Flag_of_Canada.svg") },
  { q: "Bu bayrak hangi ülkeye aittir?", a: "Almanya", b: "Belçika", c: "Litvanya", d: "Bolivya", correct: "A", cat: "Görsel - Bayraklar", img: FLAG("Flag_of_Germany.svg") },
  { q: "Bu bayrak hangi ülkeye aittir?", a: "İtalya", b: "İrlanda", c: "Fransa", d: "Rusya", correct: "C", cat: "Görsel - Bayraklar", img: FLAG("Flag_of_France.svg") },
  { q: "Bu bayrak hangi ülkeye aittir?", a: "Macaristan", b: "İtalya", c: "Meksika", d: "İran", correct: "B", cat: "Görsel - Bayraklar", img: FLAG("Flag_of_Italy.svg") },
  { q: "Bu bayrak hangi ülkeye aittir?", a: "Portekiz", b: "İspanya", c: "İtalya", d: "Kolombiya", correct: "B", cat: "Görsel - Bayraklar", img: FLAG("Flag_of_Spain.svg") },
  { q: "Bu bayrak hangi ülkeye aittir?", a: "Japonya", b: "Tayvan", c: "Güney Kore", d: "Moğolistan", correct: "C", cat: "Görsel - Bayraklar", img: FLAG("Flag_of_South_Korea.svg") },
  { q: "Bu bayrak hangi ülkeye aittir?", a: "Finlandiya", b: "İsrail", c: "Yunanistan", d: "Uruguay", correct: "C", cat: "Görsel - Bayraklar", img: FLAG("Flag_of_Greece.svg") },
  { q: "Bu bayrak hangi ülkeye aittir?", a: "İsviçre", b: "Danimarka", c: "İngiltere", d: "Tonga", correct: "A", cat: "Görsel - Bayraklar", img: FLAG("Flag_of_Switzerland.svg") },
  { q: "Bu bayrak hangi ülkeye aittir?", a: "Lüksemburg", b: "Hollanda", c: "Rusya", d: "Hırvatistan", correct: "B", cat: "Görsel - Bayraklar", img: FLAG("Flag_of_the_Netherlands.svg") },
  { q: "Bu bayrak hangi ülkeye aittir?", a: "Norveç", b: "İzlanda", c: "İsveç", d: "Finlandiya", correct: "C", cat: "Görsel - Bayraklar", img: FLAG("Flag_of_Sweden.svg") },
  { q: "Bu bayrak hangi ülkeye aittir?", a: "Norveç", b: "İzlanda", c: "Danimarka", d: "İngiltere", correct: "A", cat: "Görsel - Bayraklar", img: FLAG("Flag_of_Norway.svg") },
  { q: "Bu bayrak hangi ülkeye aittir?", a: "Uruguay", b: "Arjantin", c: "El Salvador", d: "Yunanistan", correct: "B", cat: "Görsel - Bayraklar", img: FLAG("Flag_of_Argentina.svg") },
  { q: "Bu bayrak hangi ülkeye aittir?", a: "İspanya", b: "İtalya", c: "Portekiz", d: "Meksika", correct: "C", cat: "Görsel - Bayraklar", img: FLAG("Flag_of_Portugal.svg") },
  { q: "Bu bayrak hangi ülkeye aittir?", a: "Hindistan", b: "İrlanda", c: "Nijer", d: "Fildişi Sahili", correct: "A", cat: "Görsel - Bayraklar", img: FLAG("Flag_of_India.svg") },
  { q: "Bu bayrak hangi ülkeye aittir?", a: "Avustralya", b: "Malezya", c: "ABD", d: "Liberya", correct: "C", cat: "Görsel - Bayraklar", img: FLAG("Flag_of_the_United_States.svg") },
  { q: "Bu bayrak hangi ülkeye aittir?", a: "Meksika", b: "İtalya", c: "İrlanda", d: "Macaristan", correct: "A", cat: "Görsel - Bayraklar", img: FLAG("Flag_of_Mexico.svg") },
  { q: "Bu bayrak hangi ülkeye aittir?", a: "Avustralya", b: "Yeni Zelanda", c: "İngiltere (Birleşik Krallık)", d: "Fiji", correct: "C", cat: "Görsel - Bayraklar", img: FLAG("Flag_of_the_United_Kingdom.svg") },

  // ===================== GENEL KÜLTÜR (E şıklı örnekler dahil) =====================
  { q: "Dünyanın en kalabalık ülkesi hangisidir (2024)?", a: "Çin", b: "Hindistan", c: "ABD", d: "Endonezya", e: "Nijerya", correct: "B", cat: "Genel Kültür" },
  { q: "INTERPOL'ün merkezi hangi şehirdedir?", a: "Lyon", b: "Paris", c: "Cenevre", d: "Viyana", correct: "A", cat: "Genel Kültür" },
  { q: "NATO'nun merkezi hangi şehirdedir?", a: "Washington", b: "Brüksel", c: "Londra", d: "Paris", correct: "B", cat: "Genel Kültür" },
  { q: "Dünya Sağlık Örgütü'nün (WHO) merkezi neresidir?", a: "New York", b: "Roma", c: "Cenevre", d: "Paris", correct: "C", cat: "Genel Kültür" },
  { q: "Türkiye'nin yüzölçümü bakımından en büyük ili hangisidir?", a: "Ankara", b: "Sivas", c: "Erzurum", d: "Konya", correct: "D", cat: "Genel Kültür" },
  { q: "Türkiye'nin yüzölçümü en küçük ili hangisidir?", a: "Yalova", b: "Kilis", c: "Rize", d: "Bartın", correct: "A", cat: "Genel Kültür" },
  { q: "Satranç tahtasında toplam kaç kare vardır?", a: "36", b: "49", c: "64", d: "81", correct: "C", cat: "Genel Kültür" },
  { q: "Bir haftada kaç saat vardır?", a: "148", b: "158", c: "168", d: "178", correct: "C", cat: "Genel Kültür" },
  { q: "Olimpiyat halkalarında bulunmayan renk hangisidir?", a: "Mavi", b: "Mor", c: "Sarı", d: "Yeşil", e: "Kırmızı", correct: "B", cat: "Genel Kültür" },
  { q: "Nobel Ödülü'nü reddeden ünlü yazar kimdir?", a: "Ernest Hemingway", b: "Jean-Paul Sartre", c: "Albert Camus", d: "John Steinbeck", correct: "B", cat: "Genel Kültür" },
  { q: "Türkiye'nin en uzun kara sınırı hangi ülkeyledir?", a: "İran", b: "Irak", c: "Suriye", d: "Gürcistan", correct: "C", cat: "Genel Kültür" },
  { q: "Satrançta oyuna başlarken her oyuncunun kaç taşı vardır?", a: "8", b: "12", c: "16", d: "20", correct: "C", cat: "Genel Kültür" },
  { q: "Ülkelerden hangisinin resmi para birimi Euro değildir?", a: "Almanya", b: "İspanya", c: "İsveç", d: "Fransa", e: "İtalya", correct: "C", cat: "Genel Kültür" },
  { q: "Bir yılda kaç hafta vardır (yaklaşık)?", a: "48", b: "50", c: "52", d: "54", correct: "C", cat: "Genel Kültür" },
  { q: "Dünyanın en büyük tropikal yağmur ormanı hangisidir?", a: "Kongo", b: "Amazon", c: "Borneo", d: "Sumatra", correct: "B", cat: "Genel Kültür" },
  { q: "İskambil destesinde kaç kart vardır (jokersiz)?", a: "48", b: "50", c: "52", d: "54", correct: "C", cat: "Genel Kültür" },
  { q: "'Renkli körlük' en sık hangi iki rengi ayırt etmede olur?", a: "Mavi-Sarı", b: "Kırmızı-Yeşil", c: "Siyah-Beyaz", d: "Mor-Turuncu", correct: "B", cat: "Genel Kültür" },
  { q: "Hangisi bir baharat değildir?", a: "Tarçın", b: "Karanfil", c: "Safran", d: "Bazalt", correct: "D", cat: "Genel Kültür" },

  // ===================== BİLİM & TEKNOLOJİ =====================
  { q: "Suyun kaynama noktası deniz seviyesinde kaç °C'dir?", a: "90", b: "95", c: "100", d: "105", correct: "C", cat: "Bilim & Teknoloji" },
  { q: "Hangisi bir programlama dili değildir?", a: "Python", b: "HTTP", c: "Rust", d: "Go", correct: "B", cat: "Bilim & Teknoloji" },
  { q: "İnsan vücudunun kontrol merkezi olan organ hangisidir?", a: "Kalp", b: "Beyin", c: "Karaciğer", d: "Akciğer", correct: "B", cat: "Bilim & Teknoloji" },
  { q: "DNA'da bulunmayan baz hangisidir?", a: "Adenin", b: "Timin", c: "Urasil", d: "Guanin", e: "Sitozin", correct: "C", cat: "Bilim & Teknoloji" },
  { q: "1 gigabayt kaç megabayttır?", a: "100", b: "512", c: "1000", d: "1024", correct: "D", cat: "Bilim & Teknoloji" },
  { q: "Hangi gezegenin en fazla uydusu vardır (bilinen)?", a: "Jüpiter", b: "Satürn", c: "Uranüs", d: "Neptün", correct: "B", cat: "Bilim & Teknoloji" },
  { q: "JavaScript hangi ortamda çalışmaz?", a: "Tarayıcı", b: "Node.js", c: "Deno", d: "Hiçbiri", correct: "D", cat: "Bilim & Teknoloji" },
  { q: "Elektrik direncinin birimi nedir?", a: "Volt", b: "Amper", c: "Ohm", d: "Watt", correct: "C", cat: "Bilim & Teknoloji" },
  { q: "Hangisi bir bulut bilişim sağlayıcısı değildir?", a: "AWS", b: "Azure", c: "GCP", d: "Photoshop", correct: "D", cat: "Bilim & Teknoloji" },
  { q: "İnsanda kalp haftada değil, dakikada ortalama kaç kez atar (dinlenme)?", a: "40-50", b: "60-100", c: "120-140", d: "150-180", correct: "B", cat: "Bilim & Teknoloji" },
  { q: "Hangisi bir kütle birimi değildir?", a: "Gram", b: "Ton", c: "Newton", d: "Kilogram", correct: "C", cat: "Bilim & Teknoloji" },
  { q: "Yazılımda 'bug' terimini popülerleştiren mühendis kimdir?", a: "Ada Lovelace", b: "Grace Hopper", c: "Alan Turing", d: "Margaret Hamilton", correct: "B", cat: "Bilim & Teknoloji" },
  { q: "Hangi element sembolü 'Na' ile gösterilir?", a: "Azot", b: "Nikel", c: "Sodyum", d: "Neon", correct: "C", cat: "Bilim & Teknoloji" },
  { q: "HTTPS'te 'S' neyi ifade eder?", a: "Speed", b: "Secure", c: "System", d: "Server", correct: "B", cat: "Bilim & Teknoloji" },
  { q: "Işık bir yılda yaklaşık ne kadar yol alır (1 ışık yılı)?", a: "9,5 trilyon km", b: "1 milyon km", c: "150 milyon km", d: "300 bin km", correct: "A", cat: "Bilim & Teknoloji" },
  { q: "Hangisi yapay zeka alanında bir kavram değildir?", a: "Sinir ağı", b: "Makine öğrenmesi", c: "Fotosentez", d: "Derin öğrenme", correct: "C", cat: "Bilim & Teknoloji" },

  // ===================== TARİH =====================
  { q: "Cumhuriyet hangi tarihte ilan edilmiştir?", a: "23 Nisan 1920", b: "19 Mayıs 1919", c: "29 Ekim 1923", d: "30 Ağustos 1922", correct: "C", cat: "Tarih" },
  { q: "Lozan Barış Antlaşması hangi yılda imzalanmıştır?", a: "1920", b: "1923", c: "1924", d: "1918", correct: "B", cat: "Tarih" },
  { q: "İkinci Dünya Savaşı hangi olayla başlamıştır?", a: "Pearl Harbor", b: "Almanya'nın Polonya'yı işgali", c: "Normandiya Çıkarması", d: "Stalingrad", correct: "B", cat: "Tarih" },
  { q: "Piramitleriyle ünlü antik uygarlık hangisidir?", a: "Sümer", b: "Mısır", c: "Hitit", d: "Pers", correct: "B", cat: "Tarih" },
  { q: "Fransız İhtilali hangi yüzyılda gerçekleşmiştir?", a: "17.", b: "18.", c: "19.", d: "20.", correct: "B", cat: "Tarih" },
  { q: "Atatürk'ün doğduğu şehir neresidir?", a: "İstanbul", b: "Manastır", c: "Selanik", d: "İzmir", correct: "C", cat: "Tarih" },
  { q: "Osmanlı'nın kurucusu kimdir?", a: "Orhan Bey", b: "Osman Bey", c: "Ertuğrul Gazi", d: "I. Murad", correct: "B", cat: "Tarih" },
  { q: "Amerika kıtasına ulaşan ilk Avrupalı kaşif olarak bilinen kimdir?", a: "Macellan", b: "Vasco da Gama", c: "Kristof Kolomb", d: "Marco Polo", correct: "C", cat: "Tarih" },
  { q: "Hangisi Kurtuluş Savaşı cephelerinden biri değildir?", a: "Doğu Cephesi", b: "Güney Cephesi", c: "Batı Cephesi", d: "Kuzey Cephesi", correct: "D", cat: "Tarih" },
  { q: "Antik Yunan'da demokrasinin doğduğu şehir devleti hangisidir?", a: "Sparta", b: "Atina", c: "Korint", d: "Teb", correct: "B", cat: "Tarih" },
  { q: "Türkiye'de kadınlara milletvekili seçme ve seçilme hakkı hangi yıl verilmiştir?", a: "1930", b: "1934", c: "1926", d: "1945", correct: "B", cat: "Tarih" },
  { q: "Bizans İmparatorluğu'nun başkenti neresiydi?", a: "Roma", b: "Konstantinopolis", c: "Atina", d: "İzmir", correct: "B", cat: "Tarih" },

  // ===================== COĞRAFYA =====================
  { q: "Dünyanın okyanuslarındaki en derin nokta hangisidir?", a: "Tonga Çukuru", b: "Java Çukuru", c: "Mariana Çukuru (Challenger)", d: "Porto Riko Çukuru", correct: "C", cat: "Coğrafya" },
  { q: "Hangi ülke hem Kuzey hem Güney yarımkürede yer alır?", a: "Türkiye", b: "Brezilya", c: "Japonya", d: "İspanya", correct: "B", cat: "Coğrafya" },
  { q: "Türkiye'nin en kalabalık ikinci şehri hangisidir?", a: "İzmir", b: "Ankara", c: "Bursa", d: "Antalya", correct: "B", cat: "Coğrafya" },
  { q: "Süveyş Kanalı hangi iki denizi/su yolunu bağlar?", a: "Karadeniz-Marmara", b: "Akdeniz-Kızıldeniz", c: "Akdeniz-Atlas", d: "Kızıldeniz-Hint", correct: "B", cat: "Coğrafya" },
  { q: "Hangi ülkenin başkenti Nairobi'dir?", a: "Nijerya", b: "Kenya", c: "Tanzanya", d: "Uganda", correct: "B", cat: "Coğrafya" },
  { q: "Alpler sıradağları hangi kıtadadır?", a: "Asya", b: "Avrupa", c: "Güney Amerika", d: "Afrika", correct: "B", cat: "Coğrafya" },
  { q: "Hangisi bir yarımada değildir?", a: "İberya", b: "Anadolu", c: "Sicilya", d: "Balkan", correct: "C", cat: "Coğrafya" },
  { q: "Dünyanın en kurak çöllerinden Atacama hangi ülkededir?", a: "Peru", b: "Şili", c: "Arjantin", d: "Bolivya", correct: "B", cat: "Coğrafya" },
  { q: "Fırat Nehri hangi ülkede doğar?", a: "Suriye", b: "Irak", c: "Türkiye", d: "İran", correct: "C", cat: "Coğrafya" },
  { q: "Hangi ülkenin başkenti Canberra'dır?", a: "Yeni Zelanda", b: "Avustralya", c: "Kanada", d: "Güney Afrika", correct: "B", cat: "Coğrafya" },
  { q: "Ekvator hangi ülkeden geçmez?", a: "Ekvador", b: "Brezilya", c: "Kenya", d: "Mısır", correct: "D", cat: "Coğrafya" },
  { q: "Türkiye kaç ayrı ülke ile kara sınırına sahiptir?", a: "6", b: "7", c: "8", d: "9", correct: "C", cat: "Coğrafya" },

  // ===================== SPOR =====================
  { q: "Bir basketbol takımında sahada aynı anda kaç oyuncu bulunur?", a: "5", b: "6", c: "7", d: "11", correct: "A", cat: "Spor" },
  { q: "Tenis'te bir seti kazanmak için genelde en az kaç oyun gerekir?", a: "4", b: "5", c: "6", d: "7", correct: "C", cat: "Spor" },
  { q: "Formula 1'de yarış başında verilen ışık rengi nedir?", a: "Yeşil", b: "Kırmızı sönünce start", c: "Mavi", d: "Sarı", correct: "B", cat: "Spor" },
  { q: "Bir maraton koşusu yaklaşık kaç kilometredir?", a: "21", b: "32", c: "42", d: "50", correct: "C", cat: "Spor" },
  { q: "Hangi sporda 'servis', 'smaç' ve 'file' terimleri kullanılır?", a: "Tenis", b: "Voleybol", c: "Basketbol", d: "Hentbol", correct: "B", cat: "Spor" },
  { q: "Dünya Kupası'nı en son (2022) hangi ülke kazandı?", a: "Fransa", b: "Brezilya", c: "Arjantin", d: "Almanya", correct: "C", cat: "Spor" },
  { q: "Golf'te bir sahada standart kaç delik vardır?", a: "9", b: "12", c: "18", d: "24", correct: "C", cat: "Spor" },
  { q: "Buz hokeyinde bir takımda sahada kaç oyuncu bulunur?", a: "5", b: "6", c: "7", d: "9", correct: "B", cat: "Spor" },
  { q: "Hangi ülke modern olimpiyatların doğduğu ülkedir?", a: "İtalya", b: "Yunanistan", c: "Fransa", d: "İngiltere", correct: "B", cat: "Spor" },
  { q: "Yüzmede en hızlı stil hangisidir?", a: "Kurbağalama", b: "Sırtüstü", c: "Serbest (kravl)", d: "Kelebek", correct: "C", cat: "Spor" },

  // ===================== SANAT & EDEBİYAT =====================
  { q: "'Suç ve Ceza' romanının yazarı kimdir?", a: "Tolstoy", b: "Dostoyevski", c: "Çehov", d: "Gogol", correct: "B", cat: "Sanat & Edebiyat" },
  { q: "Mona Lisa tablosu hangi müzede sergilenir?", a: "Prado", b: "Louvre", c: "Uffizi", d: "MoMA", correct: "B", cat: "Sanat & Edebiyat" },
  { q: "'Kürk Mantolu Madonna' kimin eseridir?", a: "Sabahattin Ali", b: "Yaşar Kemal", c: "Orhan Kemal", d: "Reşat Nuri", correct: "A", cat: "Sanat & Edebiyat" },
  { q: "Hangisi bir William Shakespeare oyunudur?", a: "Faust", b: "Macbeth", c: "Sefiller", d: "Suç ve Ceza", correct: "B", cat: "Sanat & Edebiyat" },
  { q: "'İnce Memed' romanının yazarı kimdir?", a: "Orhan Pamuk", b: "Yaşar Kemal", c: "Kemal Tahir", d: "Ahmet Hamdi Tanpınar", correct: "B", cat: "Sanat & Edebiyat" },
  { q: "Ünlü 'Ayçiçekleri' tablosu kime aittir?", a: "Monet", b: "Van Gogh", c: "Cézanne", d: "Gauguin", correct: "B", cat: "Sanat & Edebiyat" },
  { q: "Türk edebiyatında 'Çalıkuşu' romanı kimindir?", a: "Halide Edip", b: "Reşat Nuri Güntekin", c: "Peyami Safa", d: "Yakup Kadri", correct: "B", cat: "Sanat & Edebiyat" },
  { q: "Hangisi bir opera terimi değildir?", a: "Aria", b: "Soprano", c: "Libretto", d: "Rebound", correct: "D", cat: "Sanat & Edebiyat" },

  // ===================== MATEMATİK & MANTIK =====================
  { q: "Bir üçgenin iç açılarının toplamı kaç derecedir?", a: "90", b: "180", c: "270", d: "360", correct: "B", cat: "Matematik & Mantık" },
  { q: "25'in karekökü kaçtır?", a: "3", b: "4", c: "5", d: "6", correct: "C", cat: "Matematik & Mantık" },
  { q: "7 x 8 kaçtır?", a: "54", b: "56", c: "58", d: "64", correct: "B", cat: "Matematik & Mantık" },
  { q: "Bir düzgün altıgenin kaç kenarı vardır?", a: "5", b: "6", c: "7", d: "8", correct: "B", cat: "Matematik & Mantık" },
  { q: "100'ün %15'i kaçtır?", a: "10", b: "15", c: "20", d: "25", correct: "B", cat: "Matematik & Mantık" },
  { q: "Hangisi bir çift sayıdır?", a: "17", b: "23", c: "38", d: "41", correct: "C", cat: "Matematik & Mantık" },
  { q: "2, 4, 8, 16, ... dizisinde sıradaki sayı nedir?", a: "24", b: "30", c: "32", d: "64", correct: "C", cat: "Matematik & Mantık" },
  { q: "Bir karenin 4 kenarı 5 cm ise çevresi kaç cm'dir?", a: "10", b: "16", c: "20", d: "25", correct: "C", cat: "Matematik & Mantık" },
  { q: "Bir saatin akrebi 12 saatte kaç tam tur atar?", a: "1", b: "2", c: "12", d: "24", correct: "A", cat: "Matematik & Mantık" },
  { q: "Hangisi asal sayıdır?", a: "1", b: "9", c: "15", d: "17", correct: "D", cat: "Matematik & Mantık" },

  // ===================== MÜZİK & FİLM =====================
  { q: "Bir gitarda standart olarak kaç tel bulunur?", a: "4", b: "5", c: "6", d: "7", correct: "C", cat: "Müzik" },
  { q: "'Bohemian Rhapsody' hangi grubun şarkısıdır?", a: "The Beatles", b: "Queen", c: "Pink Floyd", d: "Led Zeppelin", correct: "B", cat: "Müzik" },
  { q: "Bir orkestrayı yöneten kişiye ne denir?", a: "Solist", b: "Besteci", c: "Şef", d: "Menajer", correct: "C", cat: "Müzik" },
  { q: "Hangi enstrüman üflemeli değildir?", a: "Flüt", b: "Klarnet", c: "Keman", d: "Trompet", correct: "C", cat: "Müzik" },
  { q: "'Titanic' filminin yönetmeni kimdir?", a: "Steven Spielberg", b: "James Cameron", c: "Christopher Nolan", d: "Ridley Scott", correct: "B", cat: "Film & Kültür" },
  { q: "Star Wars evreninde 'Jedi'lerin kullandığı silah nedir?", a: "Blaster", b: "Işın kılıcı", c: "Yay", d: "Kalkan", correct: "B", cat: "Film & Kültür" },
  { q: "Hangisi bir Pixar animasyon filmidir?", a: "Shrek", b: "Toy Story", c: "Madagaskar", d: "Buz Devri", correct: "B", cat: "Film & Kültür" },
  { q: "'Yüzüklerin Efendisi' üçlemesi hangi ülkede çekilmiştir (ağırlıklı)?", a: "Kanada", b: "İzlanda", c: "Yeni Zelanda", d: "Norveç", correct: "C", cat: "Film & Kültür" },

  // ===================== ARAÇ BİLGİSİ =====================
  { q: "Bir otomobilde 'ABS' neyi ifade eder?", a: "Otomatik hız sabitleyici", b: "Kilitlenmeyi önleyen fren sistemi", c: "Hava yastığı sistemi", d: "Elektronik park", correct: "B", cat: "Araç Bilgisi" },
  { q: "Elektrikli araçlarda menzil hangi birimle en çok ifade edilir?", a: "Litre", b: "Kilometre", c: "Beygir", d: "Newton", correct: "B", cat: "Araç Bilgisi" },
  { q: "Aracın motor gücünü ifade eden birim hangisidir?", a: "Nm", b: "kWh", c: "Beygir (HP)", d: "Bar", correct: "C", cat: "Araç Bilgisi" },
  { q: "Lastik üzerindeki 'R' harfi neyi belirtir?", a: "Radyal yapı", b: "Kış lastiği", c: "Yarış", d: "Yenilenmiş", correct: "A", cat: "Araç Bilgisi" },
  { q: "Hangisi bir hibrit araç türü değildir?", a: "Mild hybrid", b: "Plug-in hybrid", c: "Full hybrid", d: "Turbo hybrid", correct: "D", cat: "Araç Bilgisi" },
  { q: "Aracın virajlarda savrulmasını önlemeye yardımcı sistem hangisidir?", a: "ESP", b: "GPS", c: "USB", d: "DPF", correct: "A", cat: "Araç Bilgisi" },
];

const LETTERS = ['A', 'B', 'C', 'D', 'E'];
function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function run() {
  let ti = 0;
  let inserted = 0;
  for (const item of questions) {
    const opts = [
      { L: 'A', t: item.a },
      { L: 'B', t: item.b },
      { L: 'C', t: item.c },
      { L: 'D', t: item.d },
    ];
    if (item.e) opts.push({ L: 'E', t: item.e });

    const n = opts.length;
    const correct = opts.find((o) => o.L === item.correct);
    if (!correct) { console.warn('Cevap eşleşmedi, atlandı:', item.q); continue; }

    const others = shuffle(opts.filter((o) => o.L !== item.correct).map((o) => o.t));
    const pos = ti % n;
    const finals = [];
    let oi = 0;
    for (let p = 0; p < n; p++) finals.push(p === pos ? correct.t : others[oi++]);

    const newCorrect = LETTERS[pos];
    const oa = finals[0], ob = finals[1], oc = finals[2], od = finals[3];
    const oe = n > 4 ? finals[4] : null;
    const img = item.img || null;

    // Aynı soru + aynı seçenekler zaten varsa ekleme (duplikat koruması)
    const existing = await sql`SELECT id FROM quiz_questions WHERE question = ${item.q} AND option_a = ${oa} LIMIT 1`;
    if (existing.length > 0) { continue; }

    await sql`
      INSERT INTO quiz_questions (question, option_a, option_b, option_c, option_d, option_e, image_url, correct_option, category)
      VALUES (${item.q}, ${oa}, ${ob}, ${oc}, ${od}, ${oe}, ${img}, ${newCorrect}, ${item.cat})
    `;
    ti++;
    inserted++;
  }

  const total = await sql`SELECT COUNT(*)::int as cnt FROM quiz_questions`;
  const dist = await sql`SELECT correct_option, COUNT(*)::int as cnt FROM quiz_questions GROUP BY correct_option ORDER BY correct_option`;
  console.log('Eklenen yeni soru:', inserted);
  console.log('Havuzdaki toplam soru:', total[0].cnt);
  console.log('Cevap dağılımı:', Object.fromEntries(dist.map((r) => [r.correct_option, r.cnt])));
}
run().catch((e) => console.error(e));
