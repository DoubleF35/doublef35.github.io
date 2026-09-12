# Foto

Undici posti dove va una foto. Ogni segnaposto nel sito dice già il nome del
file che si aspetta, quindi non serve consultare questa tabella per capire
dov'è: basta guardare il riquadro tratteggiato.

| File | Formato | Dove | Cosa |
|---|---|---|---|
| `ritratto.jpg` | verticale 4:5 | Chi sono | Il tuo ritratto |
| `iceroute-premio.jpg` | 4:3 | IceRoute | Il team all'EO Makerspace Hackathon, o la premiazione |
| `iceroute-sistema.jpg` | 4:3 | IceRoute | Una slide del pitch, o il devkit ZCU104 |
| `cubesar.jpg` | 16:9 | CubeSAR | Il banco, l'antenna, o una prima immagine radar |
| `seeker-ii.jpg` | 16:9 | Programma Seeker | Il razzo assemblato, la rampa, o il render CAD |
| `edunity.jpg` | 16:9 | EdUnity | Schermata dell'app, o il team al Fin4Teen |
| `yet.jpg` | 16:9 | YET | Un incontro della community |
| `f4kit.jpg` | 16:9 | f4kit | Una schermata dell'output, o il PDF cronometrico |
| `space-eagle.jpg` | 4:3 | Percorso | Il team, o l'officina |
| `esa-hackathon.jpg` | 4:3 | Percorso | Frascati, ESA |
| `fin4teen.jpg` | 4:3 | Percorso | La premiazione SellaLab |

## Come si mette una foto

In `index.html` cerca il nome del file. Trovi un commento che spiega cosa
fare, ed è sempre lo stesso:

1. metti il file qui, con quel nome esatto;
2. cancella il `<span class="plate">…</span>`;
3. togli il commento all'`<img>` che sta subito sopra.

L'`<img>` ha già `width`, `height` e `loading` scritti, e il riquadro che lo
contiene ha `aspect-ratio` e `object-fit:cover`: sono lì per evitare che la
pagina salti mentre l'immagine carica.

## Formati

Esporta in JPEG qualità 80, larghezza massima 1400 px. Sopra i 300 KB per
immagine il sito comincia a rallentare da telefono.

Se una foto non rispetta le proporzioni indicate non si deforma: viene
ritagliata al centro da `object-fit:cover`. Ma se il soggetto è decentrato,
ritaglialo tu prima.

## og:image

Quando hai una foto buona, mettila anche come anteprima per WhatsApp e social:
in `index.html`, nel `<head>`, c'è un `TODO og:image`. Serve orizzontale,
1200×630.
