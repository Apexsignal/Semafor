# Semafor asistent — PoC rozpoznavani barvy + obecny kamerovy asistent

Puvodni napad: krabicka s kamerou + BT/WiFi vysilacem, napajena z USB/12V
zasuvky v aute, co sedi na palubce starsiho auta (bez zabudovaneho
asistenta), rozpoznava barvu semaforu pred autem a hlasi ji (na displeji
telefonu nebo hlasem), aby ridic nemusel porad civet nahoru a cekat na
zmenu.

Tenhle repozitar zacal **jen jako software prototyp jadra** teto myslenky —
algoritmu, ktery z obrazu pozna, jestli sviti cervena, oranzova nebo zelena
(viz sekce "Desktop / Python PoC" nize, beze zmeny). Zadny hardware (kamera,
mikrokontroler, BT/WiFi modul) zatim nikde neni, viz "Dalsi kroky" nize.

**Rozsireni:** `web/` uz neni jen detektor semaforu — appka ho prepracovala
na **obecny kamerovy asistent** ("Pozorovatel"), ktery misto jednoho ucelu
(barva semaforu) umi vic rezimu naraz — viz sekce "`web/` — obecny kamerovy
asistent" nize. Puvodni myslenka (jen semafor, jen pro ridice ve stojicim
aute) zustava zdokumentovana v teto sekci a v Python PoC — appka ji
nezahodila, jen ji rozsirila.

## Co to umi

### Desktop / Python PoC

- `detector.py` — jadro: z jednoho snimku (BGR obrazek z OpenCV) najde
  kruhove kandidaty na svitilny (Houghova transformace) a pro kazdy zmeri,
  jak moc odpovida cervene/oranzove/zelene barve v HSV. Vrati nejsilnejsi
  shodu nad prahem, nebo `None`.
- `generate_samples.py` — vygeneruje synteticke testovaci obrazky semaforu
  (cerne pouzdro + 3 kruhy, jeden rozsviceny), protoze v tomhle prostredi
  neni k dispozici realna fotka/video skutecneho semaforu.
- `test_detector.py` — spusti detektor na vsech synteticky vygenerovanych
  vzorcich a overi, ze pozna spravnou barvu.
- `webcam_demo.py` — ziva ukazka: cte webkameru nebo video soubor, kresli
  detekci do obrazu a (volitelne, `--voice`) hlasi zmenu stavu nahlas
  pres `pyttsx3` (offline TTS, zadne API klice).

### `web/` — obecny kamerovy asistent ("Pozorovatel")

Puvodni verze `web/` uměla jen jedno: barvu semaforu, jen kdyz auto stoji.
Appka ji na uzivatelovo prani prepracovala na **obecny kamerovy asistent**
— zadny build krok, cisty `index.html` + `style.css` + `app.js`, ktery
funguje na mobilu i desktopu primo v prohlizeci. Ctyri rezimy:

