# federicofassio.it

Sito statico, nessun framework e nessun build step. GitHub Pages pubblica
il branch `main` sul dominio scritto in `CNAME`.

- `index.html`: la homepage (hero, About, elenco dei progetti, timeline,
  stack, contatti).
- Una cartella per progetto, con dentro `index.html`: `iceroute/`,
  `cubesar/`, `yet/`, `tobe/`, `seeker/`, `edunity/`, `f4kit/`. Gli
  indirizzi sono `federicofassio.it/seeker/` e così via.
- `assets/site.css` e `assets/site.js`: stile e script comuni a tutte le
  pagine. Ogni script controlla da solo se nella pagina c'è il suo pezzo
  (l'hero, la timeline, i divisori), quindi si include sempre lo stesso file.

## Progetti

In homepage ogni progetto è una voce di `ul.plist`: miniatura, ruolo,
nome, una riga di descrizione, l'eventuale piazzamento e il link alla sua
pagina. Tutto il resto (testo completo, foto, dati tecnici, link) sta
nella pagina del progetto.

**Una pagina di progetto** ha la barra già piena, il link "Tutti i
progetti", il progetto nello stesso impaginato della homepage di prima
(`article.row`, o `article.flag` per IceRoute) con il nome in `<h1>`, una
galleria facoltativa (`div.gal` con `.photos.photos--fit`) e in fondo il
progetto precedente e quello successivo. Nella pagina le immagini stanno
in `../img/` e i link alla homepage sono `../#about`, `../#projects`...

**Aggiungere un progetto**: copia la cartella di uno simile, cambia nel
`<head>` titolo (`<title>` e `data-title-en` / `data-title-it` su
`<html>`), descrizione, `canonical`, `og:` e `twitter:`, poi il contenuto.
Aggiungi la voce in `ul.plist` della homepage, aggiorna "precedente /
successivo" nelle due pagine vicine e aggiungi l'indirizzo a
`sitemap.xml`.

## Lingue

Ogni testo esiste due volte, con `data-l="en"` e `data-l="it"`. L'inglese
è la lingua di default; la scelta del visitatore resta salvata nel suo
browser. Per cambiare un testo vanno cambiate tutte e due le versioni.

I testi alternativi delle immagini: inglese in `alt`, italiano in
`data-alt-it`. Lo script li scambia insieme alla lingua.

## Foto

Stanno tutte in `img/`. Ogni `<img>` dichiara `width` e `height` con le
dimensioni vere del file: servono al browser per riservare lo spazio
prima che la foto arrivi, così la pagina non salta.

**Sostituire una foto con lo stesso nome**: se le proporzioni restano
uguali non serve toccare niente. Se cambiano, aggiorna `width` e `height`.

**Il ritratto** in About è `img/ritratto.jpeg`, mostrato quadrato e
centrato in alto sul viso. Va bene qualsiasi proporzione: viene ritagliato.

**CubeSAR (`cubesar/`) ha tre foto del 2U in un mosaico**: `cubesar-2u.jpg`
(la demo da banco, verticale 3:4) a sinistra, `cubesar-2u-cad.jpg` (il
render del 2U, 4:3) e `cubesar-banco.jpg` (la demo in montaggio, 4:3)
impilati a destra. Le colonne stanno a 1,13 : 1 (regola `.mosaic` nel CSS)
perché le due altezze coincidano. Se cambi una di queste foto con una di
proporzioni diverse, quel rapporto va ricalcolato. Sotto il mosaico c'è
il CAD del 6U, `cubesar.png`, in una figura a sé (`.fig-next`). In fondo
alla pagina c'è una galleria con la foto verticale 2:3 del 2U,
`cubesar-2u-foto.jpg` (regola `.photos--tall`: su telefono a tutta
larghezza).

**Seeker (`seeker/`) ha quattro foto in una griglia 2×2** (regola `.quad`): sopra
`seeker-one.jpg` e `seeker-one-recupero.jpg`, tutte e due verticali 3:4;
sotto `primo-razzo-2024.jpg` e `seeker-ii-scrivania.jpg`, tutte e due
orizzontali 4:3. Le altezze coincidono perché ogni riga ha foto delle
stesse proporzioni: una foto nuova va ritagliata come quella che
sostituisce. Sotto la riga c'è una striscia su Seeker-II (regola
`.row__strip`, attiva con `class="row row--strip"`): lo screenshot di
OpenRocket a tutta larghezza, poi Fusion 360 e le due immagini della
simulazione CFD, tutte e tre 4:3.

