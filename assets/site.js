/* -------- Lingua ---------------------------------------------------------
   Il pulsante riscrive solo html[data-lang]: il resto lo fa il CSS.       */
(function(){
  var box = document.getElementById('lang');
  if(!box) return;
  // I testi alternativi delle immagini: inglese nell'attributo alt (la lingua
  // di default), italiano in data-alt-it. Si scambiano con la lingua.
  var imgs = document.querySelectorAll('img[data-alt-it]');
  // anche il titolo della scheda segue la lingua: ogni pagina scrive i suoi
  // due titoli in <html data-title-en data-title-it>
  var root = document.documentElement;
  var titles = { en: root.getAttribute('data-title-en'), it: root.getAttribute('data-title-it') };
  function apply(l){
    if(titles[l]) document.title = titles[l];
    var bs = box.querySelectorAll('button');
    for(var i = 0; i < bs.length; i++) bs[i].setAttribute('aria-pressed', bs[i].value === l ? 'true' : 'false');
    for(var j = 0; j < imgs.length; j++){
      var im = imgs[j];
      if(!im.hasAttribute('data-alt-en')) im.setAttribute('data-alt-en', im.alt);
      im.alt = l === 'it' ? im.getAttribute('data-alt-it') : im.getAttribute('data-alt-en');
    }
  }
  apply(document.documentElement.getAttribute('data-lang') === 'it' ? 'it' : 'en');
  box.addEventListener('click', function(e){
    var b = e.target.closest('button');
    if(!b) return;
    document.documentElement.setAttribute('data-lang', b.value);
    document.documentElement.setAttribute('lang', b.value);
    try{ localStorage.setItem('lang', b.value); }catch(err){}
    apply(b.value);
  });
})();

/* -------- Menu sul telefono ----------------------------------------------
   La <ul> della barra diventa un pannello a tutto schermo sotto i 760 px.
   Qui si apre e si chiude: al clic su un link, con Escape, e se lo schermo
   si allarga. Il fuoco entra nel pannello e torna al pulsante.           */
(function(){
  var b = document.getElementById('burger'), list = document.getElementById('navlinks');
  var nav = document.getElementById('nav'), root = document.documentElement;
  if(!b || !list || !nav) return;
  // A menu aperto tutto ciò che sta sotto il pannello diventa inerte: il Tab
  // e i lettori di schermo non possono finire su link nascosti.
  var behind = document.querySelectorAll('.skip, header.hero, main, footer');
  function set(open, keepFocus){
    root.classList.toggle('menu-open', open);
    b.setAttribute('aria-expanded', open ? 'true' : 'false');
    for(var i = 0; i < behind.length; i++) behind[i].inert = open;
    if(open){ var a = list.querySelector('a'); if(a) setTimeout(function(){ a.focus(); }, 30); }
    else if(!keepFocus) b.focus();
  }
  b.addEventListener('click', function(){ set(!root.classList.contains('menu-open')); });
  nav.addEventListener('click', function(e){ if(e.target.closest('a') && root.classList.contains('menu-open')) set(false, true); });
  addEventListener('keydown', function(e){ if(e.key === 'Escape' && root.classList.contains('menu-open')) set(false); });
  var wide = matchMedia('(min-width:761px)');
  var onWide = function(m){ if(m.matches && root.classList.contains('menu-open')) set(false, true); };
  if(wide.addEventListener) wide.addEventListener('change', onWide);
})();

/* -------- Il pettine dell'hero --------------------------------------------
   Barra per barra su un <canvas>. Scorrendo, la luce si comprime verso
   l'orizzonte come un impulso radar compresso in range: le barre si
   abbassano, prima ai bordi e poi al centro, finché resta una riga che sale
   con la pagina e diventa il bordo inferiore della barra di navigazione.

   Il campo di luce sta in una texture minuscola (quattro texel per barra:
   bordo, barra, barra, fessura) che a ogni fotogramma viene stirata barra
   per barra. Un fotogramma costa meno di un millisecondo anche su telefono,
   e il ciclo si ferma da solo appena la luce smette di muoversi: da fermo
   non si ridisegna niente.                                                */
