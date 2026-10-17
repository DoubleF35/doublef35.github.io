/*
 * attiva-foto.js — uso: node tools/attiva-foto.js
 *
 * In index.html le foto non ancora caricate restano come segnaposto:
 *
 *   <span class="frame">
 *     <!-- <img src="img/nome.jpg" width=".." height=".." alt=".."> -->
 *     <span class="plate"><b>img/nome.jpg</b><span>16:9</span></span>
 *   </span>
 *
 * Questo script cerca il file in img/ (con QUALSIASI estensione: .jpg .jpeg
 * .png .webp .avif .gif), e se lo trova toglie il commento all'<img>,
 * corregge l'estensione nel src e cancella il .plate.
 * Se il file non c'e', lascia tutto com'e'. Si puo' rilanciare quante volte
 * si vuole.
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const src = path.join(root, 'index.html');
const imgdir = path.join(root, 'img');

const files = {};
for (const f of fs.readdirSync(imgdir)) files[f.toLowerCase()] = f;

function trova(nome) {
  if (files[nome.toLowerCase()]) return files[nome.toLowerCase()];
  const stem = nome.replace(/\.[^.]*$/, '').toLowerCase();
  for (const ext of ['.jpeg', '.jpg', '.png', '.webp', '.avif', '.gif'])
    if (files[stem + ext]) return files[stem + ext];
  return null;
}

const reHint = /^\s*<!--\s*foto:.*-->\s*$/;
const reImg = /^(\s*)<!--\s*(<img\s+src="img\/([^"]+)"[\s\S]*?>)\s*-->\s*$/;
const rePlate = /^\s*<span class="plate">.*<\/span>\s*$/;

const righe = fs.readFileSync(src, 'utf8').split(/\r?\n/);
const out = [], attivate = [], mancanti = [];
let hint = null, togliPlate = false;

for (const ln of righe) {
  if (reHint.test(ln)) { hint = ln; continue; }
  const m = ln.match(reImg);
  if (m) {
    const [, indent, tag, nome] = m;
    const reale = trova(nome);
    if (reale) {
      out.push(indent + tag.replace('src="img/' + nome + '"', 'src="img/' + reale + '"'));
      attivate.push(nome + ' -> img/' + reale);
      hint = null;
      togliPlate = true;
    } else {
      mancanti.push('img/' + nome);
      if (hint !== null) { out.push(hint); hint = null; }
      out.push(ln);
    }
    continue;
  }
  if (togliPlate && rePlate.test(ln)) { togliPlate = false; continue; }
  if (hint !== null) { out.push(hint); hint = null; }
  togliPlate = false;
  out.push(ln);
}

fs.writeFileSync(src, out.join('\n'), 'utf8');

console.log(attivate.length ? 'Attivate:' : 'Niente di nuovo da attivare.');
attivate.forEach(r => console.log('  ' + r));
if (mancanti.length) {
  console.log('Ancora senza file (segnaposto lasciato):');
  mancanti.forEach(r => console.log('  ' + r));
}
