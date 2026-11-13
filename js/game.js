(function () {
'use strict';
let W = 400; const H = 225, T = 16;
const $ = id => document.getElementById(id);
const cv = $('cv'), ctx = cv.getContext('2d');
ctx.imageSmoothingEnabled = false;
const AU = window.GAUDIO, SPR = window.SPRITES, LV = window.LEVELS;

/* ---------------------------------------------------------------- sprites */
const sprCache = {};
function hex(c) { c = c.replace('#', ''); return [parseInt(c.substr(0, 2), 16), parseInt(c.substr(2, 2), 16), parseInt(c.substr(4, 2), 16)]; }
function makeCanvas(rows, tint, key) {
  const w = Math.max.apply(null, rows.map(r => r.length)) || 1, h = rows.length || 1;
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d');
  for (let y = 0; y < rows.length; y++) for (let x = 0; x < rows[y].length; x++) {
    const ch = rows[y][x]; if (ch === '.') continue;
    const col = (tint && tint[ch]) || SPR.PAL[ch]; if (!col) continue;
    g.fillStyle = col; g.fillRect(x, y, 1, 1);
  }
  return c;
}
function sprite(name, frame, tint, tkey) {
  const key = name + '|' + (frame || 'A') + '|' + (tkey || '');
  if (sprCache[key]) return sprCache[key];
  const d = SPR.S[name]; const f = frame || 'A';
  let legs = d['legs' + (f === 'J' ? 'J' : f === 'B' ? 'B' : 'A')] || [];
  const rows = d.body.concat(legs);
  return sprCache[key] = makeCanvas(rows, tint, key);
}
function beeFrame(f) {
  const key = 'bee|' + f; if (sprCache[key]) return sprCache[key];
  let rows = SPR.S.bee.body.slice();
  if (f) rows = rows.map((r, i) => i === 1 || i === 2 ? r.replace(/t/g, '.') : r);
  return sprCache[key] = makeCanvas(rows);
}
const THORN_TINT = { v: '#7a5230', V: '#a8793f', e: '#1a1010', x: '#5a2a1a' };
function iconURL(name, scale, frame) {
  const c = sprite(name, frame || 'A'); const o = document.createElement('canvas');
  o.width = c.width * scale; o.height = c.height * scale; const g = o.getContext('2d'); g.imageSmoothingEnabled = false;
  g.drawImage(c, 0, 0, o.width, o.height); return o.toDataURL();
}
function drawSpr(c, x, y, flip, scale, alpha) {
  scale = scale || 1;
  if (alpha !== undefined && alpha < 1) ctx.globalAlpha = alpha;
  if (flip) {
    ctx.save(); ctx.translate(Math.round(x) + c.width * scale, Math.round(y)); ctx.scale(-1, 1);
    ctx.drawImage(c, 0, 0, c.width * scale, c.height * scale); ctx.restore();
  } else ctx.drawImage(c, Math.round(x), Math.round(y), c.width * scale, c.height * scale);
  ctx.globalAlpha = 1;
}

/* boss cloud: sprite body + face drawn in code, colours lighten with mood */
function lerpCol(a, b, t) { const A = hex(a), B = hex(b); return '#' + [0, 1, 2].map(i => Math.round(A[i] + (B[i] - A[i]) * t).toString(16).padStart(2, '0')).join(''); }
function bossCanvas(mood) {
  const key = 'boss' + mood; if (sprCache[key]) return sprCache[key];
  const t = Math.min(1, mood / 5);
  const tint = { z: lerpCol('#3c3c5a', '#bcd0ea', t), Z: lerpCol('#5a5a80', '#eef5fc', t), o: lerpCol('#25253a', '#6d84b0', t) };
  const c = makeCanvas(SPR.S.boss.body, tint); const g = c.getContext('2d');
  const px = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w || 1, h || 1); };
  const ink = '#1c1c2a';
  // eyes
  px(7, 8, 5, 5, '#fff'); px(20, 8, 5, 5, '#fff');
  const look = mood >= 4 ? 0 : 1;
  px(9 + look, 10, 2, 3, ink); px(22 + look - 1, 10, 2, 3, ink);
  if (mood >= 5) { px(8, 9, 3, 1, '#fff'); px(9, 11, 2, 1, ink); px(23, 11, 2, 1, ink); }
  // brows
  if (mood <= 1) { [[6, 5], [7, 6], [8, 6], [9, 7], [10, 7]].forEach(p => px(p[0], p[1], 1, 1, ink)); [[26, 5], [25, 6], [24, 6], [23, 7], [22, 7]].forEach(p => px(p[0], p[1], 1, 1, ink)); }
  else if (mood <= 3) { px(7, 6, 5, 1, ink); px(20, 6, 5, 1, ink); }
  else { [[7, 6], [8, 5], [9, 5], [10, 5], [11, 6]].forEach(p => px(p[0], p[1], 1, 1, ink)); [[20, 6], [21, 5], [22, 5], [23, 5], [24, 6]].forEach(p => px(p[0], p[1], 1, 1, ink)); }
  // mouth
  if (mood <= 1) { px(12, 15, 1, 1, ink); px(13, 14, 6, 1, ink); px(19, 15, 1, 1, ink); }
  else if (mood <= 3) { px(12, 14, 8, 1, ink); }
  else { px(11, 13, 1, 1, ink); px(12, 14, 1, 1, ink); px(13, 15, 6, 1, ink); px(19, 14, 1, 1, ink); px(20, 13, 1, 1, ink);
    if (mood >= 5) { px(14, 14, 4, 1, '#fff'); px(5, 12, 2, 2, '#ffb0c0'); px(25, 12, 2, 2, '#ffb0c0'); } }
  return sprCache[key] = c;
}

/* ---------------------------------------------------------------- characters */
const CH = {
  timosha: { name: 'Тимоша', spr: 'timosha' }, pushok: { name: 'Пушок', spr: 'pushok' }, iriska: { name: 'Ириска', spr: 'iriska' },
  tisha: { name: 'Тиша', spr: 'tisha' }, toptyzhka: { name: 'Топтыжка', spr: 'toptyzhka' }, chik: { name: 'Чик', spr: 'chik' },
  mama: { name: 'Мама-синичка', spr: 'mama' }, boss: { name: 'Ворчун-Туча', spr: 'boss' }, sys: { name: 'Подсказка', spr: 'acorn' },
};
const FRIEND_ORDER = ['pushok', 'iriska', 'tisha', 'toptyzhka', 'chik'];

/* ---------------------------------------------------------------- themes */
const THEMES = {
  birch:  { sky: ['#8fd0f0', '#e6f6df'], hills: [['#b5e0a0', .15, 22, .010, 150], ['#8ccb78', .3, 26, .018, 164]], deco: 'birch', grass: '#6cc04a', grassD: '#4b9a38', dirt: '#8a5a2a', dirtD: '#6e4520', sun: true },
  meadow: { sky: ['#7cc8f2', '#fff1c8'], hills: [['#c1e5a2', .15, 24, .008, 148], ['#9bd47d', .3, 22, .016, 166]], deco: 'flowers', grass: '#7ccc4a', grassD: '#58a238', dirt: '#92622e', dirtD: '#734a22', sun: true },
  stream: { sky: ['#78bfe8', '#e3f4ff'], hills: [['#9ccfc0', .15, 26, .009, 150], ['#6fb8a0', .3, 24, .015, 166]], deco: 'reeds', grass: '#5fb85a', grassD: '#3f9248', dirt: '#7a6a58', dirtD: '#5e5040', sun: true, water: true },
  berry:  { sky: ['#ffb08c', '#ffe9b8'], hills: [['#d6a5b8', .15, 26, .009, 146], ['#9cbc72', .3, 24, .017, 166]], deco: 'berry', grass: '#79b84a', grassD: '#58903a', dirt: '#85502a', dirtD: '#693c1e', sun: true },
  dusk:   { sky: ['#4a3f8a', '#f5966b'], hills: [['#5a5a9a', .15, 26, .009, 148], ['#3f6f78', .3, 24, .016, 166]], deco: 'pine', grass: '#3f9a8a', grassD: '#2d7468', dirt: '#5a4458', dirtD: '#463444', stars: true, water: true },
  storm:  { sky: ['#3a3a5a', '#7a7a9e'], hills: [['#52586f', .15, 24, .009, 150], ['#3e5a52', .3, 24, .016, 166]], deco: 'pine', grass: '#4f9a4a', grassD: '#3a7a3a', dirt: '#6a4a2a', dirtD: '#523820' },
  sunny:  { sky: ['#7cc8f2', '#fff1c8'], hills: [['#c1e5a2', .15, 24, .008, 148], ['#9bd47d', .3, 22, .016, 166]], deco: 'flowers', grass: '#7ccc4a', grassD: '#58a238', dirt: '#92622e', dirtD: '#734a22' },
};
function hash(n) { n = (n ^ 61) ^ (n >>> 16); n = n + (n << 3); n = n ^ (n >>> 4); n = Math.imul(n, 0x27d4eb2d); n = n ^ (n >>> 15); return (n >>> 0) / 4294967296; }