(function(){
  var hero = document.querySelector('.hero');
  var nav = document.getElementById('nav');
  var cv = hero && hero.querySelector('.hero__comb');
  if(!cv || !nav || !cv.getContext) return;
  var ctx = cv.getContext('2d');
  if(!ctx) return;
  var sky = hero.querySelector('.hero__sky');
  var hz = hero.querySelector('.hero__horizon');
  var dockEl = nav.querySelector('.nav__comb');
  var rootStyle = document.documentElement.style;
  var mq = window.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : { matches:false };
  var still = mq.matches;

  // VS: la luce è liscia in verticale, il dettaglio è nel pettine, quindi il
  // canvas ha mezza risoluzione in altezza: metà pixel da riempire.
  var VS = .5, TH = 128, UH = 24, DMAX = .3, INTRO = 1400, GAP = .5, MAXPX = 9e6;
  var dpr, sy, W = 0, H = 0, O = 0, P, n, half, x0, navH = 56;
  var cols, under, halo, delay, vein;
  var qs = -1, lastT = 0, raf = 0, onScreen = true, stuck = false;
  var introAt = 0, introDone = false, lastC = -1, lastDist = 1e9;
  var hzO = '', hzT = '', skyO = '', dockO = '';

  function clamp(v, a, b){ if(a === undefined){ a = 0; b = 1; } return v < a ? a : v > b ? b : v; }
  function sstep(a, b, v){ v = clamp((v - a) / (b - a)); return v * v * (3 - 2 * v); }
  function g2(x){ return Math.exp(-x * x); }

  // Rampa per intensità: blu profondo, fascio, ciano. Si ferma al ciano:
  // il riferimento non arriva mai al bianco pieno, e nemmeno noi.
  var RAMP = [[0,8,22,76,0],[.1,10,34,112,.34],[.25,18,62,180,.72],[.42,36,108,240,.95],
    [.58,58,148,250,1],[.72,92,186,252,1],[.85,132,212,255,1],[.95,160,226,255,1],[1,178,234,255,1]];
  function px(d, k, I, a){
    I = clamp(I); var j = 1;
    while(RAMP[j][0] < I) j++;
    var A = RAMP[j - 1], Z = RAMP[j], f = (I - A[0]) / (Z[0] - A[0]);
    for(var c = 1; c < 4; c++) d[k + c - 1] = A[c] + (Z[c] - A[c]) * f;
    d[k + 3] = 255 * a * (A[4] + (Z[4] - A[4]) * f);
  }
  function tex(w, h, fn){
    var c = document.createElement('canvas'); c.width = w; c.height = h;
    var x = c.getContext('2d'), im = x.createImageData(w, h);
    for(var r = 0; r < h; r++) for(var i = 0; i < w; i++) fn(im.data, (r * w + i) * 4, i, r);
    x.putImageData(im, 0, 0); return c;
  }
  // Una barra è fatta di quattro texel: bordo, barra, barra, fessura. Stirati
  // su 8-10 pixel danno una lamella netta ma non tagliente, con la fessura
  // che resta blu: la luce si vede anche fra un dente e l'altro.
  function slat(I, q){ var s = I * (GAP + (1 - GAP) * I * I); return q === 3 ? s : q === 0 ? (I + s) / 2 : I; }

  var inn = hero.querySelector('.hero__in'), dpr0 = 0;
  function fit(){
    if(!inn) return;
    hero.style.minHeight = '';
    // In verticale il fascio sale di più in proporzione: serve più cielo.
    var need = Math.ceil((inn.offsetTop + inn.offsetHeight) / (hero.offsetHeight > hero.clientWidth * 1.1 ? .565 : .6));
    if(hero.offsetHeight < need) hero.style.minHeight = need + 'px';
  }
  function measure(){
    W = hero.clientWidth; H = hero.offsetHeight; navH = nav.offsetHeight || navH;
    O = Math.round(Math.min(220, H * .24));
  }
  function sizeCanvas(keep){
    if(!keep){
      dpr0 = Math.min(window.devicePixelRatio || 1, 2); dpr = dpr0;
      var area = W * (H + O) * VS;
      if(area * dpr * dpr > MAXPX) dpr = Math.max(1, Math.sqrt(MAXPX / area));
    }
    sy = dpr * VS;
    cv.width = Math.round(W * dpr); cv.height = Math.round((H + O) * sy);
    cv.style.height = H + O + 'px'; cv.style.bottom = -O + 'px';
  }

  function build(){
    fit(); measure(); sizeCanvas(false);
    var pitch = W < 520 ? 4 : 5;
    P = Math.max(3, Math.round(pitch * dpr));
    var Wd = cv.width;
    half = Math.ceil(Wd / 2 / P) + 1;
    n = half * 2 + 1; x0 = Math.round(Wd / 2 - P / 2) - half * P;
    // Le due righe in CSS (orizzonte e bordo della barra) usano lo stesso passo.
    rootStyle.setProperty('--comb-p', P / dpr + 'px');
    rootStyle.setProperty('--comb-x', ((x0 / dpr) % (P / dpr)) + 'px');

    // Il cumulo: basso e largo, picco ciano a circa tre quarti dell'altezza,
    // e una base blu che arriva ai bordi come un orizzonte. Sopra resta buio:
    // il titolo sta sul cielo, non dentro la luce.
    var port = H > W * 1.1, vc = port ? .74 : .76, vb = vc + .07;
    var rc = port ? W * .42 : Math.min(W * .3, 640), rb = port ? W * .85 : W * .72;
    function dxOf(i){ return (x0 + (i + .5) * P) / dpr - W / 2; }
    function field(dx, v){
      return 1 - Math.exp(-1.3 * (
        g2(dx / rc) * g2((v - vc) / (v < vc ? .16 : .2)) +
        .7 * g2(dx / rb) * g2((v - vb) / (v < vb ? .15 : .22)) +
        .2 * g2((1 - v) / .12)));
    }
    // Venature ferme: ogni colonna lascia passare un po' più o meno luce.
    var s = 7; function rnd(){ return (s = (s * 16807) % 2147483647) / 2147483647; }
    var F = new Float32Array(n * TH), bot = new Float32Array(n), st = 0, i, r, k, dx;
    for(i = 0; i < n; i++){
      st = st * .8 + (rnd() - .5) * .9;
      dx = dxOf(i); k = 1 + .035 * st;
      bot[i] = field(dx, 1) * k;
      for(r = 0; r < TH; r++) F[r * n + i] = field(dx, r / (TH - 1)) * k;
    }
    cols = tex(4 * n, TH, function(d, o, x, r){ px(d, o, slat(F[r * n + (x >> 2)], x & 3), 1); });
    under = tex(4 * n, UH, function(d, o, x, r){ var w = r / (UH - 1); px(d, o, slat(bot[x >> 2], x & 3) * g2(w / .62), g2(w / .5)); });
    halo = tex(n, 16, function(d, o, i, r){ px(d, o, .4, .5 * g2(dxOf(i) / (W * .5)) * g2((r - 7.5) / 3.4)); });

    // Ritardo per barra, a campana: i bordi cedono per primi, il centro per
    // ultimo, e la sagoma che resta è sempre una curva liscia.
    delay = new Float32Array(n); vein = new Float32Array(n);
    for(i = 0; i < n; i++){
      var u = (i - half) / half;
      delay[i] = DMAX * g2(u / .42);
      vein[i] = .6 * Math.sin(.071 * i + 4.1) + .4 * Math.sin(.19 * i + 1.3);
    }
    lastC = -1;
  }

  // c: 0 = cumulo pieno, 1 = solo orizzonte. dist: px fra orizzonte e barra.
  function draw(c, dist){
    var Wd = cv.width, yH = Math.round(H * sy), top = yH, i, x, e, h, a;
    var uh = O * sy * (1 - .9 * sstep(0, .8, c));
    // Nel primo tratto di scroll anche il centro si abbassa un poco: il
    // primo colpo di pollice deve già spostare la luce.
    var squeeze = 1 - .16 * sstep(0, .3, c);
    ctx.clearRect(0, 0, Wd, cv.height);
    for(i = 0; i < n; i++){
      x = clamp((c - delay[i]) / (1 - DMAX));
      e = 1 - (1 - x) * (1 - x);
      if(e >= 1) continue;
      h = yH * (1 + .05 * vein[i]) * (1 - e) * squeeze;
      a = clamp(.97 + .03 * vein[i]) * (1 - sstep(.72, 1, e));
      if(h < 1 || a <= 0) continue;
      ctx.globalAlpha = a;
      ctx.drawImage(cols, 4 * i, 0, 4, TH, x0 + i * P, yH - h, P, h);
      // Sotto l'orizzonte la luce si spegne nella pagina. Ogni colonna segue
      // la sua barra: nessun gradino dove finisce l'hero.
      if(uh > .5) ctx.drawImage(under, 4 * i, 0, 4, UH, x0 + i * P, yH, P, uh);
      if(yH - h < top) top = yH - h;
    }
    // La riga d'orizzonte (CSS) si accende mentre il cumulo si schiaccia e
    // passa il testimone alla barra in ±3 px, quando le due righe coincidono.
    var la = sstep(.15, .6, c) * clamp((dist + 3) / 3);
    if(la > 0){
      var hh = (80 - 56 * sstep(.2, 1, c)) * sy;
      ctx.globalAlpha = la * (.9 - .5 * c) * clamp(dist / 48);
      ctx.drawImage(halo, 0, 0, n, 16, x0, yH - hh / 2, n * P, hh);
    }
    ctx.globalAlpha = 1;
    if(hz){
      var o = la.toFixed(3), t = 'scaleY(' + (1 - 2 * sstep(.4, .95, c) / 3).toFixed(3) + ')';
      if(o !== hzO) hz.style.opacity = hzO = o;
      if(t !== hzT) hz.style.transform = hzT = t;
    }
  }

  // La barra si materializza appena si scorre; quando l'orizzonte la
  // raggiunge, il suo bordo inferiore diventa la stessa riga a pettine.
  function dock(dist){
    if(dockEl){
      var o = still ? String(+(dist <= 0)) : (1 - clamp(dist / 3)).toFixed(3);
      if(o !== dockO) dockEl.style.opacity = dockO = o;
    }
    var s = window.scrollY > 4;
    if(s !== stuck) nav.classList.toggle('is-stuck', stuck = s);
  }

  function frame(t){
    raf = 0;
    var y = Math.max(0, window.scrollY), dist = H - y - navH;
    dock(dist);
    if(!onScreen || document.hidden) return;
    if(still){
      if(lastC !== 0){ draw(0, dist); lastC = 0; lastDist = dist; }
      return;
    }
    var dt = Math.min(64, t - (lastT || t)); lastT = t;
    var q = clamp(y / Math.max(1, H - navH));
    // Smorzamento corto: la luce segue lo scroll come un ago, non a scatti.
    if(qs < 0) qs = q;
    qs += (q - qs) * (1 - Math.exp(-dt / 85)); if(Math.abs(q - qs) < 4e-4) qs = q;
    // Il cumulo sale dall'orizzonte una volta sola, dopo i font e il primo
    // disegno della pagina. Finché non parte, resta solo l'orizzonte.
    var k = introDone ? 1 : introAt ? clamp((t - introAt) / INTRO) : 0;
    if(k >= 1) introDone = true;
    var c = Math.max(qs, Math.pow(1 - k, 3));
    if(Math.abs(c - lastC) > 1e-4 || Math.abs(dist - lastDist) > .5){
      draw(c, dist); lastC = c; lastDist = dist;
      if(sky){ var so = (1 - .75 * sstep(0, .9, qs)).toFixed(2); if(so !== skyO) sky.style.opacity = skyO = so; }
    }
    // Il ciclo vive solo mentre qualcosa si muove.
    if(qs !== q || (introAt && !introDone)) raf = requestAnimationFrame(frame);
  }

  function kick(){ if(!raf) raf = requestAnimationFrame(frame); }
  function onResize(){
    var c = lastC;
    fit();
    var w = hero.clientWidth, h = hero.offsetHeight;
    if(w !== W || Math.abs(h - H) > 120 || Math.min(window.devicePixelRatio || 1, 2) !== dpr0) build();
    else { measure(); sizeCanvas(true); }
    lastC = -1;
    if(c >= 0 && onScreen && !document.hidden){
      lastDist = H - Math.max(0, window.scrollY) - navH;
      draw(c, lastDist); lastC = c;
    }
    kick();
  }
  // Una finestra spostata fra uno schermo normale e uno Retina cambia la
  // densità di pixel senza un evento resize.
  function watchDpr(){
    if(!window.matchMedia) return;
    var m = matchMedia('(resolution: ' + (window.devicePixelRatio || 1) + 'dppx)');
    var on = function(){ if(m.removeEventListener) m.removeEventListener('change', on); onResize(); watchDpr(); };
    if(m.addEventListener) m.addEventListener('change', on);
  }
  watchDpr();

  addEventListener('scroll', kick, { passive:true });
  addEventListener('resize', onResize);
  // Osserva il blocco di testo: se si allunga (un'altra lingua, i font che
  // arrivano) l'hero può dover crescere anche se la finestra è la stessa.
  if(window.ResizeObserver) new ResizeObserver(function(){ if(W) onResize(); }).observe(inn || hero);
  document.addEventListener('visibilitychange', function(){ lastT = 0; kick(); });
  if(window.IntersectionObserver) new IntersectionObserver(function(es){
    onScreen = es[es.length - 1].isIntersecting;
    lastT = 0; kick();
  }).observe(cv);
  if(mq.addEventListener) mq.addEventListener('change', function(){
    still = mq.matches; lastC = -1; qs = -1; introDone = true;
    if(sky) sky.style.opacity = skyO = '';
    kick();
  });

  build();
  // Se la pagina si apre già scesa (un link a #progetti, un ricaricamento),
  // niente salita del cumulo: si disegna direttamente lo stato giusto.
  if(still || window.scrollY > 40) introDone = true;
  else {
    var go = function(){ if(!introAt){ onResize(); requestAnimationFrame(function(t){ introAt = t; kick(); }); } };
    if(document.fonts && document.fonts.ready) document.fonts.ready.then(go);
    setTimeout(go, 1500);
  }
  kick();
})();

