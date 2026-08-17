# doublef35.github.io

Sito personale di Federico Fassio — Torino.
**Live:** https://doublef35.github.io/

Una pagina sola: `index.html` contiene HTML, CSS e JavaScript. Nessun
framework, nessun build step, nessuna dipendenza da installare. Si modifica con
un editor, si salva, `git push`: GitHub Pages aggiorna il sito da solo in un
minuto.

Non è un portfolio a scorrimento: è una **mappa radar interattiva**. A sinistra
un grafo su canvas con una spazzata che gira e accende i nodi al passaggio; a
destra il pannello che cambia senza ricaricare la pagina.

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

### Aggiungere un progetto

Due cose, e nient'altro:

1. una foglia nell'albero `TREE`, in cima allo `<script>`;
2. una `<section class="view" id="v-NOME">` nel `<main>`.

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

- Il canvas è `aria-hidden`: ogni nodo cliccabile esiste anche come link nella
  barra e nelle schede, quindi non si naviga la stessa cosa due volte.
- Senza JavaScript le viste si mostrano tutte una sotto l'altra, in italiano.
  Un portfolio non deve essere una pagina bianca per chi ha lo script bloccato.
- `prefers-reduced-motion`: la spazzata si ferma e i nodi non si riaggregano,
  saltano direttamente in posizione.

---

## Cosa manca

| Cosa | Dove |
|---|---|
| **Le 13 foto** | Riquadri grigi nel sito, ognuno col nome del file. Vedi [img/README.md](img/README.md) |
| **Scheda di Seeker-One** | Massa, motore, apogeo simulato e misurato: nel sito è tutto `—`, e c'è un commento che lo dice |
| **LinkedIn e Instagram** | Sezione Contatti, c'è un `TODO SOCIAL` |
| **`og:image`** | Nel `<head>`, `TODO og:image` |
| **Athelas e Vanguard** | `fonts/`, se decidi di comprarli |

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
