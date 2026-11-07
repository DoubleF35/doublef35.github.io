# federicofassio.it

Sito statico, nessun framework e nessun build step. GitHub Pages pubblica
il branch `main` sul dominio scritto in `CNAME`.

- `index.html`: la homepage (hero, About, elenco dei progetti, timeline,
  stack, contatti).
- Una cartella per progetto, con dentro `index.html`: `iceroute/`,
  `cubesar/`, `yet-community/`, `tobe/`, `seeker/`, `edunity/`.
  Gli indirizzi sono `federicofassio.it/seeker/` e così via.
- `assets/site.css` e `assets/site.js`: stile e script comuni a tutte le
  pagine. Ogni script controlla da solo se nella pagina c'è il suo pezzo
  (l'hero, la timeline, i divisori), quindi si include sempre lo stesso file.
- Le pagine li includono con un numero di versione (`site.css?v=9`,
  `site.js?v=9`). **Ogni volta che cambi `site.css` o `site.js`, alza quel
  numero in tutte le pagine** (cerca `?v=`): i browser, Safari sul
  telefono in particolare, tengono in memoria il file vecchio fino a
  10 minuti, e una pagina nuova con lo stile vecchio si vede rotta.

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

**Il nome della cartella non può essere quello di un tuo repo che ha
GitHub Pages attivo.** GitHub dà l'indirizzo `federicofassio.it/<repo>/`
al sito di quel repo, non alla cartella di questo. Per questo YET sta in
`yet-community/`: il repo `yet` pubblica il sito di YET, e
`federicofassio.it/yet/` porta lì.

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
centrato in alto sul viso; su telefono è a tutta larghezza e in
verticale 4:5. Va bene qualsiasi proporzione: viene ritagliato.

**CubeSAR (`cubesar/`) ha tre foto del 2U in un mosaico**: `cubesar-2u.jpg`
(la demo da banco, verticale 3:4) a sinistra, `cubesar-2u-cad.jpg` (il
render del 2U, 4:3) e `cubesar-banco.jpg` (la demo in montaggio, 4:3)
impilati a destra. Le colonne stanno a 1,13 : 1 (regola `.mosaic` nel CSS)
perché le due altezze coincidano. Se cambi una di queste foto con una di
proporzioni diverse, quel rapporto va ricalcolato. Sotto il mosaico c'è
il CAD del 6U, `cubesar.png`, in una figura a sé (`.fig-next`). In fondo
alla pagina c'è una galleria con il poster verticale 2:3 del 2U,
`cubesar-2u-poster.jpg` (regola `.photos--tall`: su telefono a tutta
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
(`autoplay muted loop playsinline`): parte appena si apre la pagina, anche
se è più in basso, e va sempre avanti; un tocco lo ferma, e con "riduci
movimento" resta fermo con i comandi. Se il telefono non lo fa partire
(un iPhone con Risparmio energetico attivo lo blocca sempre, a volte
senza dare errore: dopo 1,5 s fermo si considera bloccato) il video viene
sostituito subito dalla sua versione
animata in AVIF, indicata in `data-anim` (`img/cubesar-montaggio.avif`,
`img/iceroute-console.avif`, `img/yet-serata.avif`): le immagini animate
si muovono anche in Risparmio energetico. Se il browser non mostra
l'AVIF, compare il tasto play e il video parte al primo tocco. Per un
video nuovo crea anche l'AVIF:
`ffmpeg -i nuovo.mp4 -an -vf "fps=24,format=yuv420p" -c:v libsvtav1 -crf 40 -preset 6 -g 48 -loop 0 nuovo.avif`. Un video
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

**YET (`yet-community/`) ha una fila in cima alla galleria** (`div.jrow`):
i quattro fondatori (`yet-fondatori.jpg`), la serata del 13 settembre 2026
(`yet-13-settembre.jpg`), tutte e due 3:2 (`class="r-32"`), e un video
verticale 9:16 (`yet-serata.mp4`, 14 s, 576×1024, senza audio, copertina
`yet-serata.jpg`, `class="r-916"`) che parte da solo come gli altri. Ogni
figura prende larghezza in proporzione al suo formato, così sono tutte
alte uguali; su telefono vanno una sotto l'altra.

**To.Be ha un video di YouTube** dentro la pagina, in cima alla galleria
(`figure.yt`, riquadro 16:9). È un `<iframe>` da `youtube-nocookie.com`,
che non lascia cookie finché non si preme play, e si carica solo quando
arriva vicino allo schermo (`loading="lazy"`). Per cambiarlo basta
sostituire l'ID nell'indirizzo (`/embed/R6ej7PeYbj8`) con quello del
video nuovo: è la parte dopo `youtu.be/` nel link di condivisione.

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