const tileCache = {};
function tileCanvas(kind, th, variant) {
  const key = kind + th.grass + variant; if (tileCache[key]) return tileCache[key];
  const c = document.createElement('canvas'); c.width = c.height = T; const g = c.getContext('2d');
  const r = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
  if (kind === 'dirt' || kind === 'grass') {
    r(0, 0, T, T, th.dirt);
    for (let i = 0; i < 9; i++) r(Math.floor(hash(variant * 31 + i) * 14), 4 + Math.floor(hash(variant * 17 + i * 3) * 11), 2, 1, th.dirtD);
    r(Math.floor(hash(variant) * 12), 8 + (variant % 5), 3, 2, th.dirtD);
    if (kind === 'grass') {
      r(0, 0, T, 4, th.grass); r(0, 4, T, 1, th.grassD);
      for (let x = 0; x < T; x += 2) { if (hash(variant * 7 + x) > .4) r(x, 4, 2, 2 + (hash(x + variant) > .5 ? 1 : 0), th.grass); }
      r(0, 0, T, 1, lerpCol(th.grass, '#ffffff', .25));
    }
  } else if (kind === 'wood') {
    r(0, 0, T, T, '#a9743a'); r(0, 0, T, 3, '#d9a05a'); r(0, 3, T, 1, '#6e4520'); r(0, T - 2, T, 2, '#6e4520');
    for (let x = 3; x < T; x += 5) r(x, 6, 1, 6, '#8a5a2a');
  } else if (kind === 'branch') {
    r(0, 0, T, 4, '#9a6a34'); r(0, 0, T, 1, '#c99250'); r(0, 4, T, 1, '#5a3a1a');
    r(3, 4, 1, 2, '#4f9a4a'); r(9, 4, 1, 3, '#4f9a4a'); r(12, 4, 2, 2, '#7ccc4a');
  }
  return tileCache[key] = c;
}

/* ---------------------------------------------------------------- state */
let G = null;               // current level state
let mode = 'title';         // title select intro play dialogue paused complete over ending
let save = { unlocked: 0, best: {}, mute: false, done: false };
try { const s = JSON.parse(localStorage.getItem('timosha_v1') || 'null'); if (s) save = Object.assign(save, s); } catch (e) {}
function persist() { try { localStorage.setItem('timosha_v1', JSON.stringify(save)); } catch (e) {} }
AU.muted = !!save.mute;
const input = { left: false, right: false, jumpHeld: false, jumpPressed: false, advance: false };
let frame = 0, menuT = 0;
const shake = { t: 0, a: 0 };

/* ---------------------------------------------------------------- level setup */
function overlap(a, b) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }
function friendsFor(i) { return FRIEND_ORDER.slice(0, Math.min(i, 5)); }

function startLevel(i) {
  const L = LV[i], map = window.buildLevel(i);
  const fr = friendsFor(i);
  const maxHearts = 3 + (fr.indexOf('toptyzhka') >= 0 ? 1 : 0);
  G = {
    i, L, map, friends: fr, maxHearts, hearts: maxHearts, acorns: 0, totalAcorns: map.items.filter(t => t.k === 'acorn').length + map.ents.filter(e => e.k === 'bush' || e.k === 'bee' || e.k === 'crow').length * 0,
    perks: { dbl: fr.indexOf('pushok') >= 0, glide: fr.indexOf('iriska') >= 0, shield: fr.indexOf('tisha') >= 0, magnet: fr.indexOf('chik') >= 0 },
    shield: fr.indexOf('tisha') >= 0, theme: THEMES[L.theme], cam: 0, camMin: 0, leftWall: 0, time: 0,
    p: { x: map.spawn.x * T, y: map.spawn.y * T + 0, w: 10, h: 17, vx: 0, vy: 0, face: 1, onGround: false, coyote: 0, buf: 0, dbl: true, inv: 0, anim: 0, dead: 0, gliding: false },
    hist: [], enemies: [], items: [], flowers: [], mush: [], drops: [], parts: [], goal: null, trigs: [], hints: [], boss: null,
    skyMix: 0, ending: false, bossWon: false,
  };
  const p = G.p; p.y = (map.spawn.y + 1) * T - p.h; p.x = map.spawn.x * T + 3;
  G.checkpoint = { x: p.x, y: p.y };
  map.items.forEach(it => G.items.push({ k: it.k, x: it.x * T + 4, y: it.y * T + 4, w: 8, h: 8, got: false, t: Math.random() * 6 }));
  map.flowers.forEach(f => G.flowers.push({ x: f.x * T, y: f.y * T, lit: false }));
  map.mush.forEach(m => G.mush.push({ x: m.x * T, y: m.y * T, sq: 0 }));
  map.ents.forEach(e => G.enemies.push(makeEnemy(e)));
  if (map.goal && L.friend) G.goal = { x: map.goal.x * T, y: (map.goal.y + 1) * T, done: false };
  L.triggers.forEach(t => G.trigs.push({ x: Math.round(t.at * map.w) * T, lines: t.lines, done: false }));
  (L.hints || []).forEach(h => G.hints.push({ x: h.x * T, text: h.text }));
  G.totalAcorns = G.items.filter(t => t.k === 'acorn').length;
  if (L.boss) { G.boss = { active: false, x: 0, y: -70, w: 64, h: 38, mood: 0, phase: 'idle', t: 0, dropT: 0, shake: 0, inv: 0, cx: (map.arenaX + 15) * T }; }
  G.lvlWidth = map.w * T;
  hideAllScreens(); updateHUD(); $('lvlname').textContent = (i + 1) + '. ' + L.name; $('lvlname').style.display = L.boss ? 'none' : '';
  AU.music(L.music, L.tr);
  // intro card
  mode = 'intro'; $('introNum').textContent = 'Уровень ' + (i + 1); $('introName').textContent = L.name; $('introEn').textContent = L.en;
  show('sIntro'); setHUD(false); setControls(true);
  const myG = G;
  setTimeout(() => { if (G === myG && mode === 'intro') { hide('sIntro'); setHUD(true); startDialogue(L.intro, () => { mode = 'play'; }); } }, 1700);
}

function makeEnemy(e) {
  const k = e.k;
  if (k === 'bush' || k === 'thorn') return { k, x: e.x * T + 1, y: (e.y + 1) * T - 9, w: 14, h: 9, vx: k === 'bush' ? 0.4 : 0, dir: Math.random() < .5 ? 1 : -1, a: e.a ? e.a * T : 0, b: e.b ? (e.b + 1) * T : 1e9, alive: true, calm: 0, stomp: k === 'bush', t: 0 };
  if (k === 'bee') return { k, x: e.x * T, y: e.y * T, y0: e.y * T, x0: e.x * T, w: 12, h: 8, dir: 1, alive: true, calm: 0, stomp: true, t: Math.random() * 6 };
  return { k: 'crow', x: e.x * T, y: e.y * T, y0: e.y * T, x0: e.x * T, w: 12, h: 8, dir: 1, alive: true, calm: 0, stomp: true, t: 0, st: 'fly', cd: 60 };
}

/* ---------------------------------------------------------------- map helpers */
function tileAt(tx, ty) {
  const m = G.map;
  if (tx < 0 || tx >= m.w) return '#';
  if (ty < 0 || ty >= m.h) return '.';
  return m.t[ty][tx];
}
const solid = (tx, ty) => { const c = tileAt(tx, ty); return c === '#' || c === '='; };

/* ---------------------------------------------------------------- effects */
function burst(x, y, n, cols, kind, spd) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, s = (spd || 1.6) * (0.4 + Math.random());
    G.parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 0.8, life: 28 + Math.random() * 18, max: 46, c: cols[i % cols.length], kind: kind || 'sq' });
  }
}
function floatHeart(x, y) { G.parts.push({ x, y, vx: (Math.random() - .5) * .4, vy: -0.6, life: 50, max: 50, c: '#ff6f91', kind: 'heart' }); }