- **Objekty** — prubezne (pres [TensorFlow.js](https://www.tensorflow.org/js)
  + model [COCO-SSD](https://github.com/tensorflow/tfjs-models/tree/master/coco-ssd),
  na CDN, zadny vlastni backend) appka nahlas rika, co pozna (auto, osoba,
  pes, kolo…) a kresli kolem toho ramecky. COCO-SSD zna jen ~80 beznych
  kategorii — bezne veci kolem domu (klimatizace, radiator, lampa…) nepozna
  a rekne o tom appka hlaskou primo v UI. Volitelny prepinac **„Chytrejsi
  rozpoznavani"** v nastaveni tohle obchazi — pri zapnutem prepinaci a
  ulozenem API klici appka navic kazdych ~6 s posle snimek do Claude Vision,
  ktere umi pojmenovat cokoliv (ne jen COCO-80), na ukor kreditu na klici.
- **Barva** — tuknes kamkoliv na obraz, appka rekne nejblizsi nazev barvy.
  Appka prumeruje mala plosku pixelu (ne jeden pixel — sum kamery a komprese
  by jinak kazily odhad) a barvu appka klasifikuje v HSV/HSL prostoru s
  samostatnym rozpoznanim achromatickych (cerna/bila/seda) tonu — naivni
  RGB vzdalenost totiz plete tmave/teplo nasvicene bile povrchy s hnedou.
- **Merit** — dvouklikova kalibrace podle predmetu se znamou sirkou (napr.
  platebni karta), pak appka dvema tuknutimi odhadne sirku/vysku predmetu a
  vykresli caru s odhadem v cm. Neni to laserove mereni, jen odhad z kamery.
- **Asistent** — chodecky rezim: appka nahlas upozornuje, kdyz se neco
  velkeho priblizuje uprostred zaberu ("Pozor, prekazka vpred") — heuristika
  z velikosti/pozice detekovaneho ramecku, ne skutecne mereni vzdalenosti.
- **"Popis, co vidim"** — jednorazovy snimek appka posle (pres vlastni
  Anthropic API klic uzivatele, ulozeny jen v `localStorage` prohlizece) do
  Claude Vision a appka dostane bohaty popis i veci, ktere prubezna detekce
  nezna (druh stromu, znacka auta, co tece v rece, text na cedule…).

Puvodni myslenka "jen semafor, jen kdyz auto stoji" (GPS rychlost pod
~5 km/h, HSV+Houghovy kruznice pres OpenCV.js) appku porad inspirovala k
tomuhle rozsireni, ale kod appka nahradila — specificky semaforovy detektor
v `web/` uz neni, zustava jen v Python PoC nize (`detector.py` a spol.),
kde funguje beze zmeny.

Overeno end-to-end v headless Chromiu (Playwright, s naimitovanou kamerou a
naimitovanym COCO-SSD modelem — realna sit k CDN v tomhle vyvojovem
sandboxu nejde) — prepinani rezimu, kalibrace/mereni (vcetne matematiky
prevodu souradnic pri `object-fit:cover`), vzorkovani barvy a AI-klic guard
appka takhle overila bez chyb v konzoli. Zivou kameru na realnem telefonu
appka v tomhle prostredi otestovat nemohla.

**Jak to spustit na skutecnem telefonu:** stranka potrebuje HTTPS (kamera
v prohlizeci na file:// nebo http:// bezne nejde), takze `web/` je urcene
k nahrani na staticky HTTPS hosting (Netlify, GitHub Pages...) a otevreni
odkazu primo v mobilnim prohlizeci. Zadna instalace, zadny app store.
**Znamy limit:** prohlizec nejde nechat bezet na pozadi/pri zamknute
obrazovce (na rozdil od nativni appky) — displej tedy musi svitit
s otevrenou strankou.

## Jak spustit

```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# vygenerovat testovaci obrazky a overit detektor
python generate_samples.py
python test_detector.py

# ziva ukazka z webkamery (q pro ukonceni)
python webcam_demo.py

# ziva ukazka z nahraneho videa + hlasove hlaseni
python webcam_demo.py cesta/k/videu.mp4 --voice
```

Web verze (lokalne na pocitaci, jen pro vyvoj — kamera na mobilu potrebuje
HTTPS, viz sekce nize):

```bash
cd web && python3 -m http.server 8000
# otevrit http://localhost:8000 v prohlizeci na pocitaci s webkamerou
```

## Jak algoritmus funguje (Python PoC — puvodni semaforovy detektor)

1. Prevod snimku do HSV a rozostreni pro potlaceni sumu.
2. Houghova transformace najde kruhove oblasti v obraze (kandidati na
   svitilny semaforu — cerne pouzdro s kruhovymi otvory).
3. Pro kazdy kruh se spocita, jaky podil jeho plochy padne do HSV rozsahu
   cervene / oranzove / zelene.
4. Kruh, kde tenhle podil prekroci prah (`MIN_FILL_RATIO`, aktualne 35 %),
   a je nejvyssi ze vsech kandidatu, se vyhlasi jako "sviti tahle barva".
   Nesviticí svitilny maji nizkou sytost/jas, takze do zadneho barevneho
   rozsahu nespadnou a detektor je ignoruje.

## Znama omezeni Python PoC (tohle je PoC, ne hotove reseni)

- **Nepozna tvar semaforu jako celek** — nekontroluje, ze tri kruhy jsou
  svisle nad sebou v jednom cernem pouzdre. Cokoli kulateho a syte
  cervene/oranzove/zelene barvy (brzdove svetlo, cervena znacka) muze
  zpusobit falesnou detekci. Dalsi krok: overovat i geometrii (3 kruhy
  stejneho polomeru, pravidelne rozestupy, spolecne pouzdro).
- **Citlive na svetelne podminky** — presvit, protisvetlo, dest/mlha
  ci noc mohou HSV prahy rozhodit. Realne nasazeni by potrebovalo vic
  testovacich dat z realnych podminek a pravdepodobne i adaptivni prahy
  nebo natrenovany model (napr. maly YOLO/CNN klasifikator) misto
  rucnich HSV rozsahu.
- **Testovano jen na syntetickych obrazcich**, ne na realnych fotkach
  ceskych semaforu (ktere maji navic pred zelenou kombinaci
  cervena+oranzova, tenhle PoC ji rozezna jako "cervena", coz je
  bezpecnostne spravna strana chyby).
- **Zadne rozliseni vice semaforu v zaberu** (krizovatky s vice sloupky) —
  vraci jen jednu, nejsilnejsi detekci.

## Dalsi kroky smerem k puvodnimu hardwarovemu napadu

- **Hardware**: kamerovy modul + levny SoC s WiFi/BT (napr. ESP32-CAM
  nebo Raspberry Pi Zero 2 W), napajeny z USB/12V zasuvky auta, na
  drzaku na palubce.
- **Prenos na telefon**: bud BLE (nizka spotreba, staci poslat 1 bajt
  stavu) nebo lokalni WiFi/hotspot s jednoduchym HTTP/WebSocket streamem
  stavu do mobilni appky.
- **Legalni/bezpecnostni stranka**: overit, jestli pouzivani takoveho
  zarizeni pri jizde nespada pod zakaz drzeni/pouzivani telefonu za jizdy
  (hlasovy vystup bez nutnosti se divat na displej je pravdepodobne
  bezpecnejsi a snaz obhajitelna varianta).
- **Presnejsi model**: az bude k dispozici sada realnych fotek/videi
  ceskych semaforu, nahradit rucni HSV prahy natrenovanym klasifikatorem
  a pridat detekci pouzdra (ne jen izolovanych kruhu).
