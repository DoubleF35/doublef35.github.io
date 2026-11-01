// Rigenera img/cover.jpg, la copertina dell'anteprima dei link (1200x630).
// È uno screenshot dell'hero vero del sito: niente menu, niente pulsanti,
// l'indirizzo in alto a destra e una riga sotto il titolo senza l'età
// (l'immagine è fissa, l'età invece cambia ogni anno).
//
// Uso, dalla cartella del sito:  node tools/og-cover.js [en|it]
// Serve Playwright con Chromium (npm i playwright && npx playwright install chromium)
// e Python con Pillow per ridurre e comprimere.
const { chromium } = require('playwright');
const { execFileSync } = require('child_process');
const path = require('path');
const lang = process.argv[2] === 'it' ? 'it' : 'en';
const site = path.resolve(__dirname, '..');
const DECK = {
  en: 'Federico Fassio, Turin. CubeSat project manager and CubeSAR chief engineer at Space Eagle, co-founder of YET.',
  it: 'Federico Fassio, Torino. Project manager dei CubeSat e chief engineer di CubeSAR in Space Eagle, cofondatore di YET.'
};
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 2 });
  await ctx.addInitScript(l => { try { localStorage.setItem('lang', l); } catch (e) {} }, lang);
  const p = await ctx.newPage();
  await p.goto('file://' + path.join(site, 'index.html'), { waitUntil: 'networkidle' });
  await p.evaluate(deck => {
    const st = document.createElement('style');
    st.textContent = `
      .skip,.nav__links,.nav__end,.hero__links,.nav__comb{display:none !important}
      .nav{position:absolute !important;background:transparent !important}
      .nav::before{display:none !important}
      .og-url{position:absolute;top:0;right:var(--m);height:var(--nav-h);display:flex;align-items:center;font:400 14px/1 var(--mono);color:var(--paper-dim);letter-spacing:.02em;z-index:70}
      .hero h1{font-size:88px !important}
      .hero__deck{max-width:44ch !important;font-size:20.5px !important;margin-top:26px !important}`;
    document.head.appendChild(st);
    const u = document.createElement('div'); u.className = 'og-url'; u.textContent = 'federicofassio.it'; document.body.appendChild(u);
    document.querySelectorAll('.hero__deck').forEach(d => { d.textContent = deck[d.dataset.l]; });
    window.dispatchEvent(new Event('resize'));
  }, DECK);
  await p.waitForTimeout(5000);               // l'intro del pettine deve finire
  const png = path.join(require('os').tmpdir(), 'og-cover.png');
  await p.screenshot({ path: png });
  await b.close();
  execFileSync('python3', ['-c', `
from PIL import Image
im = Image.open(${JSON.stringify(png)}).convert('RGB').resize((1200, 630), Image.LANCZOS)
im.save(${JSON.stringify(path.join(site, 'img', 'cover.jpg'))}, 'JPEG', quality=88, optimize=True, progressive=True, subsampling=0)
`]);
  console.log('img/cover.jpg aggiornata (' + lang + ')');
})();
