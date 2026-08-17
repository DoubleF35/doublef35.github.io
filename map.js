/* ==========================================================================
   La mappa: grafo 3D in WebGL.

   three.js sta in vendor/ e non su un CDN: il sito deve continuare a
   funzionare anche se un CDN cade, ed e' l'unica dipendenza che ha.

   Il piano del radar e' XZ, la quota e' Y. Tutte le posizioni si calcolano in
   coordinate polari (rilevamento, raggio, quota) perche' e' cosi' che si
   ragiona su un display radar — e perche' la disposizione dei nodi e'
   naturalmente radiale.
   ========================================================================== */
import * as THREE from './vendor/three.module.min.js';

/* ==========================================================================
   1. Modello del grafo
   --------------------------------------------------------------------------
   Gli accenti sono gli stessi del CSS, riscritti qui perche' WebGL non legge
   le variabili CSS: se ne cambi uno, cambialo in entrambi i posti.
   ========================================================================== */
const ACC = {centro:'#9B8FFF', orbita:'#5BE9FF', volo:'#FF6A3D', impresa:'#E84FD0', dati:'#CFFF04'};

/* Albero: centro -> aree -> (programma) -> progetti.
   La profondita' NON e' uniforme. Il ramo Volo ha un livello in piu' — il
   programma Seeker — perche' Seeker-One e Seeker-II sono due vettori dello
   stesso programma, non due progetti separati. */
const TREE = {
  id:'centro', label:{it:'FEDERICO', en:'FEDERICO'}, children:[
    {id:'volo', bearing:-2.36, label:{it:'VOLO', en:'FLIGHT'}, children:[
      {id:'seeker', label:{it:'SEEKER', en:'SEEKER'}, children:[
        {id:'seeker1', label:{it:'Seeker-One', en:'Seeker-One'}},
        {id:'seeker2', label:{it:'Seeker-II', en:'Seeker-II'}}
      ]}
    ]},
    {id:'orbita', bearing:-0.78, label:{it:'ORBITA', en:'ORBIT'}, children:[
      {id:'iceroute', label:{it:'IceRoute', en:'IceRoute'}, star:true},
      {id:'cubesar',  label:{it:'CubeSAR', en:'CubeSAR'}}
    ]},
    {id:'dati', bearing:0.78, label:{it:'DATI', en:'DATA'}, children:[
      {id:'f4kit', label:{it:'f4kit', en:'f4kit'}}
    ]},
    {id:'impresa', bearing:2.36, label:{it:'IMPRESA', en:'VENTURES'}, children:[
      {id:'edunity', label:{it:'EdUnity', en:'EdUnity'}},
      {id:'yet',     label:{it:'YET', en:'YET'}}
    ]}
  ]
};

/* Legami trasversali: non gerarchia, ma "stesso principio a scale diverse".
   Tratteggiati, per non farli sembrare un rapporto padre-figlio. */
const XLINKS = [['cubesar', 'iceroute']];

/* Appiattimento in ordine DFS: i genitori vengono sempre prima dei figli, e il
   secondo passaggio sui rilevamenti conta su questo. */
const N = [];
(function walk(node, parent, area, depth){
  N.push({
    id:node.id, label:node.label, star:!!node.star, depth,
    parent: parent ? parent.id : null,
    area: depth === 0 ? 'centro' : depth === 1 ? node.id : area,
    kind: depth === 0 ? 'centro' : depth === 1 ? 'area' : node.children ? 'prog' : 'leaf',
    kids: (node.children || []).map(c => c.id),
    bearing: node.bearing !== undefined ? node.bearing : 0
  });
  (node.children || []).forEach(c => walk(c, node, depth === 0 ? c.id : area, depth + 1));
})(TREE, null, 'centro', 0);

const byId = id => N.find(n => n.id === id);

/* Rilevamenti: le aree li hanno fissi, tutti gli altri li ereditano a
   ventaglio attorno al genitore. */
N.forEach(n => {
  if(n.kind === 'centro') return;
  const kids = n.kids.map(byId);
  if(!kids.length) return;
  const step = n.kind === 'prog' ? 0.66 : 0.46;
  kids.forEach((k, i) => k.bearing = n.bearing + (i - (kids.length - 1) / 2) * step);
});

/* Quota: i figli si alzano e si abbassano a coppie attorno al piano del
   radar. Serve a dare profondita' vera — su un piano solo, ruotando la
   camera, il grafo si appiattirebbe in una riga. */
N.forEach(n => {
  const kids = n.kids.map(byId);
  kids.forEach((k, i) => k.lift = kids.length === 1 ? 0 : (i % 2 ? 1 : -1) * (0.10 + 0.04 * n.depth));
});
N.forEach(n => {n.lift = n.lift || 0;});

N.forEach(n => {
  n.pos = new THREE.Vector3(); n.tgt = new THREE.Vector3();
  n.a = 0; n.ta = 1; n.echo = 0; n.hot = 0;
});

/* Un nodo si puo' aprire — e quindi porta l'anello — se ha figli o e' il
   flagship. */
const ringed = n => n.kind === 'area' || n.kind === 'prog' || n.star;

/* Rotte: ogni nodo e' una vista, piu' le due pagine fuori dal radar. */
const ROUTES = {};
N.forEach(n => ROUTES[n.id] = {view:'v-' + n.id, area:n.area, kind:n.kind});
ROUTES.percorso = {view:'v-percorso', area:'centro', kind:'extra'};
ROUTES.contatti = {view:'v-contatti', area:'centro', kind:'extra'};

