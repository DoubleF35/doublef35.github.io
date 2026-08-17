# doublef35.github.io

Sito personale di Federico Fassio — Torino.
**Live:** https://doublef35.github.io/

Nessun build step, niente da installare, niente da compilare: si modifica con un
editor, si salva, `git push`, e GitHub Pages aggiorna il sito in un minuto.

Non è un portfolio a scorrimento: è una **mappa radar tridimensionale**. A
sinistra una scena WebGL che si può ruotare col trascinamento e avvicinare con
la rotella, con una spazzata che gira e accende i nodi al passaggio; a destra il
pannello che cambia senza ricaricare la pagina.

## Struttura dei file

| File | Cosa |
|---|---|
| `index.html` | Markup, CSS e tutti i contenuti nelle due lingue |
| `map.js` | La mappa 3D: modello del grafo, scena, controlli, rotte |
| `vendor/three.module.min.js` | three.js r165, MIT — l'unica dipendenza |
| `fonts/`, `img/` | Caratteri e fotografie, con le rispettive istruzioni |

three.js sta **nel repository e non su un CDN**: il sito deve continuare a
funzionare anche se un CDN cade o cambia politica. Costa 664 KB nel repo, che
viaggiano compressi a circa 170 KB e vengono messi in cache dal browser al
primo caricamento.

Finché la mappa era su canvas 2D il sito stava in un file solo. Con three.js
quella proprietà era già persa, quindi la mappa è passata in `map.js` invece di
gonfiare `index.html` a 2700 righe.

---

## La mappa

    FEDERICO
    ├─ ORBITA      IceRoute ★ ──╌╌╌ CubeSAR
    ├─ VOLO        SEEKER ─┬─ Seeker-One
    │                      └─ Seeker-II
    ├─ IMPRESA     EdUnity · YET
    └─ DATI        f4kit

    ★  flagship, sezione a tutta larghezza
    ╌  legame trasversale: stesso principio a due scale, non gerarchia

Fuori dal radar, raggiungibili dalla barra: **Percorso** (esperienza e
formazione) e **Contatti**. Un curriculum è una sequenza di date, e una mappa
radiale non sa rappresentare il tempo.

Nell'area **Volo** parte un razzo dal nodo e sale girando; nell'area **Orbita**
un satellite gira attorno al nodo su un'orbita inclinata. Sono costruiti con
primitive di three.js, non caricati da un file: un GLTF vorrebbe l'addon
`GLTFLoader`, una importmap e un asset da scaricare, per due oggetti che sono
un cilindro con un cono sopra e una scatola con due ali.

### Aggiungere un progetto

Due cose, e nient'altro:

1. una foglia nell'albero `TREE`, in cima a `map.js`;
2. una `<section class="view" id="v-NOME">` nel `<main>` di `index.html`.

Le rotte, la pill, il conteggio nella legenda e la minimappa si aggiornano da
soli: sono derivati dall'albero. La profondità non è fissa — se un nodo ha
figli diventa un "programma" e prende l'anello, come SEEKER.

---

## Lingua

Italiano e inglese convivono nel documento; il toggle riscrive solo
`html[data-lang]`. Ogni blocco esiste due volte, con `data-l="it"` e
`data-l="en"`.

La regola CSS **nasconde solo la lingua inattiva** e non ne mostra mai nessuna:

```css
html[data-lang="it"] [data-l="en"],
html[data-lang="en"] [data-l="it"]{display:none}
```

Così l'elemento attivo conserva il display del suo componente. Il primo
tentativo faceva il contrario — `display:none` su tutto e una regola di
ripristino per tipo — e si rompeva in due modi: `.tag{display:inline-flex}` è
dichiarato più in basso con la stessa specificità e vinceva il pareggio, e dove
funzionava appiattiva `inline-flex` a `inline`. **Non tornare indietro.**

L'italiano è quello scritto nel markup, quindi si legge anche senza
JavaScript.

---

## Caratteri

