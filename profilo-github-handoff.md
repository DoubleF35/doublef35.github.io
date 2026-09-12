# Profilo GitHub DoubleF35 — stato

Contesto minimo (serve se leggi questo in una chat nuova):

- Account GitHub: **DoubleF35** (Federico Fassio), user id `256942734`
- Repo profilo: **`DoubleF35/DoubleF35`**, pubblico — clone locale in `~/Scrivania/DoubleF35`
- Repo collegato: **`DoubleF35/daily`** — un workflow che aggiunge una riga col la data
  al README ogni giorno; clone locale in `~/Scrivania/daily`

---

## Cosa c'è

Repo profilo `DoubleF35/DoubleF35`, pubblico, `main` con tre soli file
(README + due workflow) — tutto il resto sta su branch dedicati.

Header animato, typing SVG, tabella dei progetti in evidenza, badge stack ricavati
dalle dipendenze vere (`torch`, `onnxruntime`, `rasterio`, `streamlit` da IceRoute;
React+Vite da YET), card statistiche, serpente che si mangia i commit. Tutto in inglese.

**Due automazioni**, entrambe testate con run reali:

| workflow | quando | cosa fa |
|---|---|---|
| `snake` | 05:00 UTC | rigenera l'animazione in versione light **e** dark sul branch `output` |
| `profile-cards` | 05:30 UTC | rigenera le card SVG sul branch `profile-summary-cards-output` |

Verifica finale: **29 immagini su 29 caricate**, zero rotte, nessun testo italiano
residuo, code block che non sfora (831px richiesti su 831 disponibili).

## Cosa ho scartato della awesome list, e perché

Endpoint testati, non copiati:

- **`github-readme-stats`** -> `503 DEPLOYMENT_PAUSED`. L'istanza pubblica è sospesa.
- **`github-readme-activity-graph`** -> `402 Payment required`. Morta.
- **Trophies** (`ryo-ma/github-profile-trophy`) -> con 0 star e 0 follower assegna
  rank C/B: fa sembrare il profilo più debole di quanto sia.

Al posto dei primi due ci sono card **generate da una Action e committate nel repo**:
stessa filosofia del serpente, e se un servizio va giù il profilo non si rompe.

## Da fare (azione manuale)

Le card oggi lo dipingono come sviluppatore **HTML**:

| card | 1° | 2° | 3° |
|---|---|---|---|
| repos per language | HTML | Python | JavaScript |
| languages by commit | HTML | JavaScript | Python |

`GITHUB_TOKEN` vede solo i repo pubblici, che sono soprattutto siti. IceRoute
(~798 KB di Python), f4kit (~898 KB) ed eagle-launch-simulator sono privati e non
vengono contati. Il workflow è già predisposto con
`secrets.CARDS_TOKEN || secrets.GITHUB_TOKEN`, quindi appena c'è il secret Python
passa davanti **senza toccare nulla**:

1. https://github.com/settings/tokens -> *Generate new token (classic)* ->
   scope `repo` e `read:user`
2. Nel repo: *Settings -> Secrets and variables -> Actions -> New repository secret*,
   nome `CARDS_TOKEN`
3. Actions -> `profile-cards` -> *Run workflow*

## Note aperte

**Email non pubblicata** nel README: pubblicarla su un profilo pubblico è una
decisione da prendere, non un default.

**I commit dei bot non contano per la streak** — l'autore è `github-actions[bot]`,
non l'utente. Qui va bene: servono a generare immagini, non quadratini. Nel repo
`daily` invece era un bug, risolto il 5 settembre 2026 impostando
`git config user.email '256942734+DoubleF35@users.noreply.github.com'` nel workflow:
GitHub attribuisce i contributi in base all'email dell'autore, che deve essere
verificata sull'account. Da lì la streak è attiva.