/* ==========================================================================
   2. Stato
   ========================================================================== */
const html   = document.documentElement;
const mapEl  = document.getElementById('map');
const glCv   = document.getElementById('gl');
const labEl  = document.getElementById('labels');
const mm     = document.getElementById('minimap');
const mmx    = mm.getContext('2d');

const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const TAU = Math.PI * 2;
const norm = a => ((a % TAU) + TAU) % TAU;

const R = 100;                 /* raggio di riferimento in unita' di scena */
let route = 'centro', focusArea = null, selected = null;
let sweep = -Math.PI / 2, hover = null, last = 0, raf = 0;
let W = 1, H = 1, narrow = false;

const lang = () => html.dataset.lang;
const INK  = {dark:'255,255,255', light:'10,10,10'};
const ink  = (o = 1) => `rgba(${INK[html.dataset.theme] || INK.dark},${o})`;
const inkHex = () => html.dataset.theme === 'light' ? 0x0a0a0a : 0xffffff;

/* ==========================================================================
   3. Scena
   ========================================================================== */
let renderer;
try {
  renderer = new THREE.WebGLRenderer({canvas:glCv, antialias:true, alpha:true, powerPreference:'low-power'});
} catch(e){
  /* Niente WebGL: la mappa sparisce e il pannello prende tutta la larghezza.
     Il contenuto e' tutto nel DOM, quindi non si perde niente. */
  html.classList.add('no-gl');
  console.warn('WebGL non disponibile, mappa disattivata:', e && e.message);
}

const scene  = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(42, 1, 1, 4000);
const gRoot  = new THREE.Group();
scene.add(gRoot);

/* Camera in coordinate sferiche: e' un orbit control scritto a mano, perche'
   OrbitControls di three.js e' un addon separato e servirebbe una importmap
   per una manciata di righe. */
const cam = {az:-Math.PI / 2, el:0.58, dist:290, taz:-Math.PI / 2, tel:0.58, tdist:290};
const EL_MIN = 0.16, EL_MAX = 1.40, D_MIN = 180, D_MAX = 620;

function placeCamera(){
  const ce = Math.cos(cam.el), se = Math.sin(cam.el);
  camera.position.set(Math.cos(cam.az) * ce * cam.dist, se * cam.dist, Math.sin(cam.az) * ce * cam.dist);
  camera.lookAt(0, 0, 0);
}

/* ==========================================================================
   4. Materiali e forme condivise
   --------------------------------------------------------------------------
   Una geometria sola per tutti i nodi, riscalata per istanza: tredici sfere
   separate sarebbero tredici allocazioni identiche.
   ========================================================================== */
const SPHERE = new THREE.SphereGeometry(1, 20, 14);
const TORUS  = new THREE.TorusGeometry(1, 0.045, 8, 64);

/* Alone: una texture radiale disegnata una volta e usata da tutti gli sprite,
   tinta per nodo. Costa una texture invece di tredici. */
function glowTexture(){
  const s = 128, c = document.createElement('canvas');
  c.width = c.height = s;
  const x = c.getContext('2d');
  const g = x.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  g.addColorStop(0,   'rgba(255,255,255,1)');
  g.addColorStop(0.25,'rgba(255,255,255,0.42)');
  g.addColorStop(1,   'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, s, s);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
const GLOW = glowTexture();

/* ==========================================================================
   5. Campo stellare
   ========================================================================== */
function buildStars(){
  const n = 700, pos = new Float32Array(n * 3);
  for(let i = 0; i < n; i++){
    /* Distribuzione deterministica su un guscio: niente Math.random, cosi' il
       cielo e' sempre lo stesso e non "sfarfalla" fra un ricarico e l'altro. */
    const a = i * 2.39996, y = 1 - (i / (n - 1)) * 2, rr = Math.sqrt(Math.max(0, 1 - y * y));
    const d = 900 + (i % 7) * 90;
    pos[i * 3]     = Math.cos(a) * rr * d;
    pos[i * 3 + 1] = y * d * 0.55;
    pos[i * 3 + 2] = Math.sin(a) * rr * d;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const m = new THREE.PointsMaterial({color:inkHex(), size:2.6, sizeAttenuation:false, transparent:true, opacity:0.34, depthWrite:false});
  const p = new THREE.Points(g, m);
  p.renderOrder = -10;
  return p;
}
const stars = buildStars();
gRoot.add(stars);

/* ==========================================================================
   6. Griglia polare: anelli di portata e raggi di rilevamento
   ========================================================================== */
const gridGroup = new THREE.Group();
gRoot.add(gridGroup);

function buildGrid(){
  gridGroup.clear();
  const col = inkHex();

  [0.25, 0.46, 0.66, 0.86, 1.0].forEach(f => {
    const pts = [];
    for(let i = 0; i <= 128; i++){
      const a = (i / 128) * TAU;
      pts.push(new THREE.Vector3(Math.cos(a) * R * f, 0, Math.sin(a) * R * f));
    }
    const g = new THREE.BufferGeometry().setFromPoints(pts);
    gridGroup.add(new THREE.Line(g, new THREE.LineBasicMaterial({
      color:col, transparent:true, opacity: f === 1 ? 0.20 : 0.10, depthWrite:false
    })));
  });

  for(let d = 0; d < 360; d += 30){
    const a = d * Math.PI / 180, maj = d % 90 === 0;
    const g = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(Math.cos(a) * R * 0.10, 0, Math.sin(a) * R * 0.10),
      new THREE.Vector3(Math.cos(a) * R, 0, Math.sin(a) * R)
    ]);
    gridGroup.add(new THREE.Line(g, new THREE.LineBasicMaterial({
      color:col, transparent:true, opacity: maj ? 0.16 : 0.07, depthWrite:false
    })));
  }
}
buildGrid();

/* ==========================================================================
   7. Spazzata
   --------------------------------------------------------------------------
   Un ventaglio di triangoli con alpha per vertice che scende dalla testa alla
   coda. Il colore alpha per vertice funziona solo se l'attributo ha quattro
   componenti: con tre, three.js ignora la trasparenza e la coda resta piena.
   ========================================================================== */
const SLICES = 30, TRAIL = 1.15;
let sweepMesh, sweepEdge;

function buildSweep(){
  const pos = new Float32Array((SLICES * 3) * 3);
  const col = new Float32Array((SLICES * 3) * 4);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.BufferAttribute(col, 4));
  sweepMesh = new THREE.Mesh(g, new THREE.MeshBasicMaterial({
    vertexColors:true, transparent:true, side:THREE.DoubleSide,
    blending:THREE.AdditiveBlending, depthWrite:false
  }));
  sweepMesh.renderOrder = -5;
  gRoot.add(sweepMesh);

  const eg = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
  sweepEdge = new THREE.Line(eg, new THREE.LineBasicMaterial({transparent:true, opacity:0.6, depthWrite:false}));
  gRoot.add(sweepEdge);
}
buildSweep();