| Ruolo | Voluto | Sostituto libero attivo |
|---|---|---|
| Titoli grandi, maiuscolo | Vanguard CF | Bebas Neue |
| Testo corrente, minuscolo | Athelas | Spectral |
| Micro-etichette | Archivo | Archivo |

Vanguard e Athelas sono commerciali e non stanno su nessun CDN: vanno comprati
e messi in `fonts/`. Vedi [fonts/README.md](fonts/README.md). Finché non ci
sono, il sito usa i sostituti e non sembra rotto in nessun momento.

Le micro-etichette restano in Archivo anche a font comprati: sono maiuscole ma
piccole, e un condensato a quel corpo si impasta.

---

## Colori

Tutto sta nelle variabili in cima allo `<style>`. `--acc` viene riscritto da
`html[data-area=…]`: un solo colore-chiave ricolora titolo, pallini, bordi e
bagliori dell'area attiva.

| Area | Accento |
|---|---|
| Centro | `#9B8FFF` viola |
| Orbita | `#5BE9FF` ciano ghiaccio |
| Volo | `#FF6A3D` arancio |
| Impresa | `#E84FD0` magenta |
| Dati | `#CFFF04` lime |

**Il canvas non legge le variabili CSS.** Gli stessi valori sono duplicati
nell'oggetto `ACC` dentro lo script: se cambi un accento, cambialo in entrambi
i posti.

Tema chiaro e scuro: il chiaro è carta `#EFE7D4`, e alla prima visita il tema
segue le preferenze di sistema. Poi resta quello scelto (`localStorage`).

---

## Accessibilità

- La scena è `aria-hidden`: ogni nodo cliccabile esiste anche come link nella
  barra e nelle schede, quindi non si naviga la stessa cosa due volte.
- Senza JavaScript le viste si mostrano tutte una sotto l'altra, in italiano.
  Un portfolio non deve essere una pagina bianca per chi ha lo script bloccato.
- **Senza WebGL** la mappa sparisce e il pannello prende tutta la larghezza:
  `map.js` intercetta l'errore e mette `no-gl` sull'`<html>`. Il contenuto è
  tutto nel DOM, quindi non si perde niente.
- `prefers-reduced-motion`: la spazzata si ferma, il razzo e il satellite
  restano immobili e i nodi saltano in posizione invece di riaggregarsi.
- Su schermo stretto restano solo le etichette dei nodi apribili: tredici
  etichette a corpo fisso dentro una fascia di 38vh si accavallano. I progetti
  si toccano lo stesso e sono elencati nel pannello.

---

## Cosa manca

| Cosa | Dove |
|---|---|
| **Le 13 foto** | Riquadri grigi nel sito, ognuno col nome del file. Vedi [img/README.md](img/README.md) |
| **Scheda di Seeker-One** | La pagina dice «scheda tecnica in arrivo». Quando hai massa, motore e apogeo simulato/misurato, copia la `<dl class="spec">` da `#v-seeker2` e riempila — poi togli il badge `.award--soon` |
| **`og:image`** | Nel `<head>`, `TODO og:image` |
| **Athelas e Vanguard** | `fonts/`, se decidi di comprarli |

Niente tabelle di trattini al posto dei dati mancanti: un buco dichiarato si
legge come una scelta, una riga di `—` sembra un errore.

---

## Dominio personale (facoltativo)

Se compri `federicofassio.it`:

1. crea un file `CNAME` in questa cartella con dentro solo `federicofassio.it`;
2. dal pannello del dominio punta un record `A` agli IP di GitHub Pages
   (`185.199.108.153`, `.109.153`, `.110.153`, `.111.153`) e un `CNAME` per
   `www` a `doublef35.github.io`;
3. in *Settings → Pages* attiva **Enforce HTTPS**.

Poi aggiorna `<link rel="canonical">` e `og:url` nel `<head>`.

---

## Sviluppo in locale

    python3 -m http.server 8123

e apri <http://localhost:8123>. Serve un server vero, non `file://`: i moduli
del canvas e i font si comportano diversamente.
