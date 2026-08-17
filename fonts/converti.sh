#!/usr/bin/env bash
#
# Converte i font comprati nei .woff2 con i nomi esatti che index.html cerca.
#
#   ./converti.sh ~/Scaricati/AthelasWeb/*.otf ~/Scaricati/VanguardCF/*.otf
#   ./converti.sh ~/Scaricati/kit-font/          # anche una cartella intera
#
# Riconosce i file dal nome: "athelas" + "italic" -> athelas-italic.woff2,
# "athelas" + "bold|semibold|demi" -> athelas-bold.woff2, "athelas" da solo ->
# athelas.woff2, "vanguard" -> vanguard.woff2. Se il fornitore usa altri nomi,
# rinomina i sorgenti o passali uno per uno.
#
# Di default riduce i font ai soli caratteri che il sito usa davvero: un OTF
# completo pesa 100-200 KB, ridotto sta sotto i 40. Con --intero salta questo
# passaggio.
#
# Serve solo uv, che c'e' gia'. fonttools viene preso al volo, non installato.

set -euo pipefail
cd "$(dirname "$0")"

SUBSET=1
SORGENTI=()
for a in "$@"; do
  case "$a" in
    --intero|--full) SUBSET=0 ;;
    -h|--help) sed -n '2,20p' "$0" | sed 's/^# \?//'; exit 0 ;;
    *) SORGENTI+=("$a") ;;
  esac
done

if [ ${#SORGENTI[@]} -eq 0 ]; then
  echo "Serve almeno un file o una cartella. Prova: $0 --help" >&2
  exit 1
fi

# Espande le cartelle nei font che contengono.
FILE=()
for s in "${SORGENTI[@]}"; do
  if [ -d "$s" ]; then
    while IFS= read -r f; do FILE+=("$f"); done < <(
      find "$s" -type f \( -iname '*.otf' -o -iname '*.ttf' -o -iname '*.woff2' -o -iname '*.woff' \) | sort)
  elif [ -f "$s" ]; then
    FILE+=("$s")
  else
    echo "Non trovo: $s" >&2; exit 1
  fi
done

# I caratteri che il sito usa. Latin-1 e Latin Extended-A coprono italiano e
# inglese; il resto sono i segni che compaiono davvero nel testo e che un
# subset ingenuo cancellerebbe, lasciando dei rettangoli vuoti:
#   ·  separatore delle micro-etichette      —  lineetta nei titoli
#   ★  flagship e premi                      →  ↖  ↓  frecce dei pulsanti
#   Φ  ESA Phi-lab                           π  ≈  ×  ±  nelle schede tecniche
#   €  £  valute                             …  “ ”  ‘ ’ punteggiatura
UNICODI='U+0020-00FF,U+0100-017F,U+2000-206F,U+20AC,U+00D7,U+00B1,U+2212,U+2248,U+2190-21FF,U+2605,U+03A6,U+03C0,U+2122,U+FEFF'

converti() {
  local src="$1" dest="$2"
  if [ "$SUBSET" = 1 ]; then
    uvx --from 'fonttools[woff]' pyftsubset "$src" \
      --unicodes="$UNICODI" \
      --layout-features='kern,liga,clig,calt,ccmp,locl,mark,mkmk,onum,tnum' \
      --flavor=woff2 \
      --output-file="$dest"
  else
    uvx --from 'fonttools[woff]' fonttools ttLib.woff2 compress -o "$dest" "$src"
  fi
  printf '  %-22s %6s KB   <- %s\n' "$dest" "$(( ($(stat -c%s "$dest") + 512) / 1024 ))" "$(basename "$src")"
}

echo "Conversione in corso (subset: $([ $SUBSET = 1 ] && echo si || echo no))"
TROVATI=0
for f in "${FILE[@]}"; do
  n=$(basename "$f" | tr '[:upper:]' '[:lower:]')
  case "$n" in
    *athelas*italic*|*athelas*ital*|*athelas*-it.*) converti "$f" athelas-italic.woff2 ;;
    *athelas*bold*|*athelas*semibold*|*athelas*demi*) converti "$f" athelas-bold.woff2 ;;
    *athelas*) converti "$f" athelas.woff2 ;;
    *vanguard*) converti "$f" vanguard.woff2 ;;
    *) echo "  (saltato, nome non riconosciuto: $(basename "$f"))"; continue ;;
  esac
  TROVATI=$((TROVATI+1))
done

echo
if [ "$TROVATI" -eq 0 ]; then
  echo "Nessun file riconosciuto. Rinomina i sorgenti includendo 'athelas' o"
  echo "'vanguard' nel nome, oppure passali uno alla volta." >&2
  exit 1
fi

echo "Fatto: $TROVATI file. Presenti adesso:"
ls -1 ./*.woff2 2>/dev/null | sed 's/^/  /' || echo "  nessuno"
echo
echo "Ricarica il sito: se i nomi sono giusti, i titoli passano da Bebas Neue a"
echo "Vanguard e il testo da Spectral ad Athelas. Poi:"
echo "  git add fonts/*.woff2 && git commit -m 'Font comprati' && git push"
