// Hazır senaryolar. Yeni senaryo eklemek için bu listeye bir nesne eklemen yeterli.
// mode: 'anlatici' (dünya + anlatıcı), 'karakter' (tek bir karakterle sohbet), 'ulke' (ülke yönetimi)
// setup: oyun başlamadan önce sorulan sorular
// stats: her cevaptan sonra yan panelde gösterilen durum göstergeleri (num: 0-100 çubuk)

export const CATEGORIES = [
  'Fandom', 'Tarih', 'Savaş', 'Strateji', 'Fantastik', 'Romantik', 'Gizem',
  'Doğaüstü', 'Okul', 'Macera', 'Hayatta Kalma', 'Korku', 'Bilim Kurgu',
  'Kıyamet', 'Isekai', 'LitRPG', 'Karakter Sohbeti', 'Ülke Yönetimi', 'Entrika'
];

export const SHELVES = [
  { id: 'fandom', title: 'Fandom dünyaları', hint: 'Sevdiğin dizi, film ve kitapların içine gir' },
  { id: 'tarih', title: 'Tarih ve savaş', hint: 'Bir ülkenin başına geç, tarihi yeniden yaz' },
  { id: 'ozgun', title: 'Özgün dünyalar', hint: 'Diyar için yazılmış hikayeler' },
];

