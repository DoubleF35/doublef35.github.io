# doublef35.github.io

Sito personale di Federico Fassio — Torino.
**Live:** https://doublef35.github.io/

Nessun build step, niente da installare, niente da compilare: si modifica con un
editor, si salva, `git push`, e GitHub Pages aggiorna il sito in un minuto.

È una pagina sola, nello stesso linguaggio visivo del README del profilo
[github.com/DoubleF35](https://github.com/DoubleF35): banner con gradiente navy
verso blu e onda in movimento, JetBrains Mono per tutto ciò che è codice o
etichetta, badge piatti dello stack, schede con bordo. Chi arriva dal profilo
deve riconoscere lo stesso posto.

## Struttura dei file

| File | Cosa |
|---|---|
| `index.html` | Markup, CSS, script e tutti i contenuti nelle due lingue |
| `img/` | Le fotografie, con le istruzioni in [img/README.md](img/README.md) |
| `robots.txt`, `.nojekyll` | Indicizzazione e niente pipeline Jekyll |

Tutto in un file solo: CSS e JavaScript sono poche centinaia di righe in tutto,
e un file unico è la sola struttura che non si può sbagliare a distribuire.

## Le sezioni

    Banner          nome, sottotitolo, riga che si scrive da sola
    Hey             chi sono, ritratto, la bio come dizionario Python
    Progetti        IceRoute (a tutta larghezza) + CubeSAR, Seeker,
                    EdUnity, YET, f4kit, e tre repo secondari
    Stack           badge divisi per famiglia
    Percorso        esperienza e formazione, in ordine di data
    Serpente        l'animazione dei commit, dal repo del profilo
    Contatti        email, social, riferimenti

### Aggiungere un progetto

Una `<article class="card">` dentro `.grid`, copiata da una esistente. Serve:
la sigla nel `.ico` (due o tre caratteri in monospazio, non emoji), il titolo,
i due paragrafi `data-l`, e i link nel `.foot`. Se ha una foto, la `<figure
class="shot shot--169">` va per prima, subito dentro la scheda.

---

## Lingua

Italiano e inglese convivono nel documento; il toggle nella barra riscrive solo
`html[data-lang]` e salva la scelta in `localStorage`. Ogni blocco esiste due
volte, con `data-l="it"` e `data-l="en"`.

La regola CSS **nasconde solo la lingua inattiva** e non ne mostra mai nessuna:

```css
html[data-lang="it"] [data-l="en"],
html[data-lang="en"] [data-l="it"]{display:none}
```

Così l'elemento attivo conserva il display del suo componente. Il primo
tentativo faceva il contrario — `display:none` su tutto e una regola di
ripristino per tipo — e si rompeva sui `.tag`, che sono `inline-flex`.
**Non tornare indietro.**

Nel markup `<html>` ha `data-lang="en"`: l'inglese è quello che si legge senza
JavaScript, ed è la lingua del README del profilo. Per invertire il default
basta cambiare quell'attributo e il `lang` accanto.

Uno script minuscolo nel `<head>` rilegge `localStorage` **prima** del disegno:
senza, chi ha scelto l'italiano vedrebbe un lampo di inglese a ogni caricamento.

---

## Caratteri e colori

Inter per il testo, JetBrains Mono per codice ed etichette, entrambi da Google
Fonts con una catena di riserve di sistema: se il CDN non risponde la pagina
resta leggibile, non bianca.

Tutti i colori stanno nelle variabili in cima allo `<style>`. I tre stop del
banner sono gli stessi del `capsule-render` nel README del profilo:

| Ruolo | Valore |
|---|---|
| Navy, inizio gradiente | `#0b1d3a` |
| Blu medio | `#14508c` |
| Blu accento | `#1f6feb` |
| Azzurro dei link | `#58a6ff` |
| Oro dei premi | `#e3b341` |

Il sito è **solo scuro**. Non c'è un tema chiaro: il gradiente del banner e i
segnaposto delle foto sono costruiti su un fondo scuro, e una seconda palette
sarebbe una seconda cosa da tenere allineata a ogni modifica.

## Le onde

Due `<svg>` sovrapposti, larghi il doppio del contenitore, con lo stesso
tracciato disegnato due volte a distanza di un periodo. L'animazione li fa
scorrere di `-50%`: a fine ciclo la seconda copia è esattamente dove stava la
prima, quindi il giro non si vede.

Il tracciato è periodico per costruzione — stessa `y` e stessa pendenza a
`x=0` e `x=1440` — ed è l'unica cosa che rende il ciclo invisibile. Se lo
modifichi, mantieni quella proprietà.

## Accessibilità

- Ogni testo esiste in entrambe le lingue nel DOM: senza JavaScript si legge
  l'inglese, e il sito non è mai una pagina bianca.
- Le sigle nelle schede (`SAR`, `SK`, `Ed`) sono `aria-hidden`: sono decorative,
  il nome del progetto è scritto accanto.
- `prefers-reduced-motion`: le onde si fermano, il cursore smette di lampeggiare
  e la riga che si scrive resta ferma sulla prima frase.
- Barra stretta: sotto i 620 px il tasto GitHub esce, perché lo stesso link è
  ripetuto due righe più in basso.

---

## Cosa manca

| Cosa | Dove |
|---|---|
| **Le 11 foto** | Riquadri tratteggiati nel sito, ognuno col nome del file. Vedi [img/README.md](img/README.md) |
| **`og:image`** | Nel `<head>`, `TODO og:image`. Serve orizzontale, 1200×630 |

Niente riempitivi al posto dei dati mancanti: un buco dichiarato si legge come
una scelta, un segnaposto finto sembra un errore.

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

    python3 -m http.server 8099

e apri <http://localhost:8099>. Serve un server vero, non `file://`: i font e
`localStorage` si comportano diversamente.