function updateSweep(){
  const p = sweepMesh.geometry.attributes.position.array;
  const c = sweepMesh.geometry.attributes.color.array;
  const light = html.dataset.theme === 'light';
  const base = light ? [0.04, 0.04, 0.04] : [1, 1, 1];
  const rad = R * 1.0;

  for(let i = 0; i < SLICES; i++){
    const t0 = sweep - TRAIL * (i + 1) / SLICES;
    const t1 = sweep - TRAIL * i / SLICES;
    const al = Math.pow(1 - i / SLICES, 2.1) * (light ? 0.10 : 0.16);
    const o = i * 9, co = i * 12;

    p[o] = 0; p[o + 1] = 0; p[o + 2] = 0;
    p[o + 3] = Math.cos(t0) * rad; p[o + 4] = 0; p[o + 5] = Math.sin(t0) * rad;
    p[o + 6] = Math.cos(t1) * rad; p[o + 7] = 0; p[o + 8] = Math.sin(t1) * rad;

    for(let v = 0; v < 3; v++){
      c[co + v * 4]     = base[0];
      c[co + v * 4 + 1] = base[1];
      c[co + v * 4 + 2] = base[2];
      c[co + v * 4 + 3] = v === 0 ? al * 0.35 : al;   /* il centro piu' scarico */
    }
  }
  sweepMesh.geometry.attributes.position.needsUpdate = true;
  sweepMesh.geometry.attributes.color.needsUpdate = true;

  const ep = sweepEdge.geometry.attributes.position.array;
  ep[0] = 0; ep[1] = 0; ep[2] = 0;
  ep[3] = Math.cos(sweep) * rad; ep[4] = 0; ep[5] = Math.sin(sweep) * rad;
  sweepEdge.geometry.attributes.position.needsUpdate = true;
  sweepEdge.material.color.set(ACC[html.dataset.area] || ACC.centro);
}

/* ==========================================================================
   8. Nodi ed etichette
   ========================================================================== */
const nodeGroup = new THREE.Group();
gRoot.add(nodeGroup);

N.forEach(n => {
  const col = new THREE.Color(ACC[n.area] || ACC.centro);

  n.mesh = new THREE.Mesh(SPHERE, new THREE.MeshBasicMaterial({color:col, transparent:true}));
  n.mesh.userData.id = n.id;
  nodeGroup.add(n.mesh);

  n.glow = new THREE.Sprite(new THREE.SpriteMaterial({
    map:GLOW, color:col, transparent:true, blending:THREE.AdditiveBlending, depthWrite:false
  }));
  n.glow.renderOrder = 2;
  nodeGroup.add(n.glow);

  /* L'anello sta nel piano del radar e si legge come un'orbita: e' il segno
     che quel nodo si puo' aprire. */
  if(ringed(n)){
    n.ring = new THREE.Mesh(TORUS, new THREE.MeshBasicMaterial({color:col, transparent:true, depthWrite:false}));
    n.ring.rotation.x = Math.PI / 2;
    nodeGroup.add(n.ring);
  }

  /* Etichetta in HTML, non come texture: resta nitida a ogni distanza, si
     traduce con il resto della pagina e si puo' selezionare. */
  const el = document.createElement('span');
  el.className = 'lbl' + (n.kind === 'leaf' ? '' : ' lbl--big');
  el.style.setProperty('--lc', ACC[n.area] || ACC.centro);
  labEl.appendChild(el);
  n.el = el;
});

function labelText(){
  N.forEach(n => n.el.textContent = (n.label[lang()] || n.label.it) + (n.star ? ' ★' : ''));
}
labelText();

/* Raggio del nodo in unita' di scena. */
function nodeR(n){
  const base = n.kind === 'centro' ? 3.4 : n.kind === 'area' ? 2.8 : n.kind === 'prog' ? 2.4 : 1.9;
  return base * (1 + n.echo * 0.42 + n.hot * 0.30) * (selected === n.id ? 1.35 : 1);
}

