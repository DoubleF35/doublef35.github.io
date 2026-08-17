# Foto

Tredici posti dove va una foto. Ogni segnaposto nel sito dice già il nome del
file che si aspetta, quindi non serve consultare questa tabella per capire
dov'è: basta guardare il riquadro grigio.

| File | Formato | Dove | Cosa |
|---|---|---|---|
| `ritratto.jpg` | verticale 4:5 | Centro | Il tuo ritratto |
| `iceroute-premio.jpg` | 4:3 | IceRoute | Il team all'EO Makerspace Hackathon, o la premiazione |
| `iceroute-sistema.jpg` | 4:3 | IceRoute | Una slide del pitch, o il devkit ZCU104 |
| `seeker-programma.jpg` | 16:9 | Programma Seeker | I due razzi affiancati, o la rampa |
| `seeker-one.jpg` | 4:3 | Seeker-One | Il primo vettore |
| `seeker-ii.jpg` | 4:3 | Seeker-II | Il razzo assemblato, o il render CAD |
| `seeker-ii-avionica.jpg` | 4:3 | Seeker-II | La scheda di bordo, o i dati di volo a schermo |
| `edunity.jpg` | 4:3 | EdUnity | Schermata dell'app |
| `edunity-fin4teen.jpg` | 4:3 | EdUnity | Il team al Fin4Teen |
| `yet.jpg` | 16:9 | YET | Un incontro della community |
| `space-eagle.jpg` | 4:3 | Percorso | Il team, o l'officina |
| `esa-hackathon.jpg` | 4:3 | Percorso | Frascati, ESA |
| `fin4teen.jpg` | 4:3 | Percorso | La premiazione SellaLab |

## Come si mette una foto

In `index.html` cerca il nome del file. Trovi tre righe di commento che
spiegano cosa fare, e sono sempre le stesse tre:

1. metti il file qui, con quel nome esatto;
2. cancella il `<div class="plate…">…</div>`;
3. togli il commento all'`<img>` che sta subito sopra.

L'`<img>` ha già `width`, `height`, `aspect-ratio` e `object-fit:cover`
scritti: sono lì per evitare che la pagina salti mentre l'immagine carica.

## Formati

Esporta in JPEG qualità 80, larghezza massima 1400 px. Sopra i 300 KB per
immagine il sito comincia a rallentare da telefono, e la mappa radar gira già
a 60 fotogrammi al secondo: è il posto sbagliato dove sprecare banda.

Se una foto non rispetta le proporzioni indicate non si deforma — viene
ritagliata al centro da `object-fit:cover`. Ma se il soggetto è decentrato,
ritaglialo tu prima.

## og:image

Quando hai una foto buona, mettila anche come anteprima per WhatsApp e social:
in `index.html`, nel `<head>`, c'è un `<!-- TODO og:image -->`. Serve
orizzontale, 1200×630.