/* ---------------------------------------------------------------- player */
const SPEED = 1.75, ACC = 0.22, GRAV = 0.36, JUMP = 6.3, MAXFALL = 7.5;
function hurtPlayer(srcX) {
  const p = G.p; if (p.inv > 0 || p.dead || mode !== 'play') return;
  if (G.shield) { G.shield = false; p.inv = 70; AU.sfx('shield'); burst(p.x + 5, p.y + 8, 10, ['#b0e0ff', '#fff'], 'sq', 2); return; }
  G.hearts--; p.inv = 100; AU.sfx('hit'); shake.t = 10; shake.a = 2;
  p.vy = -4; p.vx = (p.x + 5 < srcX ? -1 : 1) * 2.4;
  burst(p.x + 5, p.y + 8, 8, ['#ffd23f', '#fff'], 'sq', 1.8);
  updateHUD();
  if (G.hearts <= 0) { p.dead = 1; }
}
function fallPlayer() {
  const p = G.p; if (p.dead) return;
  AU.sfx('drop'); G.hearts--; updateHUD();
  if (G.hearts <= 0) { p.dead = 1; p.y = G.map.h * T + 40; return; }
  p.x = G.checkpoint.x; p.y = G.checkpoint.y; p.vx = p.vy = 0; p.inv = 110; AU.sfx('hit');
}

function updatePlayer() {
  const p = G.p, map = G.map;
  if (p.dead) {
    p.dead++; p.vy += GRAV; p.y += p.vy; p.x += p.vx;
    if (p.dead === 2) { p.vy = -5; AU.music(null); AU.sfx('lose'); }
    if (p.dead > 95) { gameOver(); }
    return;
  }
  const dir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  const target = dir * SPEED;
  if (p.inv > 80) { /* knockback phase */ } else {
    p.vx += (target - p.vx) * (p.onGround ? ACC + 0.1 : ACC);
    if (!dir && p.onGround) p.vx *= 0.72;
  }
  if (dir) p.face = dir;
  if (Math.abs(p.vx) < 0.02) p.vx = 0;
  // jump
  if (p.onGround) { p.coyote = 6; p.dbl = true; } else if (p.coyote > 0) p.coyote--;
  if (input.jumpPressed) p.buf = 7; else if (p.buf > 0) p.buf--;
  if (p.buf > 0 && p.coyote > 0) { p.vy = -JUMP; p.coyote = 0; p.buf = 0; p.onGround = false; AU.sfx('jump'); burst(p.x + 5, p.y + 17, 3, ['#fff'], 'sq', .8); }
  else if (input.jumpPressed && !p.onGround && p.coyote <= 0 && G.perks.dbl && p.dbl) { p.vy = -5.7; p.dbl = false; p.buf = 0; AU.sfx('jump2'); burst(p.x + 5, p.y + 17, 6, ['#fff', '#cfe9ff'], 'sq', 1.2); }
  if (!input.jumpHeld && p.vy < -2.4) p.vy *= 0.55;
  // gravity (glide with Iriska)
  p.gliding = false;
  p.vy += GRAV;
  if (G.perks.glide && input.jumpHeld && p.vy > 0.9 && !p.onGround && p.coyote <= 0) { p.vy = 0.9; p.gliding = true; }
  if (p.vy > MAXFALL) p.vy = MAXFALL;
  // move X
  p.x += p.vx;
  const top = Math.floor(p.y / T), bot = Math.floor((p.y + p.h - 0.01) / T);
  if (p.vx > 0) { const tx = Math.floor((p.x + p.w) / T); for (let ty = top; ty <= bot; ty++) if (solid(tx, ty)) { p.x = tx * T - p.w; p.vx = 0; break; } }
  else if (p.vx < 0) { const tx = Math.floor(p.x / T); for (let ty = top; ty <= bot; ty++) if (solid(tx, ty)) { p.x = (tx + 1) * T; p.vx = 0; break; } }
  if (p.x < G.leftWall) { p.x = G.leftWall; p.vx = 0; }
  if (p.x + p.w > G.lvlWidth) { p.x = G.lvlWidth - p.w; p.vx = 0; }
  // move Y
  const prevBottom = p.y + p.h;
  p.y += p.vy; p.onGround = false;
  const l = Math.floor(p.x / T), r = Math.floor((p.x + p.w - 0.01) / T);
  if (p.vy >= 0) {
    const ty = Math.floor((p.y + p.h) / T);
    for (let tx = l; tx <= r; tx++) {
      const c = tileAt(tx, ty);
      if (c === '#' || c === '=' || (c === '-' && prevBottom <= ty * T + 0.5 && !(input.down))) { p.y = ty * T - p.h; p.vy = 0; p.onGround = true; break; }
    }
  } else {
    const ty = Math.floor(p.y / T);
    for (let tx = l; tx <= r; tx++) if (solid(tx, ty)) { p.y = (ty + 1) * T; p.vy = 0; break; }
  }
  if (p.y > G.map.h * T + 24) fallPlayer();
  if (p.inv > 0) p.inv--;
  p.anim += Math.abs(p.vx) * 0.12;
  // history for companions
  G.hist.unshift({ x: p.x + 5, y: p.y + p.h, f: p.face, air: !p.onGround, mv: Math.abs(p.vx) > 0.3 });
  if (G.hist.length > 90) G.hist.pop();
}

/* ---------------------------------------------------------------- enemies */
function calmEnemy(e) {
  e.alive = false; e.calm = 1; AU.sfx('stomp');
  burst(e.x + e.w / 2, e.y + e.h / 2, 6, ['#fff', '#ffe36b'], 'sq', 1.5);
  for (let i = 0; i < 3; i++) floatHeart(e.x + 2 + Math.random() * (e.w - 4), e.y);
  G.items.push({ k: 'acorn', x: e.x + e.w / 2 - 4, y: e.y - 4, w: 8, h: 8, got: false, t: 0, pop: -2.5, py: e.y - 4 });
}
function updateEnemies() {
  const p = G.p;
  for (const e of G.enemies) {
    if (!e.alive) { if (e.calm) { e.calm++; } continue; }
    e.t++;
    if (e.k === 'bush') {
      const nx = e.x + e.vx * e.dir, fx = e.dir > 0 ? nx + e.w : nx;
      const tx = Math.floor(fx / T), ty = Math.floor((e.y + e.h - 1) / T);
      if (solid(tx, ty) || !solid(tx, ty + 1) || nx < e.a || nx + e.w > e.b) e.dir *= -1; else e.x = nx;
    } else if (e.k === 'bee') {
      e.x += 0.55 * e.dir; e.y = e.y0 + Math.sin(e.t * 0.06) * 12;
      if (Math.abs(e.x - e.x0) > 44) e.dir *= -1;
    } else if (e.k === 'crow') {
      if (e.st === 'fly') {
        e.x += 0.5 * e.dir; e.y = e.y0 + Math.sin(e.t * 0.05) * 5;
        if (Math.abs(e.x - e.x0) > 40) e.dir *= -1;
        if (e.cd > 0) e.cd--;
        if (e.cd <= 0 && Math.abs(p.x - e.x) < 80 && p.y > e.y + 20 && !p.dead) { e.st = 'dive'; e.tx = p.x; e.ty = p.y; e.dt = 0; AU.sfx('drop'); }
      } else if (e.st === 'dive') {
        const dx = e.tx - e.x, dy = e.ty - e.y, d = Math.hypot(dx, dy) || 1;
        e.x += dx / d * 1.9; e.y += dy / d * 1.9; e.dir = dx > 0 ? 1 : -1; e.dt++;
        if (d < 4 || e.dt > 70) { e.st = 'back'; }
      } else { // back
        const dx = e.x0 - e.x, dy = e.y0 - e.y, d = Math.hypot(dx, dy) || 1;
        e.x += dx / d * 1.2; e.y += dy / d * 1.2; if (d < 3) { e.st = 'fly'; e.cd = 140; }
      }
    }
    if (!p.dead && overlap(p, e)) {
      if (e.stomp && p.vy > 0.3 && (p.y + p.h) - e.y < 11) { calmEnemy(e); p.vy = input.jumpHeld ? -7 : -4.6; p.dbl = true; }
      else hurtPlayer(e.x + e.w / 2);
    }
  }
}