/* ==========================================================================
   9. Collegamenti
   --------------------------------------------------------------------------
   Un solo oggetto per la gerarchia, con posizioni e alpha riscritti a ogni
   fotogramma: i nodi si muovono di continuo durante la riaggregazione.
   ========================================================================== */
const linkPairs = N.filter(n => n.parent).map(n => [n.id, n.parent]);
let hierLines, xLines;

function buildLinks(){
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(linkPairs.length * 6), 3));
  g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(linkPairs.length * 8), 4));
  hierLines = new THREE.LineSegments(g, new THREE.LineBasicMaterial({vertexColors:true, transparent:true, depthWrite:false}));
  gRoot.add(hierLines);

  const xg = new THREE.BufferGeometry();
  xg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(XLINKS.length * 6), 3));
  xLines = new THREE.LineSegments(xg, new THREE.LineDashedMaterial({
    color:ACC.orbita, dashSize:3.2, gapSize:3.4, transparent:true, depthWrite:false
  }));
  gRoot.add(xLines);
}
buildLinks();

function updateLinks(){
  const p = hierLines.geometry.attributes.position.array;
  const c = hierLines.geometry.attributes.color.array;
  const light = html.dataset.theme === 'light';
  const base = light ? [0.04, 0.04, 0.04] : [1, 1, 1];

  linkPairs.forEach(([a, b], i) => {
    const na = byId(a), nb = byId(b);
    const al = Math.min(na.a, nb.a) * (light ? 0.30 : 0.34);
    p[i * 6]     = na.pos.x; p[i * 6 + 1] = na.pos.y; p[i * 6 + 2] = na.pos.z;
    p[i * 6 + 3] = nb.pos.x; p[i * 6 + 4] = nb.pos.y; p[i * 6 + 5] = nb.pos.z;
    for(let v = 0; v < 2; v++){
      c[i * 8 + v * 4]     = base[0];
      c[i * 8 + v * 4 + 1] = base[1];
      c[i * 8 + v * 4 + 2] = base[2];
      c[i * 8 + v * 4 + 3] = al;
    }
  });
  hierLines.geometry.attributes.position.needsUpdate = true;
  hierLines.geometry.attributes.color.needsUpdate = true;

  const xp = xLines.geometry.attributes.position.array;
  let vis = 0;
  XLINKS.forEach(([a, b], i) => {
    const na = byId(a), nb = byId(b);
    vis = Math.max(vis, Math.min(na.a, nb.a));
    xp[i * 6]     = na.pos.x; xp[i * 6 + 1] = na.pos.y; xp[i * 6 + 2] = na.pos.z;
    xp[i * 6 + 3] = nb.pos.x; xp[i * 6 + 4] = nb.pos.y; xp[i * 6 + 5] = nb.pos.z;
  });
  xLines.geometry.attributes.position.needsUpdate = true;
  xLines.computeLineDistances();          /* obbligatorio, se no il tratteggio non appare */
  xLines.material.opacity = vis * 0.75;
  xLines.material.color.set(ACC[byId(XLINKS[0][0]).area] || ACC.centro);
}

/* ==========================================================================
   9b. Modellini d'area: il razzo e il satellite
   --------------------------------------------------------------------------
   Costruiti con primitive invece che caricati da un file: un GLTF vorrebbe
   l'addon GLTFLoader, una importmap e un asset da scaricare, per due oggetti
   che sono un cilindro con un cono sopra e una scatola con due ali.

   Compaiono solo quando la loro area e' aperta, e girano attorno all'origine
   — che in vista d'area e' esattamente dove sta il nodo dell'area. Il nodo fa
   da rampa per il razzo e da pianeta per il satellite.
   ========================================================================== */
function fadeGroup(g, o){
  g.visible = o > 0.01;
  g.traverse(c => { if(c.material) c.material.opacity = c.material.userData.base * o; });
}
function markBase(g){
  g.traverse(c => { if(c.material){ c.material.transparent = true; c.material.userData.base = c.material.opacity ?? 1; } });
}

function buildRocket(){
  const g = new THREE.Group();
  const skin = new THREE.MeshBasicMaterial({color:new THREE.Color(ACC.volo)});
  const dark = new THREE.MeshBasicMaterial({color:new THREE.Color(ACC.volo), opacity:0.55});

  g.add(new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 9, 14), skin));
  const nose = new THREE.Mesh(new THREE.ConeGeometry(1.5, 3.8, 14), skin);
  nose.position.y = 6.4; g.add(nose);

  for(let i = 0; i < 3; i++){
    const a = i / 3 * TAU;
    const f = new THREE.Mesh(new THREE.BoxGeometry(0.28, 3, 2.4), dark);
    f.position.set(Math.cos(a) * 1.5, -3.4, Math.sin(a) * 1.5);
    f.rotation.y = -a;
    g.add(f);
  }

  const flame = new THREE.Mesh(new THREE.ConeGeometry(1.15, 5.5, 12), new THREE.MeshBasicMaterial({
    color:0xffc27a, opacity:0.85, blending:THREE.AdditiveBlending, depthWrite:false
  }));
  flame.position.y = -7.2; flame.rotation.z = Math.PI;
  g.add(flame); g.userData.flame = flame;

  markBase(g); g.visible = false;
  return g;
}

