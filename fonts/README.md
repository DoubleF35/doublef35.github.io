# Caratteri

Il sito chiede due caratteri commerciali, che **non possono stare su un CDN
pubblico** e quindi vanno ospitati qui.

| Carattere | Chi lo fa | Dove si compra |
|---|---|---|
| **Athelas** | TypeTogether | type-together.com — serve la licenza *webfont* |
| **Vanguard CF** | Connary Fagen | connary.com — serve la licenza *web* |

Athelas è preinstallato su macOS e iOS, ma **quella copia non è licenziata per
il web**: non si può copiare da `/Library/Fonts` e pubblicare. Va comprata.

## Cosa mettere qui

Converti i file in `.woff2` (con [fonttools](https://github.com/fonttools/fonttools)
o woff2_compress) e chiamali esattamente così — `index.html` li cerca con
questi nomi:

    fonts/athelas.woff2
    fonts/athelas-italic.woff2
    fonts/athelas-bold.woff2
    fonts/vanguard.woff2

Non serve toccare `index.html`: gli `@font-face` sono già scritti in cima al
`<style>`, sezione 0.

## Cosa si vede finché non ci sono

Il browser scende sui sostituti liberi, presi da Google Fonts, scelti perché
somigliano:

| Al posto di | Si usa | Perché |
|---|---|---|
| Athelas | **Spectral** | serif da lettura, stessa robustezza in corpo piccolo |
| Vanguard CF | **Bebas Neue** | condensato, solo maiuscole, stesso ingombro nei titoli |

Il sito è compiuto in entrambi i casi: non c'è nessun momento in cui sembra
rotto. Cambiano le proporzioni dei titoli, non l'impaginazione.

## Se decidi di non comprarli

Togli i quattro blocchi `@font-face` nella sezione 0 di `index.html` e leva
`'Athelas',` e `'Vanguard',` dalle due variabili `--sans` e `--display`. Restano
Spectral e Bebas Neue, che sono gratuiti e non hanno bisogno di licenza.
