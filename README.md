# Semafor asistent — PoC rozpoznavani barvy

Puvodni napad: krabicka s kamerou + BT/WiFi vysilacem, napajena z USB/12V
zasuvky v aute, co sedi na palubce starsiho auta (bez zabudovaneho
asistenta), rozpoznava barvu semaforu pred autem a hlasi ji (na displeji
telefonu nebo hlasem), aby ridic nemusel porad civet nahoru a cekat na
zmenu.

Tenhle repozitar je **jen software prototyp jadra** teto myslenky — algoritmu,
ktery z obrazu pozna, jestli sviti cervena, oranzova nebo zelena. Zadny
hardware (kamera, mikrokontroler, BT/WiFi modul) zatim nikde neni, viz
"Dalsi kroky" nize.

## Co to umi

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

## Jak algoritmus funguje

1. Prevod snimku do HSV a rozostreni pro potlaceni sumu.
2. Houghova transformace najde kruhove oblasti v obraze (kandidati na
   svitilny semaforu — cerne pouzdro s kruhovymi otvory).
3. Pro kazdy kruh se spocita, jaky podil jeho plochy padne do HSV rozsahu
   cervene / oranzove / zelene.
4. Kruh, kde tenhle podil prekroci prah (`MIN_FILL_RATIO`, aktualne 35 %),
   a je nejvyssi ze vsech kandidatu, se vyhlasi jako "sviti tahle barva".
   Nesviticí svitilny maji nizkou sytost/jas, takze do zadneho barevneho
   rozsahu nespadnou a detektor je ignoruje.

## Znama omezeni (tohle je PoC, ne hotove reseni)

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