function buildSat(){
  const g = new THREE.Group();
  const skin  = new THREE.MeshBasicMaterial({color:new THREE.Color(ACC.orbita)});
  const panel = new THREE.MeshBasicMaterial({color:new THREE.Color(ACC.orbita), opacity:0.42, side:THREE.DoubleSide});

  g.add(new THREE.Mesh(new THREE.BoxGeometry(4.2, 3, 3), skin));
  [-6.2, 6.2].forEach(x => {
    const p = new THREE.Mesh(new THREE.BoxGeometry(7, 0.18, 3.4), panel);
    p.position.x = x; g.add(p);
  });
  /* Mezza sfera come parabola, rivolta verso il nodo: il satellite guarda
     sempre quello che sta osservando, come IceRoute guarda il ghiaccio. */
  const dish = new THREE.Mesh(new THREE.SphereGeometry(1.6, 12, 8, 0, TAU, 0, Math.PI / 2), skin);
  dish.rotation.x = Math.PI; dish.position.y = -2.1;
  g.add(dish);

  markBase(g); g.visible = false;
  return g;
}

/* Traccia dell'orbita: si vede da dove viene e dove va. */
function buildOrbitPath(){
  const pts = [];
  for(let i = 0; i <= 160; i++){
    const a = i / 160 * TAU;
    pts.push(new THREE.Vector3(Math.cos(a) * SAT_R, 0, Math.sin(a) * SAT_R));
  }
  const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),
    new THREE.LineBasicMaterial({color:new THREE.Color(ACC.orbita), transparent:true, opacity:0.30, depthWrite:false}));
  l.rotation.x = SAT_INC;
  l.material.userData = {base:0.30};
  l.visible = false;
  return l;
}

const SAT_R = 42, SAT_INC = 0.62;
const rocket = buildRocket();
const sat = buildSat();
const satPath = buildOrbitPath();
gRoot.add(rocket, sat, satPath);

let rocketT = 0.35, satT = 0, fVolo = 0, fOrb = 0;

function updateProps(dt){
  /* Le due presenze salgono e scendono con il fuoco sull'area. */
  const k = 1 - Math.pow(0.004, dt);
  fVolo += ((focusArea === 'volo' ? 1 : 0) - fVolo) * k;
  fOrb  += ((focusArea === 'orbita' ? 1 : 0) - fOrb) * k;

  if(!reduce.matches && fVolo > 0.02){
    rocketT += dt * 0.22;
    if(rocketT > 1) rocketT = 0;
  }
  /* Parte lento e accelera: al quadrato la salita somiglia a una spinta
     costante invece che a un ascensore. */
  const p = rocketT, climb = p * p;
  rocket.position.set(0, -7 + climb * 165, 0);
  rocket.rotation.y += reduce.matches ? 0 : dt * 2.4;
  rocket.rotation.z = Math.sin(p * Math.PI) * 0.16;      /* accenno di virata */
  /* 1.9 di base: a scala 1 il razzo e' alto quanto due volte il nodo e sullo
     schermo sparisce. Rimpicciolisce salendo, che legge come allontanamento. */
  rocket.scale.setScalar((1 - climb * 0.35) * 1.9);
  if(rocket.userData.flame) rocket.userData.flame.scale.y = 0.7 + Math.sin(performance.now() / 40) * 0.18 + climb;
  /* Sfuma in coda: sparisce in quota invece di essere tagliata di netto. */
  fadeGroup(rocket, fVolo * Math.min(1, (1 - p) * 2.4) * Math.min(1, p * 12));

  if(!reduce.matches && fOrb > 0.02) satT += dt * 0.55;
  sat.position.set(Math.cos(satT) * SAT_R, 0, Math.sin(satT) * SAT_R);
  sat.position.applyAxisAngle(new THREE.Vector3(1, 0, 0), SAT_INC);
  sat.lookAt(0, 0, 0);
  fadeGroup(sat, fOrb);
  satPath.visible = fOrb > 0.02;
  satPath.material.opacity = 0.30 * fOrb;
}

/* ==========================================================================
   10. Disposizione
   --------------------------------------------------------------------------
   Due configurazioni, come nella versione piatta. Vista d'insieme: anelli per
   profondita'. Vista d'area: l'area scelta prende il centro, il suo
   sottoalbero si apre a ventaglio, le altre vanno al bordo e i discendenti si
   spengono. Il passaggio fra le due e' la riaggregazione.
   ========================================================================== */
function place(n, bearing, radius, lift){
  n.tgt.set(Math.cos(bearing) * radius, lift * R, Math.sin(bearing) * radius);
}

function layout(snap){
  const c = byId('centro');

  if(!focusArea){
    const RAD = [0, R * 0.40, R * 0.66, R * 0.86];
    c.tgt.set(0, 0, 0); c.ta = 1;
    N.forEach(n => {
      if(n.kind === 'centro') return;
      place(n, n.bearing, RAD[Math.min(n.depth, 3)], n.lift);
      n.ta = n.depth >= 3 ? 0.84 : n.depth === 2 ? 0.92 : 1;
    });
  } else {
    const f = byId(focusArea);
    const REL = [0, R * 0.44, R * 0.76];

    c.tgt.set(Math.cos(f.bearing + Math.PI) * R * 0.72, 0, Math.sin(f.bearing + Math.PI) * R * 0.72);
    c.ta = 0.45;
    f.tgt.set(0, 0, 0); f.ta = 1;

    const spread = (kids, baseAng) => {
      const wide = kids.length === 1 ? 0 : 1.6;
      kids.forEach((k, i) => {
        const ang = baseAng + (i - (kids.length - 1) / 2) * (wide / Math.max(1, kids.length - 1));
        const rel = Math.min(k.depth - f.depth, 2);
        place(k, ang, REL[rel], k.lift * 1.5);
        k.ta = 1;
        const gk = k.kids.map(byId);
        if(gk.length) spread(gk, ang);
      });
    };
    spread(f.kids.map(byId), f.bearing);

    N.forEach(n => {
      if(n.kind === 'centro' || n.area === focusArea) return;
      if(n.kind === 'area'){ place(n, n.bearing, R * 0.92, n.lift); n.ta = 0.22; }
      else { n.tgt.copy(byId(n.area).tgt); n.ta = 0; }
    });
  }

  if(snap || reduce.matches) N.forEach(n => {n.pos.copy(n.tgt); n.a = n.ta;});
}