/* ---------------------------------------------------------------- items / world */
function updateItems() {
  const p = G.p;
  for (const it of G.items) {
    if (it.got) continue;
    it.t += 0.1;
    if (it.pop !== undefined) { it.pop += 0.18; it.y += it.pop; if (it.pop > 0 && it.y >= it.py) { it.y = it.py; delete it.pop; } }
    if (G.perks.magnet && it.k === 'acorn' && !p.dead) {
      const dx = p.x + 5 - (it.x + 4), dy = p.y + 8 - (it.y + 4), d = Math.hypot(dx, dy);
      if (d < 42 && d > 1) { it.x += dx / d * 2.2; it.y += dy / d * 2.2; delete it.pop; }
    }
    if (!p.dead && overlap(p, it)) {
      it.got = true;
      if (it.k === 'acorn') { G.acorns++; AU.sfx('collect'); burst(it.x + 4, it.y + 4, 5, ['#ffd23f', '#fff3a0'], 'sq', 1.1); }
      else { if (G.hearts < G.maxHearts) G.hearts++; else G.acorns += 3; AU.sfx('heart'); burst(it.x + 4, it.y + 4, 8, ['#ff6f91', '#fff'], 'heart', 1.2); }
      updateHUD();
    }
  }
  for (const f of G.flowers) {
    if (!f.lit && p.x + 5 >= f.x + 4 && p.x < f.x + 40) {
      f.lit = true; G.checkpoint = { x: f.x, y: f.y + T - p.h }; AU.sfx('check'); burst(f.x + 8, f.y + 4, 8, ['#ffd23f', '#ff9ac0', '#fff'], 'sq', 1.4);
      if (G.perks.shield) G.shield = true;
    }
  }
  for (const m of G.mush) {
    if (m.sq > 0) m.sq--;
    const r = { x: m.x + 1, y: m.y + 5, w: 14, h: 11 };
    if (!G.p.dead && p.vy > 0 && overlap(p, r) && (p.y + p.h) - p.vy <= r.y + 6) {
      p.vy = -9.6; m.sq = 12; p.onGround = false; p.dbl = true; AU.sfx('spring'); burst(m.x + 8, m.y + 6, 6, ['#fff', '#ff6f91'], 'sq', 1.4);
    }
  }
  for (const pt of G.parts) { pt.x += pt.vx; pt.y += pt.vy; if (pt.kind !== 'heart') pt.vy += 0.07; pt.life--; }
  G.parts = G.parts.filter(pt => pt.life > 0);
}

/* ---------------------------------------------------------------- boss */
function startBoss() {
  const b = G.boss; b.active = true; b.phase = 'enter'; b.x = b.cx - 32; b.y = -60; b.t = 0;
  G.leftWall = G.map.arenaX * T; G.camMin = G.leftWall;
  AU.music('boss', 0); $('bossbar').classList.remove('hidden'); updatePips();
}
function updatePips() {
  const el = $('pips'); el.innerHTML = '';
  for (let i = 0; i < 5; i++) { const b = document.createElement('b'); if (i < G.boss.mood) b.className = 'on'; el.appendChild(b); }
}
function updateBoss() {
  const b = G.boss, p = G.p; if (!b || !b.active) return;
  b.t++;
  const ground = 11 * T;
  const speedUp = 1 + b.mood * 0.12;
  switch (b.phase) {
    case 'enter': b.y += 1.6; if (b.y >= 26) { b.y = 26; b.phase = 'hover'; b.t = 0; } break;
    case 'hover': {
      b.x = b.cx - 32 + Math.sin(b.t * 0.028 * speedUp) * 150; b.y = 26 + Math.sin(b.t * 0.08) * 4;
      b.dropT++; if (b.dropT >= Math.max(30, 54 - b.mood * 5)) { b.dropT = 0; G.drops.push({ x: b.x + 14 + Math.random() * 36, y: b.y + 34, vy: 1.1 + Math.random() * .35 }); AU.sfx('drop'); }
      if (b.t > 210 - b.mood * 12) { b.phase = 'aim'; b.t = 0; }
    } break;
    case 'aim': {
      b.x += (p.x - 27 - b.x) * 0.06; b.shake = (b.t % 4 < 2) ? 1 : -1;
      if (b.t > 55) { b.phase = 'dive'; b.t = 0; b.vy = 0; b.shake = 0; }
    } break;
    case 'dive': {
      b.vy = Math.min(b.vy + 0.25, 5.2); b.y += b.vy;
      if (b.y + b.h >= ground) { b.y = ground - b.h; b.phase = 'rest'; b.t = 0; AU.sfx('boom'); shake.t = 16; shake.a = 3; burst(b.x + 32, ground - 2, 12, ['#fff', '#cfd6ea'], 'sq', 2.4); }
    } break;
    case 'rest': if (b.t > 120) { b.phase = 'rise'; b.t = 0; } break;
    case 'rise': b.y -= 2.2; if (b.y <= 26) { b.y = 26; b.phase = 'hover'; b.t = 0; b.dropT = 0; } break;
    case 'hurt': b.y -= 2.6; if (b.t > 40 || b.y <= 26) { if (b.y < 26) b.y = 26; b.phase = 'hover'; b.t = 0; } break;
    case 'won': {
      b.y = 26 + Math.sin(b.t * 0.05) * 4; b.x += (b.cx - 32 - b.x) * 0.04;
      if (b.t % 6 === 0) G.parts.push({ x: b.x + 10 + Math.random() * 44, y: b.y + 30, vx: (Math.random() - .5) * .3, vy: 1.2, life: 90, max: 90, c: ['#ff6f91', '#ffd23f', '#7ccc4a', '#6fb0ff'][Math.floor(Math.random() * 4)], kind: 'sq' });
      G.skyMix = Math.min(1, G.skyMix + 0.01);
      if (b.t === 150) { finishBoss(G); }
    } break;
  }
  if (b.phase !== 'won') G.skyMix += ((b.mood / 5) - G.skyMix) * 0.02;
  // drops
  for (const d of G.drops) {
    d.y += d.vy;
    if (d.y >= ground - 7) { d.dead = true; burst(d.x, ground - 2, 3, ['#8fb8f0', '#fff'], 'sq', .8); }
    else if (!p.dead && overlap(p, { x: d.x - 2, y: d.y, w: 5, h: 7 })) { d.dead = true; hurtPlayer(d.x); }
  }
  G.drops = G.drops.filter(d => !d.dead);
  // collision with hero
  if (b.phase === 'dive' || b.phase === 'rest' || b.phase === 'aim' || b.phase === 'hover') {
    const hb = { x: b.x + 6, y: b.y + 6, w: b.w - 12, h: b.h - 8 };
    if (!p.dead && overlap(p, hb)) {
      const vuln = (b.phase === 'dive' || b.phase === 'rest');
      if (vuln && p.vy > 0.2 && (p.y + p.h) - hb.y < 14) {
        b.mood++; p.vy = -7; p.dbl = true; AU.sfx('stomp'); AU.sfx('check'); shake.t = 12; shake.a = 2;
        burst(b.x + 32, b.y + 6, 14, ['#fff', '#ffe36b', '#ff9ac0'], 'heart', 2);
        updatePips();
        if (b.mood === 2 || b.mood === 4) G.items.push({ k: 'heart', x: b.cx - 4, y: 130, w: 8, h: 8, got: false, t: 0 });
        if (b.mood >= 5) { b.phase = 'won'; b.t = 0; G.drops = []; AU.music(null); AU.sfx('friend'); G.bossWon = true; }
        else { b.phase = 'hurt'; b.t = 0; }
      } else hurtPlayer(b.x + 32);
    }
  }
}
function finishBoss(g) {
  if (G !== g || mode !== 'play') return;
  AU.music('calm', 0);
  startDialogue(g.L.bossWin, () => { endGame(); });
}

/* ---------------------------------------------------------------- triggers */
function updateTriggers() {
  const p = G.p;
  for (const t of G.trigs) if (!t.done && p.x > t.x) { t.done = true; startDialogue(t.lines, () => { mode = 'play'; }); return; }
  let hint = null;
  for (const h of G.hints) if (Math.abs(p.x - h.x) < 70) hint = h;
  const el = $('hint');
  if (hint) { if (el.textContent !== hint.text) el.textContent = hint.text; el.classList.remove('hidden'); } else el.classList.add('hidden');
  if (G.goal && !G.goal.done && p.x + 5 > G.goal.x - 18 && !p.dead) {
    G.goal.done = true; $('hint').classList.add('hidden'); AU.sfx('friend');
    startDialogue(G.L.outro, () => completeLevel());
    return;
  }
  if (G.boss && !G.boss.active && !G.boss.done && p.x > G.map.arenaX * T + 50) {
    G.boss.done = true; $('hint').classList.add('hidden'); G.leftWall = G.map.arenaX * T; G.camMin = G.leftWall;
    AU.music(null);
    startDialogue(G.L.bossIntro, () => { mode = 'play'; startBoss(); });
  }
}