/* -------- I divisori ------------------------------------------------------
   Un righello sottile fra una sezione e l'altra: tacche da 1 px, altezza a
   campana come il cumulo dell'hero, una tacca più alta ogni dieci. Quando
   il divisore entra in vista, una testa lo percorre da sinistra a destra e
   ogni tacca si accende al passaggio, come un'eco, poi si assesta.
   Succede una volta sola per divisore; da quel momento è un disegno fermo. */
(function(){
  var els = document.querySelectorAll('canvas.sep');
  if(!els.length) return;
  var mq = window.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : null;
  var still = (mq && mq.matches) || !window.IntersectionObserver;
  var SWEEP = 900, DECAY = 320, BEAM = '#2f7dff', LIT = '#cfe6ff';

  function Sep(el){
    var c = el.getContext && el.getContext('2d');
    if(!c) return;
    var W, H, dpr, pitch, n, done = still;
    function size(){
      W = el.clientWidth; H = el.clientHeight; dpr = Math.min(window.devicePixelRatio || 1, 2);
      el.width = Math.round(W * dpr); el.height = Math.round(H * dpr);
      pitch = W < 520 ? 4 : 6; n = Math.floor((W - 1) / pitch) + 1;
    }
    function draw(t){ // t: ms dall'inizio della passata; Infinity = assestato
      c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, W, H);
      var head = t / SWEEP * (W + 60) - 30, i, x, u, env, rest, e, h;
      for(i = 0; i < n; i++){
        x = i * pitch; u = (x - W / 2) / (W * .3); env = Math.exp(-u * u);
        rest = Math.min(H, H * (.16 + .5 * env) * (i % 10 === 0 ? 1.7 : 1));
        if(x > head){
          c.globalAlpha = .16; c.fillStyle = BEAM;
          c.fillRect(x, H - rest * .55, 1, rest * .55);
          continue;
        }
        e = t === Infinity ? 0 : Math.exp(-Math.max(0, t - (x + 30) / (W + 60) * SWEEP) / DECAY);
        h = rest + (H - rest) * .85 * e;
        c.globalAlpha = Math.min(1, .3 + .62 * env + .25 * e);
        c.fillStyle = e > .3 ? LIT : BEAM;
        c.fillRect(x, H - h, 1, h);
      }
      c.globalAlpha = 1;
    }
    function run(t0){
      requestAnimationFrame(function step(now){
        if(done) return;
        var t = now - t0;
        if(t > SWEEP + DECAY * 5){ done = true; draw(Infinity); return; }
        draw(t); requestAnimationFrame(step);
      });
    }
    var io = null;
    size(); draw(done ? Infinity : -1);
    this.resize = function(){ size(); draw(done ? Infinity : -1); };
    this.settle = function(){ done = true; if(io) io.disconnect(); draw(Infinity); };
    if(done) return;
    io = new IntersectionObserver(function(en){
      if(en[en.length - 1].isIntersecting){ io.disconnect(); run(performance.now()); }
    }, { threshold:1, rootMargin:'0px 0px -18% 0px' });
    io.observe(el);
  }

  var list = [], w0 = window.innerWidth;
  for(var i = 0; i < els.length; i++) list.push(new Sep(els[i]));
  if(mq && mq.addEventListener) mq.addEventListener('change', function(){
    if(mq.matches) for(var k = 0; k < list.length; k++) if(list[k].settle) list[k].settle();
  });
  addEventListener('resize', function(){
    if(window.innerWidth === w0) return;
    w0 = window.innerWidth;
    for(var j = 0; j < list.length; j++) if(list[j].resize) list[j].resize();
  });
})();
/* L'età si aggiorna da sola: conta solo mese e anno di nascita (nov 2009),
   così nella pagina non c'è la data completa. Dal 1º dicembre scatta l'anno. */