/* ==========================================================================
   11. Aggiornamento degli oggetti
   ========================================================================== */
const vproj = new THREE.Vector3();

function updateNodes(){
  N.forEach(n => {
    const r = nodeR(n), vis = n.a;
    n.mesh.position.copy(n.pos);
    n.mesh.scale.setScalar(r);
    n.mesh.material.opacity = vis;
    n.mesh.visible = vis > 0.02;

    n.glow.position.copy(n.pos);
    n.glow.scale.setScalar(r * (7 + n.echo * 5));
    n.glow.material.opacity = vis * (0.16 + n.echo * 0.5 + n.hot * 0.24);
    n.glow.visible = n.glow.material.opacity > 0.01;

    if(n.ring){
      const rr = r + (n.kind === 'area' ? 5.5 : n.kind === 'prog' ? 4.6 : 4);
      n.ring.position.copy(n.pos);
      n.ring.scale.setScalar(rr);
      n.ring.material.opacity = vis * (0.28 + n.echo * 0.5 + n.hot * 0.3);
      n.ring.visible = n.ring.material.opacity > 0.01;
    }
  });
}

/* Le etichette sono HTML: si proietta la posizione del nodo sullo schermo e
   si sposta lo span. Con tredici etichette costa nulla e il testo resta
   nitido a qualunque distanza, cosa che una texture non fa. */
function updateLabels(){
  N.forEach(n => {
    /* Su schermo stretto la mappa e' una fascia di 38vh: tredici etichette a
       corpo fisso si accavallano. Restano quelle dei nodi apribili, piu'
       quello puntato o aperto; i progetti si toccano lo stesso e sono
       elencati nel pannello subito sotto. */
    const mute = narrow && n.kind === 'leaf' && hover !== n.id && selected !== n.id;
    if(n.a < 0.06 || mute){ n.el.style.opacity = '0'; return; }
    vproj.copy(n.pos).project(camera);
    if(vproj.z > 1){ n.el.style.opacity = '0'; return; }   /* dietro la camera */

    const sx = (vproj.x * 0.5 + 0.5) * W;
    const sy = (-vproj.y * 0.5 + 0.5) * H;
    const off = nodeR(n) * 1.6 + 12;
    /* Oltre i due terzi dello schermo l'etichetta va a sinistra del nodo, se
       no esce dal riquadro della mappa. */
    const flip = sx > W * 0.66;
    n.el.style.transform =
      `translate3d(${(sx + (flip ? -off : off)).toFixed(1)}px,${sy.toFixed(1)}px,0)` +
      ` translate(${flip ? '-100%' : '0'},-50%)`;

    /* Sbiadire con la distanza dalla camera, non con la distanza assoluta:
       il riferimento e' il nodo alla stessa distanza del centro scena, che
       deve restare a piena intensita' a qualunque zoom. */
    const dist = camera.position.distanceTo(n.pos);
    const fade = THREE.MathUtils.clamp(1.12 - (dist / cam.dist - 1) * 1.5, 0.42, 1);
    n.el.style.opacity = String(n.a * fade * (n.kind === 'leaf' ? 0.85 + n.hot * 0.15 : 1));
    n.el.style.zIndex = String(1000 - Math.round(dist));
    n.el.classList.toggle('is-hot', hover === n.id || selected === n.id);
  });
}

/* ==========================================================================
   12. Controlli orbitali
   --------------------------------------------------------------------------
   Scritti a mano: OrbitControls di three.js e' un addon separato, e
   servirebbe una importmap per una manciata di righe.
   ========================================================================== */
const pointers = new Map();
let moved = false, pinch0 = 0, dist0 = 0;

mapEl.addEventListener('pointerdown', e => {
  pointers.set(e.pointerId, {x:e.clientX, y:e.clientY});
  moved = false;
  if(pointers.size === 2){
    const [a, b] = [...pointers.values()];
    pinch0 = Math.hypot(a.x - b.x, a.y - b.y);
    dist0 = cam.tdist;
  }
  mapEl.setPointerCapture?.(e.pointerId);
});

mapEl.addEventListener('pointermove', e => {
  const prev = pointers.get(e.pointerId);

  if(!prev){                                  /* nessun tasto premuto: solo hover */
    const n = pick(e.clientX, e.clientY);
    hover = n ? n.id : null;
    mapEl.classList.toggle('is-hit', !!n);
    return;
  }

  const dx = e.clientX - prev.x, dy = e.clientY - prev.y;
  pointers.set(e.pointerId, {x:e.clientX, y:e.clientY});
  if(Math.abs(dx) + Math.abs(dy) > 3) moved = true;

  if(pointers.size === 2){
    const [a, b] = [...pointers.values()];
    const d = Math.hypot(a.x - b.x, a.y - b.y);
    if(pinch0 > 0) cam.tdist = THREE.MathUtils.clamp(dist0 * pinch0 / d, D_MIN, D_MAX);
    return;
  }

  cam.taz -= dx * 0.006;
  cam.tel = THREE.MathUtils.clamp(cam.tel + dy * 0.005, EL_MIN, EL_MAX);
});

