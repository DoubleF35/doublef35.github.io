# federicofassio.it

Una pagina sola, `index.html`: HTML, CSS e JavaScript nello stesso file,
nessun framework e nessun build step. GitHub Pages pubblica il branch
`main` sul dominio scritto in `CNAME`.

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

**f4kit non ha ancora una foto.** Al suo posto c'è la formula
dell'invariante. In `index.html`, cerca `f4kit`: un commento dice quale
blocco sostituire con una `<figure class="row__fig">` come quella degli
altri progetti.

Esporta in JPEG qualità 80, lato lungo massimo 1600 px, sotto i 300 KB
quando possibile.

## Il pettine

L'hero è un `<canvas>` disegnato dallo script in fondo alla pagina. Le
costanti all'inizio dello script (passo delle barre, durata dell'intro,
luminosità delle fessure) sono commentate. Il disegno si ferma quando
niente si muove, e con "riduci movimento" attivo resta un fotogramma
fermo.

## Anteprima per i social

`og:image` nel `<head>` punta a `img/teenventures-iceroute.jpg`. Per
cambiarla serve una foto orizzontale, idealmente 1200×630.