(function(){
  var d = new Date(), age = d.getFullYear() - 2009 - (d.getMonth() < 11 ? 1 : 0);
  if(age < 16 || age > 40) return;
  var els = document.querySelectorAll('.age-now');
  for(var i = 0; i < els.length; i++) els[i].textContent = age;
})();

/* La rotaia della timeline si accende mentre scorri: la luce arriva fino a
   poco sopra la metà dello schermo e si ferma sull'ultimo punto. Un punto si
   accende quando la luce raggiunge il suo centro. Nessun rAF a pagina ferma;
   con "riduci movimento" è accesa tutta da subito. */
(function(){
  var tl = document.querySelector('.tl');
  if(!tl) return;
  var items = tl.querySelectorAll(':scope > li'), pending = false, near = false, off = [], r0 = 0;
  var mq = window.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : null;
  // dove sta il centro di ogni punto dentro la sua tappa, e dove parte la rotaia
  function measure(){
    r0 = parseFloat(getComputedStyle(tl, '::after').top) || 0;
    for(var i = 0; i < items.length; i++){
      var d = getComputedStyle(items[i], '::before');
      off[i] = (parseFloat(d.top) || 0) + (parseFloat(d.height) || 0) / 2;
    }
  }
  function update(){
    pending = false;
    var r = tl.getBoundingClientRect();
    var head = mq && mq.matches ? r.height : window.innerHeight * .58 - r.top;
    var last = items.length ? items[items.length - 1].offsetTop + off[items.length - 1] : r0;
    for(var i = 0; i < items.length; i++){
      items[i].classList.toggle('is-lit', items[i].offsetTop + off[i] <= head + .5);
    }
    tl.style.setProperty('--lit', Math.max(0, Math.min(head, last) - r0).toFixed(1) + 'px');
  }
  function kick(){ if(!pending && near){ pending = true; requestAnimationFrame(update); } }
  if('IntersectionObserver' in window){
    new IntersectionObserver(function(en){
      near = en[en.length - 1].isIntersecting;
      if(near) kick();
    }, { rootMargin:'50% 0px 50% 0px' }).observe(tl);
  } else near = true;
  addEventListener('scroll', kick, { passive:true });
  addEventListener('resize', function(){ measure(); kick(); });
  if(mq && mq.addEventListener) mq.addEventListener('change', kick);
  tl.addEventListener('toggle', kick, true);
  // aprire una storia allunga la lista mentre si anima: si ricalcola finché cambia misura
  if('ResizeObserver' in window) new ResizeObserver(kick).observe(tl);
  measure(); update();
})();

/* I video brevi (muted, autoplay, loop) girano solo quando sono in vista,
   così fuori schermo non consumano batteria. Un tocco li ferma e li fa
   ripartire. Con "riduci movimento" restano fermi, con i comandi. */
(function(){
  var vs = document.querySelectorAll('video[autoplay][loop]');
  if(!vs.length) return;
  var mq = window.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : null;
  function play(v){ var p = v.play(); if(p && p.catch) p.catch(function(){}); }
  for(var i = 0; i < vs.length; i++) (function(v){
    v.muted = true;
    if(mq && mq.matches){ v.removeAttribute('autoplay'); v.pause(); v.controls = true; return; }
    var held = false;
    v.addEventListener('click', function(){ held = !v.paused; if(held) v.pause(); else play(v); });
    if('IntersectionObserver' in window){
      new IntersectionObserver(function(es){
        for(var k = 0; k < es.length; k++){
          if(es[k].isIntersecting){ if(!held) play(v); } else v.pause();
        }
      }, { threshold: .2 }).observe(v);
    }
  })(vs[i]);
})();