/* ---------------------------------------------------------------- game flow */
function completeLevel() {
  mode = 'complete'; AU.music('win', 0); AU.sfx('win');
  const i = G.i; save.unlocked = Math.max(save.unlocked, Math.min(i + 1, LV.length - 1));
  save.best[i] = Math.max(save.best[i] || 0, G.acorns); persist();
  $('cSummary').innerHTML = '<img src="' + iconURL('acorn', 4) + '"> ' + G.acorns + ' / ' + G.totalAcorns + ' желудей';
  const f = LV[i].friend; $('cFriend').textContent = CH[f] ? 'Новый друг: ' + CH[f].name + '!' : '';
  setHUD(false); show('sComplete');
}
function gameOver() { mode = 'over'; setHUD(false); $('hint').classList.add('hidden'); $('bossbar').classList.add('hidden'); show('sOver'); }
function endGame() {
  mode = 'ending'; save.done = true; save.unlocked = LV.length - 1; save.best[5] = Math.max(save.best[5] || 0, G.acorns); persist();
  hideAllScreens(); setHUD(false); setControls(false);
  $('endWords').innerHTML = window.WORDS_END.map(w => '<span>' + w[0] + ' — ' + w[1] + '</span>').join('');
  show('sEnd'); AU.music('happy', 0); AU.sfx('win');
}

/* ---------------------------------------------------------------- dialogue */
let DL = null;
function parseText(s) { const out = []; const re = /\[\[(.+?)\]\]/g; let last = 0, m; while ((m = re.exec(s))) { if (m.index > last) out.push({ t: s.slice(last, m.index) }); out.push({ t: m[1], en: true }); last = re.lastIndex; } if (last < s.length) out.push({ t: s.slice(last) }); return out; }
function renderDl(n) {
  let html = '', left = n;
  for (const seg of DL.segs) { if (left <= 0) break; const part = seg.t.slice(0, left); left -= seg.t.length; html += seg.en ? '<span class="en">' + part + '</span>' : part; }
  $('dtext').innerHTML = html;
}
function startDialogue(lines, done) {
  if (!lines || !lines.length) { mode = 'play'; done && done(); return; }
  mode = 'dialogue'; DL = { lines, i: -1, done, n: 0, total: 0, segs: [], full: false };
  input.left = input.right = false; resetTouch();
  $('dlg').classList.remove('hidden'); nextLine();
}
function nextLine() {
  DL.i++;
  if (DL.i >= DL.lines.length) { $('dlg').classList.add('hidden'); const d = DL.done; DL = null; mode = 'play'; d && d(); return; }
  const ln = DL.lines[DL.i], ch = CH[ln.who] || CH.sys;
  $('dname').textContent = ch.name; $('dname').style.color = ln.who === 'sys' ? '#9be37a' : ln.who === 'boss' ? '#b9b9ff' : '#ffd23f';
  DL.segs = parseText(ln.text); DL.total = DL.segs.reduce((a, s) => a + s.t.length, 0); DL.n = 0; DL.full = false;
  $('dword').textContent = ln.word ? ln.word[0] + ' — ' + ln.word[1] + '  ' + ln.word[2] : '';
  $('dword').style.display = 'none';
  const pc = $('portrait'), pg = pc.getContext('2d'); pg.imageSmoothingEnabled = false; pg.clearRect(0, 0, pc.width, pc.height);
  pg.fillStyle = ln.who === 'boss' ? '#6a6a8a' : ln.who === 'sys' ? '#2d4a6e' : '#cfe9ff'; pg.fillRect(0, 0, pc.width, pc.height);
  let c;
  if (ln.who === 'boss') c = bossCanvas(G && G.boss ? Math.min(G.boss.mood, 5) : (DL.i >= 1 && G && G.bossWon ? 5 : 0)); else c = sprite(ch.spr, 'A');
  const sc = ln.who === 'boss' ? 1.4 : Math.min(Math.floor(40 / Math.max(c.width, c.height)) || 1, 3);
  const w = c.width * sc, h = c.height * sc;
  pg.drawImage(c, Math.round((pc.width - w) / 2), Math.round(pc.height - h - 3), Math.round(w), Math.round(h));
  renderDl(0);
  AU.sfx('select');
}
function advanceDialogue() {
  if (mode !== 'dialogue' || !DL) return;
  if (!DL.full) { DL.n = DL.total; DL.full = true; renderDl(DL.n); showWord(); return; }
  nextLine();
}
function showWord() { const ln = DL.lines[DL.i]; $('dword').style.display = ln.word ? 'block' : 'none'; if (ln.word) AU.sfx('check'); }
function tickDialogue() {
  if (!DL || DL.full) return;
  DL.n = Math.min(DL.total, DL.n + 0.9); renderDl(Math.floor(DL.n));
  if (Math.floor(DL.n) % 3 === 0 && DL.n < DL.total) AU.sfx('blip');
  if (DL.n >= DL.total) { DL.full = true; showWord(); }
}

/* ---------------------------------------------------------------- UI */
const SCREENS = ['sIntro', 'sTitle', 'sSelect', 'sPause', 'sComplete', 'sOver', 'sEnd'];
function show(id) { $(id).classList.remove('hidden'); }
function hide(id) { $(id).classList.add('hidden'); }
function hideAllScreens() { SCREENS.forEach(hide); $('dlg').classList.add('hidden'); $('hint').classList.add('hidden'); $('bossbar').classList.add('hidden'); }
function setHUD(on) { ['hud', 'btnPause'].forEach(id => $(id).classList.toggle('hidden', !on)); }
let ctlWanted = false;
function setControls(on) { ctlWanted = on; syncControls(); }
function syncControls() { $('controls').classList.toggle('hidden', !(ctlWanted && touchy && mode !== 'dialogue' && mode !== 'paused' && mode !== 'complete' && mode !== 'over')); }
function updateHUD() {
  if (!G) return;
  const hs = $('hearts'); hs.innerHTML = '';
  const url = iconURL('heart', 4);
  for (let i = 0; i < G.maxHearts; i++) { const im = document.createElement('img'); im.src = url; if (i >= G.hearts) im.className = 'off'; hs.appendChild(im); }
  $('acornN').textContent = G.acorns;
}
function soundLabel() { return 'Звук: ' + (AU.muted ? 'выкл' : 'вкл'); }
function refreshSound() { $('bSound').textContent = soundLabel(); $('bPSound').textContent = soundLabel(); }
function toggleSound() { AU.resume(); AU.setMuted(!AU.muted); save.mute = AU.muted; persist(); refreshSound(); if (!AU.muted) AU.sfx('select'); }

function gotoTitle() {
  mode = 'title'; G = null; hideAllScreens(); setHUD(false); setControls(false); show('sTitle'); refreshSound(); AU.music('calm', 0);
}
function gotoSelect() {
  mode = 'select'; hideAllScreens(); setHUD(false); setControls(false); show('sSelect'); AU.music('calm', 0);
  const box = $('cards'); box.innerHTML = '';
  LV.forEach((L, i) => {
    const locked = i > save.unlocked, d = document.createElement('div'); d.className = 'lcard' + (locked ? ' locked' : '');
    const f = L.boss ? 'boss' : L.friend; const ic = f === 'boss' ? null : iconURL(CH[f].spr, 3);
    d.innerHTML = '<div class="ic">' + (ic ? '<img src="' + ic + '">' : '<canvas width="32" height="19"></canvas>') + '</div><div><div class="n">' + (L.boss ? 'БОСС · ' : '') + 'Уровень ' + (i + 1) + '</div><div class="t">' + L.name + '</div>' +
      '<div class="s">' + (locked ? 'закрыто' : '<img src="' + iconURL('acorn', 2) + '">' + (save.best[i] || 0)) + '</div></div>';
    if (L.boss) { const cc = d.querySelector('canvas'); cc.style.cssText = 'width:90%;image-rendering:pixelated'; cc.getContext('2d').drawImage(bossCanvas(0), 0, 0); }
    if (!locked) d.addEventListener('click', () => { AU.resume(); AU.sfx('select'); startLevel(i); });
    box.appendChild(d);
  });
}
function pauseGame() { if (mode !== 'play') return; mode = 'paused'; show('sPause'); refreshSound(); input.left = input.right = false; resetTouch(); }
function resumeGame() { if (mode !== 'paused') return; hide('sPause'); mode = 'play'; }
window.__pause = pauseGame;
window.__back = function () {
  if (mode === 'play') { pauseGame(); return true; }
  if (mode === 'paused') { resumeGame(); return true; }
  if (mode === 'dialogue') { advanceDialogue(); return true; }
  if (mode === 'select' || mode === 'complete' || mode === 'over' || mode === 'ending' || mode === 'intro') { gotoTitle(); return true; }
  return false;
};
document.addEventListener('visibilitychange', () => { if (document.hidden) { pauseGame(); AU.ctx && AU.ctx.suspend(); } else AU.ctx && AU.ctx.resume(); });