**CubeSAR ha anche un video** (`img/cubesar-montaggio.mp4`, 16 s, 960×720,
H.264 senza audio, con la copertina `img/cubesar-montaggio.jpg`), nel testo
della pagina dentro `figure.vid`. È muto, parte da solo e si ripete
(`autoplay muted loop playsinline`); gira solo quando è in vista, un tocco
lo ferma, e con "riduci movimento" resta fermo con i comandi. Un video
nuovo va compresso così:
`ffmpeg -i originale.mov -an -vf "scale=960:-2,format=yuv420p" -c:v libx264 -preset slow -crf 26 -movflags +faststart nuovo.mp4`.

**Anche IceRoute ha un video**, al posto della foto grande della console
(`img/iceroute-console.mp4`, 21 s, 1280×748, copertina
`img/iceroute-console-poster.jpg`). È la registrazione dello schermo
ritagliata sulla sola console (`crop=1532:896:376:144` sull'originale
1920×1080), compressa con `-crf 23 -tune stillimage` perché il testo
resti leggibile. Funziona come quello di CubeSAR. La foto
`img/iceroute-console.jpg` resta per la miniatura in homepage e per
l'anteprima del link. Se cambi il video con uno di proporzioni diverse,
aggiorna `aspect-ratio` in `.flag__main .frame`.

**f4kit non ha ancora una foto.** Al suo posto c'è la formula
dell'invariante. In `f4kit/index.html` un commento dice quale blocco
sostituire con una `<figure class="row__fig">` come quella degli altri
progetti; in homepage la miniatura è il riquadro `.pitem__eq`.

Esporta in JPEG qualità 80, lato lungo massimo 1600 px, sotto i 300 KB
quando possibile.

## Età e timeline

L'età attuale compare nell'hero e in About dentro `<span class="age-now">`.
Uno script in `assets/site.js` la ricalcola da mese e anno di nascita
(novembre 2009), così nel sorgente non c'è la data completa: dal 1º
dicembre di ogni anno sale di uno.

Le età accanto alle tappe della timeline (`#path`, `ol.tl`) sono invece
scritte a mano, perché sono l'età che avevi in quel momento. Le prime due
tappe (Space Eagle e YET, `class="is-key"`) restano sempre in cima; le
altre seguono dalla più recente. Una tappa nuova va quindi subito dopo YET
se è la più recente: copia un `<li>` senza `is-key`, cambia date, età e
testi in tutte e due le lingue. `class="is-now"` per le cose ancora in
corso (punto pieno), con l'età scritta "from age N" / "dai N anni". Il
numero in oro (`.ord`) solo per i piazzamenti.

## Il pettine

L'hero è un `<canvas>` disegnato da `assets/site.js`. Le
costanti all'inizio dello script (passo delle barre, durata dell'intro,
luminosità delle fessure) sono commentate. Il disegno si ferma quando
niente si muove, e con "riduci movimento" attivo resta un fotogramma
fermo.

## Anteprima dei link

Quando mandi il link (WhatsApp, iMessage, Telegram, LinkedIn, X) si vede
`img/cover.jpg`: l'hero del sito a 1200×630, con il titolo grande, nome e
ruoli. Titolo e descrizione dell'anteprima sono `og:title` /
`og:description` (e i `twitter:` gemelli) nel `<head>`; sono in inglese
come la lingua di default. Ogni pagina di progetto ha la sua anteprima:
la foto principale del progetto e il suo titolo.

Se cambiano i ruoli, aggiorna la riga in `tools/og-cover.js` e rigenera
la copertina con `node tools/og-cover.js` (`it` per la versione
italiana). WhatsApp tiene in memoria le anteprime per un po': per vedere
subito quella nuova, manda `federicofassio.it/?v=2`.
