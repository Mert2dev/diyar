# Diyar

Yapay zekayla oynanan Türkçe rol yapma ve hikaye oyunları. Tamamen ücretsiz, sunucu gerektirmez, GitHub Pages'te çalışır.

## İnternete koymak (GitHub Pages, ücretsiz)

1. github.com'da ücretsiz bir hesap aç (varsa giriş yap).
2. Sağ üstteki **+** → **New repository**. Ad olarak örneğin `diyar` yaz, **Public** seçili kalsın, **Create repository**.
3. Açılan sayfada **uploading an existing file** bağlantısına tıkla.
4. Bu klasörün **içindeki her şeyi** (`index.html`, `css` ve `js` klasörleri, `.nojekyll`) sürükleyip bırak, sonra **Commit changes**.
5. Depoda **Settings** → soldan **Pages** → *Branch* olarak `main` ve `/ (root)` seç → **Save**.
6. 1-2 dakika sonra site şu adreste açılır: `https://KULLANICI-ADIN.github.io/diyar/`

Bu linki arkadaşına gönder; telefondan da bilgisayardan da girebilir.

> Not: `.nojekyll` dosyası Windows'ta gizli görünebilir. Yüklenmese de site çalışır.

## İlk açılışta (oynayan kişi yapar)

1. Sitede **Anahtarı ekle**'ye bas.
2. Google hesabıyla https://aistudio.google.com/apikey adresinden ücretsiz anahtar al, yapıştır.
3. **Bağlantıyı dene**: "Çalışıyor" yazıyorsa hazır.

Anahtar yalnızca oynayan kişinin tarayıcısında saklanır; GitHub'a ya da başka bir yere gitmez. Bu yüzden anahtarı asla bu dosyalara yazma.

Ücretsiz limit dolarsa (çok uzun oturumlarda olabilir) biraz beklemek, ayarlardan başka bir Gemini modeli seçmek ya da yedek olarak ücretsiz Groq anahtarı eklemek yeterli.

## Kayıtlar

Oyunlar ve kendi yazılan senaryolar tarayıcıda saklanır. Başka bir cihaza geçerken **Ayarlar → Yedeği indir**, diğer cihazda **Yedeği yükle**.

## Yeni hazır senaryo eklemek

`js/scenarios.js` dosyasındaki listeye mevcut senaryolardan birini kopyalayıp düzenleyerek ekle. Kapak için `cover` alanına `js/covers.js` içindeki temalardan birinin adını yaz (`kuzey`, `baskent`, `meyhane`, `sisli-orman`, `buyulu-sato`, `volkan`, `savas-gogu`, `siper`, `salgin`, `neon`, `safak`).

Kod bilmeden de olur: sitedeki **Senaryo oluştur** ile istediğin dünyayı yazabilirsin.

## Bilgisayarda denemek

Dosyaya çift tıklamak çalışmaz (tarayıcı güvenliği). Klasörde bir terminal açıp `python -m http.server` çalıştır ve `http://localhost:8000` adresine git.