function release(e){
  const had = pointers.has(e.pointerId);
  pointers.delete(e.pointerId);
  if(pointers.size < 2) pinch0 = 0;
  if(had && !moved && pointers.size === 0){
    const n = pick(e.clientX, e.clientY);
    if(n) location.hash = '#/' + n.id;
  }
}
mapEl.addEventListener('pointerup', release);
mapEl.addEventListener('pointercancel', e => {pointers.delete(e.pointerId); pinch0 = 0;});
mapEl.addEventListener('pointerleave', () => {
  if(!pointers.size){ hover = null; mapEl.classList.remove('is-hit'); }
});

mapEl.addEventListener('wheel', e => {
  e.preventDefault();
  cam.tdist = THREE.MathUtils.clamp(cam.tdist * (1 + Math.sign(e.deltaY) * 0.08), D_MIN, D_MAX);
}, {passive:false});

/* Selezione in spazio schermo invece che con un raycast sulle sfere: i nodi
   sono piccoli e un raggio geometrico li manca di continuo. Cosi' l'area
   sensibile e' generosa e indipendente dallo zoom. */
function pick(cx, cy){
  const r = mapEl.getBoundingClientRect();
  const px = cx - r.left, py = cy - r.top;
  let best = null, bd = Infinity;
  N.forEach(n => {
    if(n.a < 0.3) return;
    vproj.copy(n.pos).project(camera);
    if(vproj.z > 1) return;
    const sx = (vproj.x * 0.5 + 0.5) * W, sy = (-vproj.y * 0.5 + 0.5) * H;
    const d = Math.hypot(sx - px, sy - py);
    const rad = n.kind === 'leaf' ? 20 : 26;
    if(d <= rad && d < bd){ bd = d; best = n; }
  });
  return best;
}

/* ==========================================================================
   13. Minimappa
   --------------------------------------------------------------------------
   Resta in 2D: e' uno schema, non una veduta. Mostra sempre la vista
   d'insieme anche quando la mappa grande e' entrata in un'area — serve da
   bussola, non da specchio.
   ========================================================================== */
function drawMini(){
  const dpr = Math.min(2, devicePixelRatio || 1);
  const w = mm.width / dpr, h = mm.height / dpr;
  mmx.clearRect(0, 0, w, h);
  const rr = Math.min(w, h) * 0.40;
  mmx.save(); mmx.translate(w / 2, h / 2);
  mmx.strokeStyle = ink(0.13); mmx.lineWidth = 1;
  mmx.beginPath(); mmx.arc(0, 0, rr, 0, TAU); mmx.stroke();

  const F = [0, 0.48, 0.76, 0.98];
  const pos = n => {
    const f = F[Math.min(n.depth, 3)];
    return [Math.cos(n.bearing) * rr * f, Math.sin(n.bearing) * rr * f];
  };

  mmx.strokeStyle = ink(0.16);
  N.forEach(n => {
    if(!n.parent) return;
    const [x1, y1] = pos(n), [x0, y0] = pos(byId(n.parent));
    mmx.beginPath(); mmx.moveTo(x0, y0); mmx.lineTo(x1, y1); mmx.stroke();
  });
  N.forEach(n => {
    const [x, y] = pos(n), here = n.id === route;
    mmx.fillStyle = ACC[n.area] || ACC.centro;
    mmx.globalAlpha = here ? 1 : 0.42;
    mmx.beginPath(); mmx.arc(x, y, here ? 3.2 : n.kind === 'leaf' ? 1.5 : 2.1, 0, TAU); mmx.fill();
    if(here){
      mmx.globalAlpha = 0.9; mmx.strokeStyle = ACC[n.area] || ACC.centro; mmx.lineWidth = 1;
      mmx.beginPath(); mmx.arc(x, y, 6.5, 0, TAU); mmx.stroke();
    }
    mmx.globalAlpha = 1;
  });
  mmx.restore();
}

/* ==========================================================================
   14. Dimensioni
   ========================================================================== */
function resize(){
  const r = mapEl.getBoundingClientRect();
  W = Math.max(1, r.width); H = Math.max(1, r.height);
  narrow = W < 560;
  const dpr = Math.min(2, devicePixelRatio || 1);

  if(renderer){
    renderer.setPixelRatio(dpr);
    renderer.setSize(W, H, false);
  }
  camera.aspect = W / H;
  camera.updateProjectionMatrix();

  const mr = mm.getBoundingClientRect();
  mm.width = Math.max(1, mr.width) * dpr | 0;
  mm.height = Math.max(1, mr.height) * dpr | 0;
  mmx.setTransform(dpr, 0, 0, dpr, 0, 0);

  layout(true); drawMini();
}

/* ==========================================================================
   15. Ciclo
   ========================================================================== */
const SPEED = 0.62;   /* rad/s — un giro ogni ~10 s */
const DECAY = 0.55;   /* l'eco si spegne in ~1.8 s */