function bind(id, fn) { const el = $(id); el.addEventListener('click', e => { e.stopPropagation(); AU.resume(); AU.sfx('select'); fn(); }); }
bind('bPlay', () => startLevel(Math.min(save.unlocked, LV.length - 1)));
bind('bLevels', gotoSelect);
bind('bSound', toggleSound); bind('bPSound', toggleSound);
bind('bSelBack', gotoTitle);
bind('btnPause', pauseGame);
bind('bResume', resumeGame);
bind('bRestart', () => { hide('sPause'); startLevel(G.i); });
bind('bPMenu', () => { gotoSelect(); });
bind('bNext', () => { if (G.i + 1 < LV.length) startLevel(G.i + 1); else endGame(); });
bind('bRepeat', () => startLevel(G.i));
bind('bCMenu', gotoSelect);
bind('bRetry', () => startLevel(G.i));
bind('bOMenu', gotoSelect);
bind('bAgain', () => startLevel(0));
bind('bEMenu', gotoTitle);
$('stage').addEventListener('pointerdown', e => { if (mode === 'dialogue') { e.preventDefault(); AU.resume(); advanceDialogue(); } });

/* ---------------------------------------------------------------- input */
const KEYS = { ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right' };
const JUMPK = { Space: 1, ArrowUp: 1, KeyW: 1, KeyZ: 1, KeyX: 1 };
window.addEventListener('keydown', e => {
  AU.resume();
  if (KEYS[e.code]) { input[KEYS[e.code]] = true; e.preventDefault(); }
  else if (JUMPK[e.code]) {
    e.preventDefault();
    if (!e.repeat) { if (mode === 'dialogue') advanceDialogue(); else { input.jumpPressed = true; } }
    input.jumpHeld = true;
  } else if (e.code === 'Enter') { if (mode === 'dialogue') advanceDialogue(); }
  else if (e.code === 'Escape' || e.code === 'KeyP') { if (mode === 'play') pauseGame(); else if (mode === 'paused') resumeGame(); }
  else if (e.code === 'KeyM') toggleSound();
  $('controls').classList.add('kb');
});
window.addEventListener('keyup', e => {
  if (KEYS[e.code]) input[KEYS[e.code]] = false;
  if (JUMPK[e.code]) input.jumpHeld = false;
});
const touchBtn = { bL: 'left', bR: 'right', bJ: 'jump' };
const active = {};
function setBtn(id, on) {
  const k = touchBtn[id]; $(id).classList.toggle('on', on);
  if (k === 'jump') { if (on && !input.jumpHeld) { if (mode === 'dialogue') advanceDialogue(); else input.jumpPressed = true; } input.jumpHeld = on; }
  else input[k] = on;
}
function resetTouch() { for (const id in touchBtn) { $(id).classList.remove('on'); } Object.keys(active).forEach(k => delete active[k]); input.jumpHeld = false; }
Object.keys(touchBtn).forEach(id => {
  const el = $(id);
  el.addEventListener('pointerdown', e => { e.preventDefault(); AU.resume(); el.setPointerCapture && el.setPointerCapture(e.pointerId); active[e.pointerId] = id; setBtn(id, true); });
  const up = e => { e.preventDefault(); if (active[e.pointerId] === id) { delete active[e.pointerId]; setBtn(id, false); } };
  el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up); el.addEventListener('lostpointercapture', up);
  el.addEventListener('contextmenu', e => e.preventDefault());
});
// sliding thumb between left/right pads
$('padL').addEventListener('pointermove', e => {
  if (active[e.pointerId] === undefined) return;
  const t = document.elementFromPoint(e.clientX, e.clientY);
  const id = t && (t.id === 'bL' || t.id === 'bR') ? t.id : (t && t.parentNode && (t.parentNode.id === 'bL' || t.parentNode.id === 'bR') ? t.parentNode.id : null);
  if (id && id !== active[e.pointerId]) { setBtn(active[e.pointerId], false); active[e.pointerId] = id; setBtn(id, true); }
});
document.addEventListener('contextmenu', e => e.preventDefault());
document.addEventListener('touchmove', e => e.preventDefault(), { passive: false });