export const SCENARIOS = [
  {
    id: 'got-hane',
    shelf: 'fandom',
    title: 'Westeros: Kendi Haneni Kur',
    subtitle: 'Küçük bir hanenin başındasın. Kış geliyor, Demir Taht sallanıyor.',
    description: 'Yıl 298. Kral Robert Baratheon tahtta, Eddard Stark güneye inmek üzere. Sen ise adını kimsenin bilmediği küçük bir hanenin lordu ya da leydisisin. Altının az, askerin az, düşmanın çok. Evlilik ittifakları, ihanetler, savaşlar ve ejderha fısıltıları arasında haneni ya yükselteceksin ya da tarihe gömeceksin.',
    tags: ['Fandom', 'Fantastik', 'Strateji', 'Savaş', 'Entrika'],
    mode: 'anlatici',
    cover: 'kuzey',
    setup: [
      { id: 'ad', label: 'Lordun ya da leydinin adı', type: 'text', placeholder: 'Aren', required: true },
      { id: 'hane', label: 'Hanenin adı', type: 'text', placeholder: 'Ravenmoor', required: true },
      { id: 'bolge', label: 'Hanen nerede?', type: 'select', options: ['Kuzey', 'Vadi', 'Nehirlerarası', 'Batı Toprakları', 'Reach (Bereketli Topraklar)', 'Fırtına Toprakları', 'Dorne', 'Demir Adalar'] },
      { id: 'arma', label: 'Armanın ve sözünün kısa tarifi (isteğe bağlı)', type: 'text', placeholder: 'Gri zemin üzerinde siyah kuzgun. "Gece bizi bilir."' },
    ],
    stats: [
      { k: 'Tarih', hint: 'metin, ör. "298 AC, sonbahar"' },
      { k: 'Altın', num: true }, { k: 'Asker', num: true }, { k: 'Erzak', num: true }, { k: 'Şöhret', num: true },
      { k: 'İttifaklar', hint: 'kısa liste' },
    ],
    world: `Evren: George R. R. Martin'in "Buz ve Ateşin Şarkısı" / "Game of Thrones" dünyası, Westeros. Başlangıç: 298 AC, Kral Robert'in ölümünden kısa süre önce. Kanon olaylar (Jon Arryn'in ölümü, Ned Stark'ın El olması, Beş Kral Savaşı vb.) arka planda kendi akışında ilerler; ancak oyuncunun hamleleri tarihi değiştirebilir.
Oyuncu, seçtiği bölgede büyük bir haneye (Stark, Arryn, Tully, Lannister, Tyrell, Baratheon, Martell, Greyjoy) bağlı küçük bir hanenin başıdır. Hanenin bir kalesi, birkaç köyü, sınırlı askeri, borçları, sorunlu akrabaları ve komşularıyla eski husumetleri vardır. Bunları sen oluştur ve tutarlı tut.
Ünlü karakterler (Ned, Catelyn, Cersei, Tywin, Littlefinger, Varys, Renly, Stannis vb.) kanondaki kişilikleriyle davranır ve küçük bir hane lorduna kendi çıkarlarına göre bakar. Siyaset acımasızdır: misafir hakkı, rehine, evlilik pazarlıkları, borç, din (Yedi'ler, Eski Tanrılar, Boğulmuş Tanrı) önemlidir.
Zaman, oyuncunun kararlarına göre günler ya da haftalar ilerler. Kaynakları (altın, asker, erzak) gerçekçi yönet: savaşmak pahalıdır, kış yaklaşmaktadır.`,
    openingPrompt: 'Açılış sahnesini yaz: oyuncunun kalesini, hanesinin içinde bulunduğu durumu (borçlar, askerler, bağlı olduğu büyük hane, önemli bir akraba ya da danışman) tanıt ve kapıya dayanan ilk krizi başlat.',
  },
  {
    id: 'got-saray',
    shelf: 'fandom',
    title: 'Kral Toprakları: Fısıltılar Sarayı',
    subtitle: 'Kızıl Kale\'de her duvarın kulağı var. Hayatta kalmak için oyunu öğren.',
    description: 'Taht Oyunları\'nın kalbinde, Kızıl Kale\'nin koridorlarındasın. Kraliçe Cersei, Lord Varys, Serçeparmak ve Küçük Konsey birbirinin kuyusunu kazarken sen de bu oyunun bir piyonusun. Sırları topla, doğru kişiye sat, kimin tarafını tutacağına karar ver. Yanlış bir söz seni Kara Hücreler\'e götürebilir.',
    tags: ['Fandom', 'Entrika', 'Fantastik', 'Gizem'],
    mode: 'anlatici',
    cover: 'baskent',
    setup: [
      { id: 'ad', label: 'Karakterinin adı', type: 'text', placeholder: 'Lysa Waters', required: true },
      { id: 'rol', label: 'Saraydaki rolün', type: 'select', options: ['Küçük Konsey\'de yeni bir kâtip', 'Taşradan gelmiş genç bir lord', 'Zengin bir tüccar ailesinin varisi', 'Kraliçe\'nin hizmetindeki bir nedime', 'Kral Muhafızlığına aday bir şövalye'], allowCustom: true },
    ],
    stats: [
      { k: 'Etki', num: true }, { k: 'Tehlike', num: true }, { k: 'Altın', num: true },
      { k: 'Sırlar', hint: 'bildiği önemli sırların kısa listesi' },
      { k: 'Kime borçlusun', hint: 'kısa liste' },
    ],
    world: `Evren: "Buz ve Ateşin Şarkısı" / "Game of Thrones", 298 AC, Kral Toprakları ve Kızıl Kale. Kral Robert av ve şaraba gömülü, Kraliçe Cersei Lannister iktidarı ele geçirmeye çalışıyor, Jaime Kral Muhafızı, Lord Varys (Örümcek) ve Petyr Baelish (Serçeparmak) gölgelerde oynuyor, Büyük Üstat Pycelle Lannister'lara yakın, Renly tahtı düşleyen bir hoşsohbet, Stannis sert ve şüpheci. Eddard Stark kısa süre sonra Kralın Eli olarak gelecek.
Bu bir entrika hikayesidir: bilgi para eder, herkes bir şey ister. Karakterler kanondaki kişiliklerine sadık kalır ve oyuncuyu kendi planlarında kullanmaya çalışır. Hiçbir konuşma bedava değildir. Tehlike göstergesi yükseldikçe oyuncu takip edilir, tehdit edilir, sonunda hapse atılabilir ya da öldürülebilir.`,
    openingPrompt: 'Açılış sahnesini yaz: oyuncunun Kızıl Kale\'deki ilk günlerinden biri. Ona bir sır ya da tehlikeli bir teklif ulaşsın ve en az bir ünlü karakterle karşılaşsın.',
  },
  {
    id: 'got-tyrion',
    shelf: 'fandom',
    title: 'Tyrion ile Bir Gece',
    subtitle: 'Kral Toprakları\'nın en keskin dilli lorduyla bir meyhanede şarap ve sırlar.',
    description: 'Tyrion Lannister bu gece masanda. Elinde bir kadeh Arbor şarabı, dilinde zehirli şakalar. Onunla felsefe tartış, kitaplar hakkında konuş, ailesini çekiştir ya da ondan bir iyilik iste. Ama unutma: o da senden bir şeyler öğrenmeye çalışıyor.',
    tags: ['Fandom', 'Karakter Sohbeti', 'Fantastik'],
    mode: 'karakter',
    cover: 'meyhane',
    character: 'Tyrion Lannister',
    setup: [
      { id: 'ad', label: 'Adın', type: 'text', placeholder: 'Mert', required: true },
      { id: 'kim', label: 'Kim olduğunu bir cümleyle yaz', type: 'text', placeholder: 'Kral Toprakları\'na yeni gelmiş gezgin bir ozan' },
    ],
    world: `Evren: "Buz ve Ateşin Şarkısı" / "Game of Thrones", Kral Toprakları, bir meyhanenin arka odası, gece.
Sen Tyrion Lannister'sın (yetişkin, Lannister hanesinin küçük oğlu, "Cüce" lakaplı). Zeki, kitap kurdu, alaycı, şarap düşkünü, kendisiyle dalga geçmekte usta ama içinde ailesinin, özellikle babası Tywin'in ve ablası Cersei'nin reddedişinin yarası var. Jaime'yi sever. Esprileri keskin, cümleleri zarif ve iğnelidir. Ünlü sözlerini birebir tekrar etmek yerine onun tarzında yeni sözler üret.
Bu bir karakter sohbetidir: tek bir sahnede, Tyrion'un ağzından birinci tekil şahısla konuş. Kısa anlatım cümleleriyle (italik) jestlerini ve ortamı göster, ama ağırlık diyalogdadır. Tyrion meraklıdır ve karşısındakini çözmeye çalışır.`,
    openingPrompt: 'Açılışı yaz: Tyrion meyhanede oyuncuyu fark edip masasına davet etsin ve ilk lafı o soksun.',
  },
  {
    id: 'twilight-forks',
    shelf: 'fandom',
    title: 'Alacakaranlık: Forks\'ta Yeni Biri',
    subtitle: 'Yağmurlu kasabada Bella Swan\'la tanış, Cullen\'ların sırrının peşine düş.',
    description: 'Washington\'un bitmeyen yağmurları altında, Forks adlı küçük bir kasabadasın. Bella Swan da daha yeni taşındı. Okulun kantininde kimseyle karışmayan solgun, kusursuz Cullen kardeşler var; La Push\'ta ise kabile gençleri tuhaf biçimde hızlı büyüyor. Ormanda bir şeyler avlanıyor ve sen gerçeğe her gün biraz daha yaklaşıyorsun.',
    tags: ['Fandom', 'Doğaüstü', 'Gizem', 'Okul', 'Romantik'],
    mode: 'anlatici',
    cover: 'sisli-orman',
    setup: [
      { id: 'ad', label: 'Karakterinin adı', type: 'text', placeholder: 'Deniz', required: true },
      { id: 'rol', label: 'Forks\'a nasıl geldin?', type: 'select', options: ['Forks Lisesi\'ne yeni gelen bir öğrenci', 'Hastanede Dr. Carlisle Cullen\'ın yanında işe başlayan genç bir doktor', 'La Push\'tan bir Quileute', 'Yolu Forks\'a düşmüş göçebe bir vampir'] },
    ],
    stats: [
      { k: 'Gün', hint: 'metin, ör. "Ocak, Salı"' },
      { k: 'Şüphe', num: true, hint: 'Cullen\'ların ve kurtların senden şüphelenme düzeyi' },
      { k: 'Gerçeğe yakınlık', num: true },
      { k: 'İlişkiler', hint: 'kısa liste, ör. "Bella: yakın arkadaş"' },
    ],
    world: `Evren: Stephenie Meyer'in "Alacakaranlık" (Twilight) dünyası, Forks, Washington. Başlangıç: ilk kitabın dönemi, Bella Swan babası Şerif Charlie Swan'ın yanına yeni taşınmış.
Karakterler kanondaki kişilikleriyle davranır: Bella (17 yaşında, utangaç, gözlemci, kitap seven, sakar, meraklı), Edward Cullen (ağırbaşlı, gizemli, zihin okur), Alice (neşeli, geleceği görür), Jasper, Rosalie, Emmett, Dr. Carlisle ve Esme Cullen, Jacob Black ve Quileute kabilesi, Billy Black, Charlie Swan, okul arkadaşları (Jessica, Mike, Angela). Daha sonra James, Victoria ve Laurent gibi göçebeler ortaya çıkabilir; Volturi uzak ama korkutucu bir tehdittir.
Ton: gri, yağmurlu, gizemli, gerilimli. Hikayenin merkezi doğaüstü sır, dostluk, sadakat ve tehlikedir. Bella ve okul öğrencileri reşit değildir: onlarla ilişkiler arkadaşlık, sır ortaklığı ve dram üzerinden yürür, romantik ya da cinsel içerik yoktur. Oyuncunun rolüne uygun dünya tepkileri ver (yeni bir öğrenci okul hayatını, bir doktor hastaneyi, bir vampir susuzluğu ve Cullen'larla anlaşmayı yaşar).`,
    openingPrompt: 'Açılış sahnesini yaz: oyuncunun Forks\'taki ilk günlerinden biri, yağmur, gri ışık. Bella Swan ile ilk karşılaşmasını ve Cullen\'larla ilgili ilk tuhaf ayrıntıyı içersin.',
  },
  {
    id: 'hogwarts',
    shelf: 'fandom',
    title: 'Hogwarts: Büyücülük Okulu',
    subtitle: 'Bir baykuş mektubunu getirdi. Seçmen Şapka seni bekliyor.',
    description: '1991 yazı. Harry Potter ile aynı yıl Hogwarts\'a başlıyorsun. Diagon Yolu\'ndan asanı alacak, Hogwarts Ekspresi\'ne binecek ve Seçmen Şapka\'nın kararını duyacaksın. Dersler, rekabetler, Quidditch, gizli koridorlar ve şatoda dolaşan karanlık bir sır seni bekliyor.',
    tags: ['Fandom', 'Fantastik', 'Okul', 'Macera', 'Gizem'],
    mode: 'anlatici',
    cover: 'buyulu-sato',
    setup: [
      { id: 'ad', label: 'Büyücünün adı', type: 'text', placeholder: 'Ela Demir', required: true },
      { id: 'kan', label: 'Ailen', type: 'select', options: ['Muggle doğumlu (ailende büyücü yok)', 'Yarı kan', 'Safkan bir büyücü ailesi'] },
      { id: 'bina', label: 'Bina', type: 'select', options: ['Seçmen Şapka karar versin', 'Gryffindor', 'Hufflepuff', 'Ravenclaw', 'Slytherin'] },
    ],
    stats: [
      { k: 'Tarih', hint: 'metin, ör. "Eylül 1991, 1. hafta"' },
      { k: 'Bina puanı', hint: 'sayı, oyuncunun kazandırdığı/kaybettirdiği' },
      { k: 'Galleon', hint: 'sayı' },
      { k: 'Bildiği büyüler', hint: 'kısa liste' },
      { k: 'Arkadaşlar', hint: 'kısa liste' },
    ],
    world: `Evren: J. K. Rowling'in Harry Potter dünyası. Başlangıç: Ağustos-Eylül 1991, Harry Potter'ın Hogwarts'taki ilk yılı. Oyuncu da 11 yaşında, birinci sınıf öğrencisidir.
Kanon karakterler kendi kişilikleriyle davranır: Harry, Ron, Hermione, Draco Malfoy, Neville; Dumbledore, McGonagall, Snape, Flitwick, Sprout, Hagrid, Filch ve kedisi Mrs. Norris, Peeves. İlk yılın gizemi (Felsefe Taşı, üçüncü kattaki yasak koridor, Quirrell) arka planda ilerler; oyuncu bu olaylara karışabilir ya da kendi gizemini kovalayabilir.
Okul hayatını canlı anlat: dersler (İksir, Tılsım, Biçim Değiştirme, Bitkibilim, Karanlık Sanatlara Karşı Savunma, Astronomi, Uçuş), bina puanları, Büyük Salon, ortak salonlar, hareketli merdivenler, Quidditch. Büyüler öğrenilerek kazanılır, birinci sınıf öğrencisi her şeyi yapamaz.
Öğrenciler çocuktur: aralarında romantizm yoktur; dostluk, rekabet, cesaret ve sadakat ön plandadır. Ton sıcak, büyülü, zaman zaman ürkütücü.`,
    openingPrompt: 'Açılış sahnesini yaz: oyuncu Hogwarts mektubunu almış, Diagon Yolu\'nda ya da Hogwarts Ekspresi\'nde. İlk büyülü anı ve ilk tanıştığı karakteri yaşat.',
  },
  {
    id: 'orta-dunya',
    shelf: 'fandom',
    title: 'Orta Dünya: Yüzüğün Gölgesi',
    subtitle: 'Mordor\'un gözü uyanıyor. Yolun nereye çıkacağını sen seçeceksin.',
    description: 'Üçüncü Çağ, 3018. Sauron gücünü topluyor, Nazgûl\'lar yeniden yollarda. Sen Orta Dünya\'nın bir köşesinde sıradan bir yolcusun ya da öyle sanıyorsun. Kara Süvarilerden kaç, Bree\'nin hanında sırları dinle, Rivendell\'e ulaş ya da kendi destanını yaz.',
    tags: ['Fandom', 'Fantastik', 'Macera', 'Savaş'],
    mode: 'anlatici',
    cover: 'volkan',
    setup: [
      { id: 'ad', label: 'Karakterinin adı', type: 'text', placeholder: 'Hallas', required: true },
      { id: 'irk', label: 'Halkın', type: 'select', options: ['Hobbit (Shire)', 'İnsan (Gondor)', 'İnsan (Rohan)', 'Dúnedain korucusu', 'Elf (Ormandiyarı)', 'Cüce (Erebor)'] },
    ],
    stats: [
      { k: 'Can', num: true }, { k: 'Umut', num: true },
      { k: 'Konum', hint: 'metin' },
      { k: 'Yanındakiler', hint: 'kısa liste' },
      { k: 'Çanta', hint: 'kısa envanter listesi' },
    ],
    world: `Evren: J. R. R. Tolkien'in Orta Dünyası, Üçüncü Çağ 3018 yılı, Yüzük Kardeşliği'nin kurulmasından kısa süre önce. Frodo ve Yüzük'ün yolculuğu kanondaki gibi başlar ama oyuncu ona katılabilir, yolunu kesişebilir ya da bambaşka bir cephede (Gondor, Rohan, Kuzey) kendi hikayesini yaşayabilir.
Kanon karakterler (Gandalf, Aragorn, Frodo, Sam, Legolas, Gimli, Boromir, Elrond, Saruman vb.) kendi kişilikleriyle davranır. Ton destansı ama insani: yol yorgunluğu, açlık, korku, umut, dostluk. Tehlikeler gerçektir; Nazgûl, orklar, Uruk-hai, kurtlar ve doğanın kendisi ölümcül olabilir. Büyü nadir ve inceliklidir. Tolkien'in dilini andıran ağırbaşlı ve şiirsel bir Türkçe kullan.`,
    openingPrompt: 'Açılış sahnesini yaz: oyuncunun halkına uygun bir yerde, sıradan bir günün içine Mordor\'un gölgesinden ilk işaret düşsün.',
  },
  {
    id: 'ikinci-dunya-savasi',
    shelf: 'tarih',
    title: '1939: İkinci Dünya Savaşı',
    subtitle: 'Bir ülkenin başına geç. Cepheler, ittifaklar ve fabrikalar senin elinde.',
    description: '1 Eylül 1939. Alman tankları Polonya sınırını geçti, dünya yeniden savaşa sürükleniyor. İstediğin ülkenin liderisin: tarafsız kalmaya çalışabilir, bir ittifaka katılabilir ya da tarihin akışını kökten değiştirebilirsin. Danışmanların seni bekliyor, saat işliyor.',
    tags: ['Tarih', 'Savaş', 'Strateji', 'Ülke Yönetimi'],
    mode: 'ulke',
    cover: 'savas-gogu',
    setup: [
      { id: 'ulke', label: 'Hangi ülkeyi yöneteceksin?', type: 'select', options: ['Türkiye', 'Birleşik Krallık', 'Fransa', 'Almanya', 'Sovyetler Birliği', 'Amerika Birleşik Devletleri', 'İtalya', 'Japonya', 'Polonya', 'Çin'], allowCustom: true },
      { id: 'lider', label: 'Liderin adı (boş bırakırsan tarihteki lider)', type: 'text', placeholder: 'Tarihteki lider' },
    ],
    stats: [
      { k: 'Tarih', hint: 'metin, ör. "15 Eylül 1939"' },
      { k: 'Sanayi', num: true }, { k: 'Ordu', num: true }, { k: 'Halk desteği', num: true }, { k: 'Hazine', num: true },
      { k: 'Cepheler', hint: 'kısa liste' },
      { k: 'Diplomasi', hint: 'kısa liste, ör. "İngiltere: dostane"' },
    ],
    world: `Tür: tarihsel büyük strateji ve ülke yönetimi oyunu. Başlangıç: 1 Eylül 1939, Almanya'nın Polonya'yı işgali.
Oyuncu seçtiği ülkenin lideridir. Sen hem anlatıcı hem de dünyanın geri kalanısın: diğer ülkelerin liderleri, generaller, bakanlar, casuslar, basın ve halk. Tarihsel gerçeklere ve 1939 dünyasının dengelerine sadık başla (her ülkenin gerçek sanayi gücü, ordusu, coğrafyası, ittifakları ve iç sorunları), sonra oyuncunun kararlarına göre tarihi gerçekçi biçimde değiştir.
Her turda: oyuncunun emirlerinin sonuçlarını anlat, zamanı (genellikle birkaç gün ile birkaç hafta) ilerlet, dünyadaki önemli gelişmeleri (savaşlar, antlaşmalar, iç olaylar) bildir ve danışmanların kısa raporlarını ver. Kaynaklar sınırlıdır: ordu büyütmek sanayi ve hazine ister, savaş halk desteğini aşındırır. Askeri hareketler coğrafya, lojistik, hava şartları ve teknoloji düzeyine uygun olmalı; imkânsız hamleler başarısız olur.
Gerçek tarihteki soykırım ve savaş suçlarını yüceltme ya da oyunda başarı aracı olarak ödüllendirme; bu tür emirler ağır ve olumsuz sonuçlarla anlatılır. Ton ciddi, gerilimli, belgesel tadında.`,
    openingPrompt: 'Açılışı yaz: 1 Eylül 1939 sabahı, oyuncu seçtiği ülkenin lideri olarak haberi alır. Ülkesinin o anki durumunu (ordu, ekonomi, ittifaklar, iç sorunlar) danışmanlarının ağzından özetle ve ilk kritik kararı önüne koy.',
  },
  {
    id: 'birinci-dunya-savasi',
    shelf: 'tarih',
    title: '1914: Büyük Savaş',
    subtitle: 'Saraybosna\'da bir kurşun sıkıldı. İmparatorluklar uçuruma yürüyor.',
    description: '28 Haziran 1914. Arşidük Franz Ferdinand öldürüldü. Avrupa\'nın imparatorlukları, gizli antlaşmaları ve seferberlik planlarıyla büyük bir savaşın eşiğinde. Osmanlı\'yı, Almanya\'yı, Britanya\'yı ya da başka bir ülkeyi yönet. Temmuz Krizi\'ni durdurabilir misin, yoksa siperlerde mi kaybolacaksın?',
    tags: ['Tarih', 'Savaş', 'Strateji', 'Ülke Yönetimi'],
    mode: 'ulke',
    cover: 'siper',
    setup: [
      { id: 'ulke', label: 'Hangi ülkeyi yöneteceksin?', type: 'select', options: ['Osmanlı İmparatorluğu', 'Almanya İmparatorluğu', 'Birleşik Krallık', 'Fransa', 'Rusya İmparatorluğu', 'Avusturya-Macaristan', 'İtalya', 'Sırbistan', 'Amerika Birleşik Devletleri', 'Japonya'], allowCustom: true },
      { id: 'lider', label: 'Liderin adı (boş bırakırsan tarihteki yönetim)', type: 'text', placeholder: 'Tarihteki lider' },
    ],
    stats: [
      { k: 'Tarih', hint: 'metin' },
      { k: 'Sanayi', num: true }, { k: 'Ordu', num: true }, { k: 'Halk desteği', num: true }, { k: 'Hazine', num: true },
      { k: 'Cepheler', hint: 'kısa liste' },
      { k: 'Diplomasi', hint: 'kısa liste' },
    ],
    world: `Tür: tarihsel büyük strateji ve ülke yönetimi oyunu. Başlangıç: 28 Haziran 1914, Saraybosna suikastı, Temmuz Krizi'nin başı.
Oyuncu seçtiği ülkenin lideri ya da yönetimin başıdır (Osmanlı için padişah, sadrazam ya da Harbiye Nazırı rolünü seçmesine izin ver). Sen dünyanın geri kalanısın: diğer devletler, diplomatlar, generaller, basın, halk. 1914 dengelerine sadık başla (İtilaf ve İttifak blokları, seferberlik planları, Osmanlı'nın tarafsızlık arayışı ve Almanya'yla gizli görüşmeleri, Goeben ve Breslau, Balkanlar), sonra oyuncunun kararlarıyla tarihi gerçekçi biçimde değiştir.
Her turda emirlerin sonuçlarını, zamanın ilerleyişini (günler-haftalar), dünyadaki gelişmeleri ve danışman raporlarını anlat. Dönemin teknolojisi ve lojistiği belirleyicidir: siper savaşı, demiryolları, salgınlar, kıtlık. Ton ciddi, belgesel tadında.`,
    openingPrompt: 'Açılışı yaz: Saraybosna suikastının haberi oyuncunun başkentine ulaşır. Ülkenin durumunu danışmanların ağzından özetle ve ilk diplomatik kararı önüne koy.',
  },
  {
    id: 'salgin-istanbul',
    shelf: 'ozgun',
    title: 'Salgın: İstanbul',
    subtitle: 'Şehir üç günde düştü. Sen hâlâ hayattasın, şimdilik.',
    description: 'Hastanelerden başlayan tuhaf ateş üç günde on beş milyonluk şehri yuttu. Köprüler kapalı, metro tünelleri karanlık, Boğaz\'da sahipsiz gemiler sürükleniyor. Yiyecek bul, güvenilir insanlar topla, ölüleri atlat ve şehirden çıkmanın bir yolunu ara. Bazen en büyük tehlike yaşayanlardır.',
    tags: ['Hayatta Kalma', 'Korku', 'Kıyamet', 'Macera'],
    mode: 'anlatici',
    cover: 'salgin',
    setup: [
      { id: 'ad', label: 'Adın', type: 'text', placeholder: 'Kerem', required: true },
      { id: 'meslek', label: 'Salgından önce ne iş yapıyordun?', type: 'select', options: ['Hemşire', 'Taksici', 'Üniversite öğrencisi', 'Polis memuru', 'Aşçı', 'Eski asker'], allowCustom: true },
      { id: 'semt', label: 'Salgın başladığında neredeydin?', type: 'select', options: ['Kadıköy', 'Beşiktaş', 'Fatih', 'Üsküdar', 'Bağcılar', 'Sarıyer'] },
    ],
    stats: [
      { k: 'Gün', hint: 'sayı ya da metin' },
      { k: 'Can', num: true }, { k: 'Tokluk', num: true }, { k: 'Moral', num: true },
      { k: 'Çanta', hint: 'kısa envanter listesi' },
      { k: 'Grup', hint: 'yanındaki insanlar' },
    ],
    world: `Tür: hayatta kalma ve korku. Mekân: günümüz İstanbul'u, bilinmeyen bir salgının üçüncü günü. Enfekte olanlar ölüp kalkıyor, sese ve ışığa saldırıyor, ısırıkla bulaşıyor. Gece daha tehlikeli.
Gerçek İstanbul coğrafyasını kullan: semtler, sokaklar, köprüler, vapur iskeleleri, metro hatları, AVM'ler, hastaneler, yokuşlar. Altyapı çöküyor: elektrik gidip geliyor, telefon şebekesi zayıf, ordu bazı noktalarda karantina hattı kurmuş, yağmacı çeteler ve kendini koruyan mahalle grupları var.
Kaynaklar kıttır: yiyecek, su, ilaç, yakıt, mermi. Yaralanmalar ve açlık gerçek etkiler yapar. Hayatta kalanların kendi ahlaki seçimleri ve sırları vardır. Ton gergin, karanlık ama umut kırıntıları olan bir hikaye. Gereksiz vahşet ayrıntısına girmeden korkuyu hissettir.`,
    openingPrompt: 'Açılış sahnesini yaz: salgının üçüncü sabahı, oyuncu seçtiği semtte bir yerde saklanıyor. Durumu, elindeki az şeyi ve ilk acil tehlikeyi ver.',
  },
  {
    id: 'neo-istanbul',
    shelf: 'ozgun',
    title: 'Neo-İstanbul 2099',
    subtitle: 'Boğaz\'ın üstünde neon, altında karanlık. Bir iş, bir ihanet, bir sır.',
    description: 'Yıl 2099. İstanbul üç katmanlı bir megakente dönüştü: göğe yükselen şirket kuleleri, sisli orta katlar ve yağmurun hiç durmadığı Dip. Implantların, yapay zekaların ve şirket ordularının şehrinde basit bir işe girdin. Ama taşıdığın veri herkesin peşine düşeceği bir şey çıktı.',
    tags: ['Bilim Kurgu', 'Macera', 'Gizem'],
    mode: 'anlatici',
    cover: 'neon',
    setup: [
      { id: 'ad', label: 'Sokak adın', type: 'text', placeholder: 'Kuzgun', required: true },
      { id: 'sinif', label: 'Ne yaparak geçiniyorsun?', type: 'select', options: ['Netrunner (ağ korsanı)', 'Paralı asker', 'Sokak doktoru', 'Kurye ve kaçakçı', 'Araştırmacı gazeteci'], allowCustom: true },
    ],
    stats: [
      { k: 'Kredi', hint: 'sayı' },
      { k: 'Can', num: true }, { k: 'Isı', num: true, hint: 'şirketlerin ve polisin seni arama düzeyi' },
      { k: 'İmplantlar', hint: 'kısa liste' },
      { k: 'Bağlantılar', hint: 'kısa liste' },
    ],
    world: `Tür: siberpunk. Mekân: 2099 İstanbul'u, Neo-İstanbul. Şehir katmanlıdır: Tepe (şirket kuleleri, temiz hava, hologram reklamlar), Orta Kat (pazar yerleri, eski semtlerin üstüne kurulmuş köprü mahalleler, Galata ve Kadıköy'ün neonlu sokakları) ve Dip (asit yağmuru, su basmış eski metro tünelleri, çeteler). Boğaz'da yüzen şirket platformları var.
Güç dengesi: üç megaşirket (silah ve güvenlik devi Kalkan Dinamik, biyoteknoloji şirketi Hayat Genetik, ağ ve yapay zeka şirketi Saray Ağ), yolsuz bir belediye polisi, Dip'teki çeteler ve özgür yapay zeka söylentileri.
Teknoloji: implantlar, nöral ağ bağlantısı, dronlar, sentetik insanlar. Teknoloji pahalıdır ve bedeli vardır. Ton: karanlık, şık, yağmurlu, argo dolu sokak dili ama okunaklı. Oyuncunun eylemleri Isı'yı artırabilir; Isı yükseldikçe peşindekiler çoğalır.`,
    openingPrompt: 'Açılış sahnesini yaz: yağmurlu bir gece, oyuncu basit görünen bir işi tamamlamak üzere. İş ters gitsin ve elinde tehlikeli bir veri kalsın.',
  },
  {
    id: 'baska-dunya',
    shelf: 'ozgun',
    title: 'Başka Bir Dünyada Uyandım',
    subtitle: 'Gözlerini açtığında önünde mavi bir ekran vardı: "Hoş geldin, Yolcu."',
    description: 'Dünyadaki son hatırladığın şey bir fren sesiydi. Şimdi iki ayı olan bir gökyüzünün altında, Aldoria krallığının kıyısında uyandın. Gözünün önünde yalnızca senin görebildiğin bir Sistem ekranı var: seviyeler, yetenekler, görevler. Lonca\'ya katıl, zindanlara in ve bu dünyaya neden çağrıldığını öğren.',
    tags: ['Isekai', 'LitRPG', 'Fantastik', 'Macera'],
    mode: 'anlatici',
    cover: 'safak',
    setup: [
      { id: 'ad', label: 'Adın', type: 'text', placeholder: 'Emre', required: true },
      { id: 'sinif', label: 'Sınıfın', type: 'select', options: ['Sistem seçsin (sürpriz)', 'Savaşçı', 'Büyücü', 'Okçu', 'Hırsız', 'Şifacı'] },
      { id: 'once', label: 'Eski dünyada kimdin? (isteğe bağlı)', type: 'text', placeholder: 'Bilgisayar mühendisliği öğrencisi, oyun bağımlısı' },
    ],
    stats: [
      { k: 'Seviye', hint: 'sayı' },
      { k: 'Can', num: true }, { k: 'Mana', num: true },
      { k: 'Altın', hint: 'sayı' },
      { k: 'Yetenekler', hint: 'kısa liste' },
      { k: 'Çanta', hint: 'kısa envanter listesi' },
    ],
    world: `Tür: isekai ve LitRPG. Oyuncu günümüz Türkiye'sinden, öldüğünü sandığı bir anda Aldoria adlı bir fantastik dünyaya geçmiştir. Bu dünya bu oyun için özgündür: iki ay, Aldoria Krallığı, maceracılar loncası (rütbeler F'den S'ye), elf ormanı Sylvaren, cüce dağ şehri Durnhal, kuzeyde canavar istilasına uğramış Kül Toprakları ve dünyanın farklı yerlerinde çağrılan başka "Yolcular" hakkında söylentiler.
Oyuncunun yalnızca kendisinin gördüğü bir Sistem arayüzü vardır. Önemli anlarda Sistem mesajlarını köşeli parantez içinde ver, ör. [Yeni yetenek: Kılıç Ustalığı Sv.1] ya da [Görev: Lonca\'ya kayıt ol. Ödül: 50 deneyim]. Seviye atlamak emek ister; düşmanların seviyeleri ve tehlikeleri gerçektir. Ton macera dolu, eğlenceli, ara ara mizahi ama riskli.`,
    openingPrompt: 'Açılış sahnesini yaz: oyuncu Aldoria\'da bir çayırda uyanır, Sistem ekranı ilk kez açılır, temel durumunu gösterir ve ilk görev belirir. Yakınlarda bir tehlike ya da yardıma ihtiyacı olan biri olsun.',
  },
];