function frame(ts){
  raf = requestAnimationFrame(frame);
  const dt = Math.min(0.05, (ts - last) / 1000 || 0); last = ts;

  const k  = reduce.matches ? 1 : 1 - Math.pow(0.0016, dt);
  const kh = 1 - Math.pow(0.002, dt);
  N.forEach(n => {
    n.pos.lerp(n.tgt, k);
    n.a += (n.ta - n.a) * k;
    n.hot += ((hover === n.id ? 1 : 0) - n.hot) * kh;
  });

  if(!reduce.matches){
    const prev = sweep;
    sweep += dt * SPEED;
    const span = norm(sweep - prev);
    N.forEach(n => {
      if(n.a < 0.1) return;
      if(norm(Math.atan2(n.pos.z, n.pos.x) - prev) <= span) n.echo = 1;
    });
    if(sweep > TAU) sweep -= TAU;
  }
  N.forEach(n => n.echo = Math.max(0, n.echo - dt * DECAY));

  const kc = 1 - Math.pow(0.0009, dt);
  cam.az   += (cam.taz - cam.az) * kc;
  cam.el   += (cam.tel - cam.el) * kc;
  cam.dist += (cam.tdist - cam.dist) * kc;
  placeCamera();

  updateNodes(); updateLinks(); updateSweep(); updateProps(dt); updateLabels();
  if(renderer) renderer.render(scene, camera);
}

function start(){ if(renderer && !raf){ last = performance.now(); raf = requestAnimationFrame(frame); } }
function stop(){ if(raf){ cancelAnimationFrame(raf); raf = 0; } }
document.addEventListener('visibilitychange', () => document.hidden ? stop() : start());

/* ==========================================================================
   16. Rotte
   ========================================================================== */
const COUNT = {
  area: N.filter(n => n.kind === 'area').length,
  prog: N.filter(n => n.kind === 'prog').length,
  leaf: N.filter(n => n.kind === 'leaf').length
};
function legend(){
  const it = lang() === 'it';
  document.getElementById('lg-1').textContent = it
    ? 'TRASCINA PER RUOTARE · ROTELLA PER AVVICINARE · CLICCA UN NODO PER APRIRLO'
    : 'DRAG TO ORBIT · SCROLL TO ZOOM · CLICK A NODE TO OPEN IT';
  document.getElementById('lg-2').textContent = it
    ? `${COUNT.area} AREE · ${COUNT.prog} PROGRAMMA · ${COUNT.leaf} PROGETTI · 1 FLAGSHIP`
    : `${COUNT.area} AREAS · ${COUNT.prog} PROGRAMME · ${COUNT.leaf} PROJECTS · 1 FLAGSHIP`;
}

function go(){
  const h = location.hash.replace(/^#\/?/, '').replace(/\/$/, '');
  route = ROUTES[h] ? h : 'centro';
  const r = ROUTES[route];

  html.dataset.area = r.area;
  focusArea = r.kind === 'area' ? route
            : (r.kind === 'prog' || r.kind === 'leaf') ? byId(route).area
            : null;
  selected = (r.kind === 'prog' || r.kind === 'leaf') ? route : null;

  document.querySelectorAll('.view').forEach(v => v.classList.toggle('is-on', v.id === r.view));

  /* Se esiste una pill per la rotta esatta si accende solo quella; altrimenti
     si accende quella dell'area, che fa da traccia di percorso. */
  const pills = [...document.querySelectorAll('.pill')];
  const targets = pills.map(p => p.getAttribute('href').replace('#/', ''));
  const exact = targets.includes(route);
  pills.forEach((p, i) => p.classList.toggle('is-on',
    targets[i] === route || (!exact && targets[i] === focusArea)));

  mapEl.classList.toggle('is-deep', !!focusArea);

  /* Entrando in un'area la camera si porta a guardarla di fronte, cosi' il
     ventaglio si apre verso chi guarda invece che di taglio. */
  if(focusArea && !reduce.matches){
    cam.taz = byId(focusArea).bearing - Math.PI / 2;
    cam.tel = 0.52;
  }

  layout(false); drawMini();
  window.scrollTo(0, 0);
}
addEventListener('hashchange', go);

/* ==========================================================================
   17. Lingua e tema
   ========================================================================== */
const store = (k, v) => {
  try { if(v !== undefined) localStorage.setItem('ff.' + k, v); return localStorage.getItem('ff.' + k); }
  catch(e){ return null; }
};

function repaintTheme(){
  stars.material.color.set(inkHex());
  buildGrid();
  drawMini();
}

document.getElementById('lang').addEventListener('click', () => {
  const l = lang() === 'it' ? 'en' : 'it';
  html.dataset.lang = l; html.lang = l; store('lang', l);
  labelText(); legend();
});
document.getElementById('theme').addEventListener('click', () => {
  const t = html.dataset.theme === 'dark' ? 'light' : 'dark';
  html.dataset.theme = t; store('theme', t);
  repaintTheme();
});

/* Preferenze ritrovate; alla prima visita il tema segue il sistema. */
(function init(){
  const l = store('lang'); if(l === 'it' || l === 'en'){ html.dataset.lang = l; html.lang = l; }
  const t = store('theme');
  html.dataset.theme = (t === 'light' || t === 'dark') ? t
    : (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
})();

/* ==========================================================================
   18. Avvio
   ========================================================================== */
/* Il browser ripristina lo scorrimento dopo il load, quindi ricaricare con un
   hash profondo — per esempio #/iceroute — atterrava a meta' del flagship,
   dopo che go() aveva gia' riportato la pagina in cima. */
if('scrollRestoration' in history) history.scrollRestoration = 'manual';

addEventListener('resize', resize);
reduce.addEventListener?.('change', () => layout(true));

repaintTheme();
labelText();
resize();
legend();
go();
placeCamera();
start();