/* ---------------------------------------------------------------- rendering */
function drawBackground(th, camX, skyMix, t) {
  let sky = th.sky;
  if (skyMix !== undefined && th === THEMES.storm) { sky = [lerpCol(THEMES.storm.sky[0], THEMES.sunny.sky[0], skyMix), lerpCol(THEMES.storm.sky[1], THEMES.sunny.sky[1], skyMix)]; }
  const bands = 15;
  for (let i = 0; i < bands; i++) { ctx.fillStyle = lerpCol(sky[0], sky[1], i / (bands - 1)); ctx.fillRect(0, Math.floor(i * H / bands), W, Math.ceil(H / bands) + 1); }
  if (th.stars) { for (let i = 0; i < 40; i++) { if (hash(i * 3) < .8) { ctx.fillStyle = (Math.floor(t / 20) + i) % 7 === 0 ? '#fff' : '#ffe9b8'; ctx.fillRect(Math.floor(hash(i) * W), Math.floor(hash(i + 99) * 90), 1, 1); } } }
  if (th.sun || th.stars) { const sx = th.stars ? 300 : 330, sy = th.stars ? 110 : 40, r = th.stars ? 20 : 14; ctx.fillStyle = th.stars ? '#ffcf8a' : '#fff2a8'; ctx.fillRect(sx - r + 4, sy - r, 2 * r - 8, 2 * r); ctx.fillRect(sx - r, sy - r + 4, 2 * r, 2 * r - 8); ctx.fillRect(sx - r + 2, sy - r + 2, 2 * r - 4, 2 * r - 4); }
  if (th === THEMES.storm && skyMix > 0.9) { ctx.fillStyle = '#fff2a8'; ctx.fillRect(316, 26, 28, 28); ctx.fillRect(312, 30, 36, 20); }
  // clouds
  const cl = th === THEMES.storm ? lerpCol('#2c2c44', '#ffffff', skyMix || 0) : (th.stars ? '#7a6aa8' : '#ffffff');
  ctx.fillStyle = cl; ctx.globalAlpha = th === THEMES.storm && (skyMix || 0) < .5 ? 0.9 : 0.85;
  for (let i = 0; i < 5; i++) { const cx = ((i * 137 - camX * 0.08 - t * 0.1) % (W + 80) + (W + 80)) % (W + 80) - 40, cy = 18 + (i * 29) % 56; ctx.fillRect(cx, cy, 36, 7); ctx.fillRect(cx + 6, cy - 5, 22, 6); ctx.fillRect(cx + 14, cy + 7, 16, 3); }
  ctx.globalAlpha = 1;
  // hills
  for (const hl of th.hills) {
    ctx.fillStyle = hl[0]; const par = hl[1];
    for (let x = 0; x < W; x += 2) {
      const wx = x + camX * par, y = hl[4] - hl[2] * (0.5 + 0.35 * Math.sin(wx * hl[3]) + 0.15 * Math.sin(wx * hl[3] * 2.7 + 1));
      ctx.fillRect(x, Math.floor(y), 2, H - y);
    }
  }
  // deco
  const gy = 176, spacing = th.deco === 'flowers' || th.deco === 'berry' ? 44 : 58;
  const par = 0.55, first = Math.floor((camX * par) / spacing) - 1;
  for (let i = first; i < first + Math.ceil(W / spacing) + 3; i++) {
    const wx = i * spacing + hash(i * 5) * 24, x = Math.round(wx - camX * par), hsz = hash(i * 9);
    if (th.deco === 'birch') {
      const h = 70 + hsz * 40; ctx.fillStyle = '#eeeee6'; ctx.fillRect(x, gy - h, 4, h); ctx.fillStyle = '#3b3b3b';
      for (let k = 0; k < 5; k++) ctx.fillRect(x + (k % 2), gy - h + 10 + k * 14 + Math.floor(hash(i + k) * 6), 2 + (k % 2), 2);
      ctx.fillStyle = '#6fbf5a'; ctx.fillRect(x - 12, gy - h - 10, 28, 16); ctx.fillRect(x - 8, gy - h - 16, 20, 8); ctx.fillStyle = '#58a448'; ctx.fillRect(x - 12, gy - h + 2, 28, 4);
    } else if (th.deco === 'pine') {
      const h = 60 + hsz * 40; ctx.fillStyle = th === THEMES.dusk ? '#2d3b5a' : '#2f4f45'; ctx.fillRect(x + 4, gy - 10, 4, 10);
      for (let k = 0; k < 4; k++) { const w = 30 - k * 6; ctx.fillRect(x + 6 - w / 2, gy - 10 - (k + 1) * h / 4.5, w, h / 4.2); }
    } else if (th.deco === 'flowers') {
      ctx.fillStyle = '#4f9a4a'; ctx.fillRect(x, gy - 16, 2, 16);
      ctx.fillStyle = ['#ff7aa8', '#ffd23f', '#fff', '#b88cff'][i & 3]; ctx.fillRect(x - 3, gy - 22, 8, 6); ctx.fillStyle = '#ffe36b'; ctx.fillRect(x, gy - 20, 2, 2);
    } else if (th.deco === 'berry') {
      ctx.fillStyle = '#4f8a3c'; ctx.fillRect(x - 10, gy - 28, 28, 28); ctx.fillRect(x - 6, gy - 34, 20, 8);
      ctx.fillStyle = '#d33b5a'; for (let k = 0; k < 6; k++) ctx.fillRect(x - 8 + Math.floor(hash(i * 3 + k) * 24), gy - 30 + Math.floor(hash(i * 7 + k) * 24), 3, 3);
    } else if (th.deco === 'reeds') {
      ctx.fillStyle = '#4c9a6a'; for (let k = 0; k < 4; k++) ctx.fillRect(x + k * 3, gy - 24 - hash(i + k) * 14, 1, 40);
      ctx.fillStyle = '#7a4a2a'; for (let k = 0; k < 4; k += 2) ctx.fillRect(x + k * 3 - 1, gy - 30 - hash(i + k) * 14, 3, 7);
    }
  }
}
function drawTiles(g, camX) {
  const th = g.theme, m = g.map;
  const x0 = Math.max(0, Math.floor(camX / T)), x1 = Math.min(m.w, x0 + Math.ceil(W / T) + 2);
  ctx.fillStyle = th.dirt; ctx.fillRect(0, 224, W, 1);
  for (let ty = 0; ty < m.h; ty++) for (let tx = x0; tx < x1; tx++) {
    const c = m.t[ty][tx]; if (c === '.') continue;
    let kind = c === '#' ? (ty === 0 || m.t[ty - 1][tx] !== '#' ? 'grass' : 'dirt') : c === '=' ? 'wood' : 'branch';
    ctx.drawImage(tileCanvas(kind, th, (tx * 7 + ty * 13) % 11), Math.round(tx * T - camX), ty * T);
  }
}
function drawWater(g, camX, t) {
  const m = g.map, x0 = Math.max(0, Math.floor(camX / T)), x1 = Math.min(m.w, x0 + Math.ceil(W / T) + 2);
  for (let tx = x0; tx < x1; tx++) {
    if (m.t[13][tx] === '#') continue;
    const sx = Math.round(tx * T - camX); ctx.fillStyle = '#3d86d8'; ctx.fillRect(sx, 200, T, 24); ctx.fillStyle = '#7fb8f2';
    for (let k = 0; k < 4; k++) ctx.fillRect(sx + ((k * 5 + Math.floor(t / 10)) % T), 200 + (k % 2) * 2, 4, 1);
    ctx.fillStyle = '#2a64b0'; ctx.fillRect(sx, 212, T, 12);
  }
}
function drawBossArea(g, camX, t) {
  const ax = g.map.arenaX * T - camX; if (ax > W + 10) return;
  // big oak at left of arena with nest
  ctx.fillStyle = '#5a3a1e'; ctx.fillRect(ax + 6, 22, 24, 154); ctx.fillStyle = '#6e4a28'; ctx.fillRect(ax + 10, 22, 8, 154);
  ctx.fillStyle = '#5a3a1e'; ctx.fillRect(ax + 30, 40, 36, 8); ctx.fillRect(ax - 6, 70, 20, 8);
  ctx.fillStyle = '#3f7a3a'; ctx.fillRect(ax - 8, 0, 74, 26); ctx.fillStyle = '#4f9a4a'; ctx.fillRect(ax - 4, 0, 60, 18);
  ctx.fillStyle = '#9a6a34'; ctx.fillRect(ax + 34, 32, 26, 10); ctx.fillStyle = '#c99250'; ctx.fillRect(ax + 36, 32, 22, 4);
  if (G.bossWon) drawSpr(sprite('chik', 'A'), ax + 40, 28, false, 1);
  drawSpr(sprite('mama', 'A'), ax + 18, 20, false, 1);
  if (g.bossWon) { // rainbow
    const cx = ax + 240, cy = 190, cols = ['#ff5a5a', '#ff9a3c', '#ffe45a', '#6fd06a', '#5aa8ff', '#9a6aff'];
    cols.forEach((c, k) => { const r = 150 - k * 4; ctx.fillStyle = c; for (let x = -r; x <= r; x += 1) { const y = cy - Math.sqrt(r * r - x * x); if (y < 190) ctx.fillRect(cx + x, y, 1, 4); } });
  }
}
function drawEnemy(e, camX) {
  const x = e.x - camX;
  if (!e.alive) {
    if (e.calm && e.calm < 24) { const s = 1 - e.calm / 24; if (e.k === 'bee' || e.k === 'crow') { /* fade */ }
      ctx.globalAlpha = Math.max(0, s); const c = enemyCanvas(e); ctx.drawImage(c, Math.round(x - 1 + (1 - s) * 4), Math.round(e.y + e.h - c.height * s - 0), Math.round(c.width), Math.max(2, Math.round(c.height * s))); ctx.globalAlpha = 1; }
    return;
  }
  const c = enemyCanvas(e);
  if (e.k === 'bush') drawSpr(c, x - 1, e.y + e.h - c.height, e.dir < 0 && false);
  else if (e.k === 'thorn') drawSpr(c, x - 1, e.y + e.h - c.height, false);
  else if (e.k === 'bee') drawSpr(c, x - 2, e.y - 1, e.dir > 0);
  else drawSpr(c, x - 2, e.y - 1, e.dir > 0);
}
function enemyCanvas(e) {
  if (e.k === 'bush') return sprite('bush', Math.floor(e.t / 10) % 2 ? 'B' : 'A');
  if (e.k === 'thorn') return sprite('bush', 'A', THORN_TINT, 'thorn');
  if (e.k === 'bee') return beeFrame(Math.floor(e.t / 4) % 2);
  return sprite('crow', 'A');
}
function drawPlayer(g, camX) {
  const p = g.p; let fr = 'A';
  if (!p.onGround) fr = 'J'; else if (Math.abs(p.vx) > 0.3) fr = Math.floor(p.anim) % 2 ? 'B' : 'A';
  const c = sprite('timosha', fr);
  let alpha = 1; if (p.inv > 0 && p.inv % 6 < 3 && !p.dead) alpha = 0.35;
  const bob = (p.onGround && Math.abs(p.vx) > 0.3 && Math.floor(p.anim * 2) % 2) ? 1 : 0;
  drawSpr(c, p.x - 3 - camX, p.y + p.h - c.height + (p.dead ? 0 : -bob + 0), p.face < 0, 1, alpha);
  if (g.shield && !p.dead) { ctx.strokeStyle = 'rgba(176,224,255,.85)'; ctx.lineWidth = 1; ctx.strokeRect(Math.round(p.x - camX - 3) + .5, Math.round(p.y - 2) + .5, 16, 22); }
}
function drawCompanions(g, camX) {
  g.friends.forEach((f, k) => {
    const d = (k + 1) * 11, h = g.hist[Math.min(d, g.hist.length - 1)]; if (!h) return;
    const sp = SPR.S[f]; let fr = 'A'; if (h.air) fr = 'J'; else if (h.mv) fr = Math.floor(frame / 7 + k) % 2 ? 'B' : 'A';
    const c = sprite(f, fr);
    drawSpr(c, h.x - 8 - camX, h.y - c.height, h.f < 0);
  });
}
function drawWorld() {
  const g = G, camX = Math.round(g.cam);
  let ox = 0, oy = 0; if (shake.t > 0) { ox = Math.round((Math.random() - .5) * shake.a * 2); oy = Math.round((Math.random() - .5) * shake.a * 2); }
  ctx.save(); ctx.translate(ox, oy);
  drawBackground(g.theme, camX, g.L.boss ? g.skyMix : undefined, frame);
  if (g.L.boss) drawBossArea(g, camX, frame);
  drawTiles(g, camX);
  if (g.theme.water) drawWater(g, camX, frame);
  // mushrooms
  for (const m of g.mush) { const c = sprite('mush', 'A'); const s = m.sq > 0 ? 0.7 : 1; ctx.drawImage(c, Math.round(m.x - camX), Math.round(m.y + 16 - c.height * s - 4), c.width, Math.round(c.height * s)); }
  for (const f of g.flowers) { const c = sprite(f.lit ? 'flower' : 'flower_off', 'A'); drawSpr(c, f.x + 4 - camX, f.y + T - c.height); }
  for (const it of g.items) { if (it.got) continue; const bob = it.pop !== undefined ? 0 : Math.sin(it.t) * 2; const c = sprite(it.k, 'A'); drawSpr(c, it.x - camX - (c.width - 8) / 2, it.y + bob - (c.height - 8) / 2); }
  // goal NPC
  if (g.goal) { const f = g.L.friend, c = sprite(f, 'A'); const bob = Math.abs(Math.sin(frame * 0.07)) * 2; drawSpr(c, g.goal.x - camX - 8 + 8, g.goal.y - c.height - bob + (g.goal.done ? 0 : 0), true);
    if (!g.goal.done) { ctx.fillStyle = '#ffd23f'; const ay = g.goal.y - c.height - 8 - Math.abs(Math.sin(frame * 0.1)) * 3; ctx.fillRect(g.goal.x - camX + 8, ay, 5, 2); ctx.fillRect(g.goal.x - camX + 9, ay + 2, 3, 2); ctx.fillRect(g.goal.x - camX + 10, ay + 4, 1, 1); } }
  for (const e of g.enemies) drawEnemy(e, camX);
  for (const d of g.drops) drawSpr(sprite('drop', 'A'), d.x - 2 - camX, d.y);
  if (g.boss && g.boss.active) {
    const b = g.boss; const c = bossCanvas(Math.min(b.mood, 5)); let bx = b.x - camX + (b.shake || 0);
    if (b.phase === 'aim' || b.phase === 'dive') { ctx.fillStyle = 'rgba(0,0,0,.28)'; const sw = 40 + (b.phase === 'aim' ? 0 : 10); ctx.fillRect(b.x - camX + 32 - sw / 2, 173, sw, 3); }
    ctx.globalAlpha = (b.phase === 'hurt' && Math.floor(b.t / 3) % 2) ? 0.5 : 1;
    ctx.drawImage(c, Math.round(bx), Math.round(b.y), c.width * 2, c.height * 2); ctx.globalAlpha = 1;
    if (b.phase === 'rest') { ctx.fillStyle = '#ffe36b'; const a = b.t * 0.15; for (let k = 0; k < 3; k++) ctx.fillRect(Math.round(bx + 32 + Math.cos(a + k * 2.1) * 26), Math.round(b.y - 4 + Math.sin(a + k * 2.1) * 4), 3, 3); }
  }
  drawCompanions(g, camX);
  drawPlayer(g, camX);
  for (const pt of g.parts) {
    const a = Math.min(1, pt.life / 20); ctx.globalAlpha = a;
    if (pt.kind === 'heart') { drawSpr(sprite('heart', 'A'), pt.x - camX - 3, pt.y - 3); ctx.globalAlpha = 1; }
    else { ctx.fillStyle = pt.c; ctx.fillRect(Math.round(pt.x - camX), Math.round(pt.y), 2, 2); ctx.globalAlpha = 1; }
  }
  ctx.restore();
}
function drawMenuScene() {
  const th = THEMES[mode === 'ending' ? 'sunny' : 'birch'], camX = menuT * 0.4;
  drawBackground(th, camX, undefined, menuT);
  const gy = 176;
  for (let x = 0; x < W; x += T) { ctx.drawImage(tileCanvas('grass', th, (x / T) % 11), x, gy); for (let y = gy + T; y < H; y += T) ctx.drawImage(tileCanvas('dirt', th, ((x / T) + y) % 11), x, y); }
  const order = ['timosha', 'pushok', 'iriska', 'tisha', 'toptyzhka', 'chik'];
  const sc = mode === 'title' ? 2 : 2, base = mode === 'title' ? 52 : 60;
  order.forEach((n, k) => {
    const c = sprite(n, 'A'), bob = Math.abs(Math.sin(menuT * 0.05 + k)) * 3;
    const x = Math.round((W - 6 * 62) / 2 + k * 62 + 6);
    drawSpr(sprite(n, Math.floor(menuT / 18 + k) % 2 ? 'B' : 'A'), x, gy - c.height * sc - bob, k % 2 === 1 && false, sc);
  });
  if (mode === 'ending') {
    const c = bossCanvas(5); ctx.drawImage(c, Math.round(W / 2 - 32), 36 + Math.sin(menuT * 0.04) * 4, 64, 38);
    const cx = W / 2, cy = 190, cols = ['#ff5a5a', '#ff9a3c', '#ffe45a', '#6fd06a', '#5aa8ff', '#9a6aff'];
    cols.forEach((c2, k) => { const r = 170 - k * 4; ctx.fillStyle = c2; for (let x = -r; x <= r; x += 1) { const y = cy - Math.sqrt(r * r - x * x); if (y < 190) ctx.fillRect(cx + x, y, 1, 4); } });
  }
}

