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

Quattro file, con questi nomi esatti — `index.html` cerca proprio questi:

    fonts/athelas.woff2
    fonts/athelas-italic.woff2
    fonts/athelas-bold.woff2
    fonts/vanguard.woff2

Non serve toccare `index.html`: gli `@font-face` sono già scritti in cima al
`<style>`, sezione 0.

### Il modo veloce

Scarica i kit dai fornitori e lancia:

    ./converti.sh ~/Scaricati/AthelasWeb/ ~/Scaricati/VanguardCF/

Lo script riconosce i file dal nome, converte in `.woff2` e li chiama come
serve. Riduce anche i font ai soli caratteri che il sito usa: un OTF completo
pesa 100–200 KB, ridotto sta sotto i 40. Con `--intero` salta la riduzione.

Serve solo `uv`, che è già installato; `fonttools` viene preso al volo senza
installare niente di permanente.

**Attenzione ai simboli.** Il subset tiene apposta ★ (flagship e premi), Φ
(ESA Φ-lab), · — → ↖ ≈ × ± € e le lettere accentate. Un subset "solo latino"
fatto a mano li cancellerebbe, e al loro posto comparirebbero dei rettangoli
vuoti proprio nei titoli.

### Se preferisci a mano

    uvx --from 'fonttools[woff]' fonttools ttLib.woff2 compress -o athelas.woff2 Athelas-Regular.otf

## Cosa si vede finché non ci sono

Il browser scende sui sostituti liberi, presi da Google Fonts, scelti perché
somigliano:

| Al posto di | Si usa | Perché |
|---|---|---|
| Athelas | **Spectral** | serif da lettura, stessa robustezza in corpo piccolo |
| Vanguard CF | **Bebas Neue** | condensato, solo maiuscole, stesso ingombro nei titoli |

Il sito è compiuto in entrambi i casi: non c'è nessun momento in cui sembra
rotto. Cambiano le proporzioni dei titoli, non l'impaginazione.

## Il repository è pubblico

I `.woff2` finiranno su GitHub e chiunque potrà scaricarli. Per un webfont è
normale — qualunque sito serve i propri font al browser, non c'è modo di
evitarlo — e quasi tutte le licenze web lo prevedono. Ma **controlla la tua**:
alcune vietano espressamente di mettere i file in un repository di codice
pubblico, e in quel caso serve un dominio con hosting separato.

Controlla anche se la licenza ha un limite di visualizzazioni mensili o è
legata a un dominio: `doublef35.github.io` oggi, `federicofassio.it` se compri
il dominio.

## Se decidi di non comprarli

Togli i quattro blocchi `@font-face` nella sezione 0 di `index.html` e leva
`'Athelas',` e `'Vanguard',` dalle due variabili `--sans` e `--display`. Restano
Spectral e Bebas Neue, che sono gratuiti e non hanno bisogno di licenza.
