# doublef35.github.io

Sito personale di Federico Fassio — Torino.
**Live:** https://doublef35.github.io/

Una pagina sola: `index.html` contiene HTML, CSS e JavaScript. Nessun framework,
nessun build step, nessuna dipendenza da installare. Per modificarlo apri il file
con un editor, salva, `git push`: GitHub Pages aggiorna il sito da solo in un minuto.

---

## Cosa manca (bozza v0.1)

Nel file, cerca `TODO`. Sono quattro cose:

| Cosa | Dove | Come |
|---|---|---|
| **Foto** | tre punti nel file | Metti i file in `img/`, cancella il blocco `<div class="plate…">` e togli il commento all'`<img>` che trovi lì accanto. Servono `img/ritratto.jpg` (verticale 4:5), `img/seeker-ii.jpg` e `img/edunity.jpg` (orizzontali 4:3). |
| **LinkedIn e Instagram** | sezione Contatti | Il markup è già pronto, commentato: incolla l'URL al posto di `INDIRIZZO` e togli i commenti. |
| **Nome della gara startup** | sezione Imprenditoria | Ora c'è scritto solo «Finale nazionale, 2026»: aggiungi il nome della competizione. |
| **`og:image`** | nel `<head>` | Quando hai una foto, aggiungila: è l'anteprima che compare quando mandi il link su WhatsApp o sui social. |

---

## Come aggiungere un progetto all'indice

Nella sezione **N.06 Indice**, copia un `<li>` e cambia cinque campi: data, nome,
descrizione, tipo, `href`. Nient'altro: l'impaginazione si adatta da sola, anche
da telefono.

Per una voce senza link (progetto privato) usa la variante con `<div class="row">`
invece di `<a>`.

---

## Impostazioni di stile

Tutti i colori e i font stanno nelle variabili CSS in cima al `<style>`, sotto
`:root`. Cambiando `--accent` cambia l'accento in tutta la pagina.

- **Display:** Instrument Serif — nome, titoli, nomi dei progetti
- **Testo:** Inter Tight
- **Etichette e dati:** IBM Plex Mono
- **Palette:** carta `#F3F1EC`, inchiostro `#14171A`, vermiglio `#B23A25`,
  banda scura `#111417`

La sezione *Ricerca* è su fondo scuro: i colori si invertono automaticamente
perché la classe `.sec--night` ridefinisce le stesse variabili.

Il sito rispetta `prefers-reduced-motion` (chi ha chiesto meno animazioni vede
tutto fermo) ed è pensato per il contrasto AA.

---

## Dominio personale (facoltativo, per dopo)

Se compri un dominio tipo `federicofassio.it`:

1. crea un file `CNAME` in questa cartella con dentro solo `federicofassio.it`
2. dal pannello del dominio, punta un record `A` agli IP di GitHub Pages
   (`185.199.108.153`, `.109.153`, `.110.153`, `.111.153`) e un `CNAME` per
   `www` a `doublef35.github.io`
3. in *Settings → Pages* attiva **Enforce HTTPS**

Ricordati poi di aggiornare `<link rel="canonical">` e `og:url` nel `<head>`.