/* ---------------------------------------------------------------- main loop */
function updateWorld() {
  G.time++;
  updatePlayer();
  if (!G.p.dead) { updateEnemies(); updateItems(); updateBoss(); }
  else { updateItems(); }
  if (mode === 'play' && !G.p.dead) updateTriggers();
  const p = G.p;
  const tcam = Math.max(G.camMin, Math.min(G.lvlWidth - W, p.x + 5 - W / 2 + p.face * 24));
  G.cam += (tcam - G.cam) * 0.12; if (Math.abs(tcam - G.cam) < 0.3) G.cam = tcam;
  if (G.cam < G.camMin) G.cam = G.camMin;
  if (shake.t > 0) shake.t--;
}
function tick() {
  frame++; menuT++; if (mode !== lastMode) { lastMode = mode; syncControls(); }
  if (mode === 'play') { updateWorld(); }
  else if (mode === 'dialogue') { tickDialogue(); if (G && G.boss && G.boss.active) { G.boss.t++; } }
  input.jumpPressed = false;
}
function render() {
  if ((mode === 'title' || mode === 'select' || mode === 'ending') || !G) { drawMenuScene(); return; }
  drawWorld();
}
let last = 0, acc = 0, lastMode = '';
function loop(ts) {
  const dt = Math.min(100, ts - last); last = ts; acc += dt;
  let n = 0; while (acc >= 1000 / 60 && n < 5) { tick(); acc -= 1000 / 60; n++; }
  if (n === 5) acc = 0;
  render(); requestAnimationFrame(loop);
}

/* ---------------------------------------------------------------- layout */
function resize() {
  const iw = window.innerWidth, ih = window.innerHeight;
  const asp = Math.max(16 / 9, Math.min(2.1, iw / ih));
  let w = ih * asp, h = ih; if (w > iw) { w = iw; h = iw / asp; }
  W = Math.round(225 * asp); cv.width = W; cv.height = H; ctx.imageSmoothingEnabled = false;
  const st = $('stage'); st.style.width = w + 'px'; st.style.height = h + 'px'; st.style.left = (iw - w) / 2 + 'px'; st.style.top = (ih - h) / 2 + 'px';
  st.style.setProperty('--u', (h / 225) + 'px');
}
window.addEventListener('resize', resize); window.addEventListener('orientationchange', resize);
resize();
const touchy = (window.matchMedia && matchMedia('(pointer: coarse)').matches) || /[?&]touch=1/.test(location.search) || 'ontouchstart' in window;
if (touchy) document.body.classList.add('touch');

$('acornIcon').src = iconURL('acorn', 4);
refreshSound();
gotoTitle();

// helper for automated tests
window.__game = {
  get G() { return G; }, get mode() { return mode; }, startLevel, advance: advanceDialogue, input, save,
  skipDialogues() { let n = 0; while (mode === 'dialogue' && n++ < 40) { DL.full = true; advanceDialogue(); } },
  tp(x, y) { const p = G.p; p.x = x; if (y !== undefined) p.y = y; G.cam = Math.max(G.camMin, Math.min(G.lvlWidth - W, p.x - W / 2)); },
  goto: i => { startLevel(i); }, step(n) { for (let k = 0; k < n; k++) { tick(); if (mode === 'play' && false) {} } },
  forceStart(i) { startLevel(i); hide('sIntro'); setHUD(true); mode = 'play'; },
};
requestAnimationFrame(t => { last = t; requestAnimationFrame(loop); });
})();
