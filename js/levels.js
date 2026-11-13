// Level generator + story data. Levels are built from traversable segments
// (gaps <= 3 tiles, steps <= 2 tiles) with a fixed seed, so each level is always the same.
(function () {
  const ROWS = 14;
  function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  function build(spec) {
    const w = spec.w, rnd = mulberry32(spec.seed);
    const t = []; for (let r = 0; r < ROWS; r++) t.push(new Array(w).fill('.'));
    const ents = [], items = [], flowers = [], mush = [];
    const tops = new Array(w).fill(99);
    const ground = (x0, x1, top) => { for (let x = x0; x < x1 && x < w; x++) { tops[x] = top; for (let r = top; r < ROWS; r++) t[r][x] = '#'; } };
    const plat = (x, y, n, ch) => { for (let i = 0; i < n; i++) t[y][x + i] = ch || '='; };
    const acorns = (x, y, n) => { for (let i = 0; i < n; i++) items.push({ k: 'acorn', x: x + i, y }); };
    const arc = (x, y, n, h) => { for (let i = 0; i < n; i++) { const a = n > 1 ? i / (n - 1) : 0; items.push({ k: 'acorn', x: x + i, y: y - Math.round(Math.sin(a * Math.PI) * h) }); } };
    const pick = () => { let s = 0; for (const k in spec.mix) s += spec.mix[k]; let r = rnd() * s; for (const k in spec.mix) { r -= spec.mix[k]; if (r <= 0) return k; } return 'flat'; };
    const has = n => spec.enemies.indexOf(n) >= 0;

    let x = 0, top = 11, seg = 0, lastWasFlat = true;
    ground(0, 12, 11); x = 12;
    const spawn = { x: 2, y: 10 };
    let heartsPlaced = 0;
    while (x < w - 18) {
      let kind = pick();
      if (kind === 'mush' && !lastWasFlat) kind = 'flat';
      lastWasFlat = false;
      if (kind === 'flat') {
        const len = 6 + Math.floor(rnd() * 7);
        ground(x, x + len, top);
        if (len >= 7) {
          const mid = x + (len >> 1), r = rnd();
          if (has('bush') && r < 0.55) ents.push({ k: 'bush', x: mid, y: top - 1, a: x + 1, b: x + len - 2 });
          else if (has('thorn') && r < 0.8) ents.push({ k: 'thorn', x: mid, y: top - 1 });
        }
        if (has('bee') && rnd() < spec.beeP) ents.push({ k: 'bee', x: x + (len >> 1), y: top - 4 });
        if (has('crow') && rnd() < spec.crowP) ents.push({ k: 'crow', x: x + (len >> 1), y: top - 7 });
        if (rnd() < 0.7) acorns(x + 1 + Math.floor(rnd() * 2), top - 2, 3 + Math.floor(rnd() * 3));
        if (seg % 3 === 2 && len >= 6) flowers.push({ x: x + len - 2, y: top - 1 });
        if (rnd() < spec.heartP && heartsPlaced < 3) { items.push({ k: 'heart', x: x + 2, y: top - 3 }); heartsPlaced++; }
        x += len; lastWasFlat = true;
      } else if (kind === 'gap') {
        const g = spec.maxGap > 2 && rnd() < 0.6 ? 3 : 2;
        arc(x, top - 2, g, 1.5); x += g; ground(x, x + 5, top); x += 5; lastWasFlat = true;
      } else if (kind === 'step') {
        const opts = [-2, -1, 1, 2].filter(d => top + d >= 8 && top + d <= 11);
        const nt = top + opts[Math.floor(rnd() * opts.length)];
        ground(x, x + 6, nt);
        if (nt < top) acorns(x, nt - 2, 3);
        top = nt; x += 6; lastWasFlat = true;
      } else if (kind === 'plats') {
        // gap(3) + plat(3) + gap(3) crossing
        const py = top - 1;
        plat(x + 3, py, 3);
        acorns(x + 3, py - 2, 3);
        if (has('bee') && rnd() < spec.beeP) ents.push({ k: 'bee', x: x + 4, y: top - 5 });
        x += 9; ground(x, x + 5, top); x += 5; lastWasFlat = true;
      } else if (kind === 'tower') {
        const len = 12; ground(x, x + len, top);
        plat(x + 2, top - 2, 3, '-'); plat(x + 6, top - 4, 3, '-'); plat(x + 9, top - 2, 3, '-');
        acorns(x + 2, top - 3, 3); acorns(x + 6, top - 5, 3); acorns(x + 9, top - 3, 3);
        if (rnd() < 0.5 && heartsPlaced < 3) { items.push({ k: 'heart', x: x + 7, y: top - 6 }); heartsPlaced++; }
        if (has('bee') && rnd() < spec.beeP) ents.push({ k: 'bee', x: x + 8, y: top - 7 });
        x += len; lastWasFlat = true;
      } else if (kind === 'mush') {
        const len = 10; ground(x, x + len, top);
        mush.push({ x: x + 3, y: top - 1 });
        plat(x + 2, top - 7, 5, '-'); acorns(x + 2, top - 8, 5);
        if (heartsPlaced < 3 && rnd() < 0.6) { items.push({ k: 'heart', x: x + 4, y: top - 9 }); heartsPlaced++; }
        x += len; lastWasFlat = true;
      }
      seg++;
    }
    // final approach + goal area
    ground(x, w, top);
    flowers.push({ x: x + 2, y: top - 1 });
    const goal = { x: w - 5, y: top - 1 };
    return { w, h: ROWS, t, tops, ents, items, flowers, mush, spawn, goal, top };
  }

  function buildBoss(spec) {
    // approach (a short climb) followed by a fixed arena 25 tiles wide
    const approach = spec.approach, aw = 30, w = approach + aw;
    const t = []; for (let r = 0; r < ROWS; r++) t.push(new Array(w).fill('.'));
    const tops = new Array(w).fill(99), ents = [], items = [], flowers = [], mush = [];
    const ground = (x0, x1, top) => { for (let x = x0; x < x1; x++) { tops[x] = top; for (let r = top; r < ROWS; r++) t[r][x] = '#'; } };
    const plat = (x, y, n, ch) => { for (let i = 0; i < n; i++) t[y][x + i] = ch || '='; };
    const acorns = (x, y, n) => { for (let i = 0; i < n; i++) items.push({ k: 'acorn', x: x + i, y }); };
    ground(0, 10, 11);
    acorns(3, 9, 4);
    ground(12, 20, 11); ents.push({ k: 'bush', x: 16, y: 10, a: 13, b: 19 });
    ground(22, 28, 11); ents.push({ k: 'bee', x: 25, y: 7 }); acorns(23, 9, 3);
    plat(30, 10, 3); acorns(30, 8, 3);
    ground(34, 42, 11); ents.push({ k: 'thorn', x: 38, y: 10 }); flowers.push({ x: 40, y: 10 });
    ground(44, 50, 10); acorns(44, 8, 3); ents.push({ k: 'crow', x: 47, y: 4 });
    ground(50, approach, 11);
    items.push({ k: 'heart', x: 52, y: 8 });
    plat(51, 9, 3, '-');
    // arena
    const ax = approach;
    ground(ax, w, 11);
    plat(ax + 3, 8, 4, '-'); plat(ax + 23, 8, 4, '-'); plat(ax + 12, 6, 6, '-');
    acorns(ax + 13, 5, 4);
    return { w, h: ROWS, t, tops, ents, items, flowers, mush, spawn: { x: 2, y: 10 }, goal: null, top: 11, arenaX: ax };
  }

  const ENEMY_HINT = 'Прыгни врагу на спинку — он успокоится!';

  const LEVELS = [
    {
      id: 1, name: 'Берёзовая роща', en: 'Birch Grove', friend: 'pushok', theme: 'birch', music: 'happy', tr: 0,
      spec: { w: 150, seed: 11, mix: { flat: 5, gap: 2, step: 1 }, enemies: ['bush', 'thorn'], beeP: 0, crowP: 0, heartP: 0.15, maxGap: 2 },
      hints: [
        { x: 3, text: 'Иди вперёд! Кнопка со стрелкой вверх — прыжок.' },
        { x: 24, text: 'Прыгни колючке на спинку — она успокоится!' },
      ],
      intro: [
        { who: 'timosha', text: 'Доброе утро — [[morning]]! Какое солнышко — [[sun]]!', word: ['morning', 'утро', '[мо́нинг]'] },
        { who: 'timosha', text: 'Вот бы найти друга — [[friend]]! С другом и солнышко ярче. Я пойду искать!', word: ['friend', 'друг', '[фрэнд]'] },
      ],
      triggers: [
        { at: 0.45, lines: [{ who: 'timosha', text: 'Ой, колючие кусты! Они сердитые, но я их не боюсь. Я прыгну им на спинку!' }] },
      ],
      outro: [
        { who: 'timosha', text: 'Давай дружить! Ой... я запутался в своих длинных ножках!' },
        { who: 'pushok', text: 'Ха-ха! Как смешно ты спотыкаешься!' },
        { who: 'timosha', text: 'Мои ножки ещё учатся бегать. Зато сердце у меня доброе.' },
        { who: 'pushok', text: 'Не обижайся! У меня тоже уши смешные. Зато я всё-всё слышу! Пойдём вместе?', word: ['hare', 'заяц', '[хэ́а]'] },
        { who: 'sys', text: 'Новый друг: Пушок! Теперь можно прыгнуть ещё раз прямо в воздухе — нажми «прыжок» дважды!' },
      ],
    },
    {
      id: 2, name: 'Лесная опушка', en: 'Forest Edge', friend: 'iriska', theme: 'meadow', music: 'happy', tr: 2,
      spec: { w: 180, seed: 23, mix: { flat: 4, gap: 2, step: 1, tower: 1, plats: 1 }, enemies: ['bush', 'thorn', 'bee'], beeP: 0.45, crowP: 0, heartP: 0.15, maxGap: 3 },
      hints: [{ x: 6, text: 'Сердитые пчёлы тоже успокаиваются, если прыгнуть сверху.' }],
      intro: [
        { who: 'pushok', text: 'Впереди опушка! Я слышу, как жужжат сердитые пчёлы — [[bee]].', word: ['bee', 'пчела', '[би]'] },
        { who: 'timosha', text: 'Они просто сердятся. Мы их успокоим!' },
      ],
      triggers: [
        { at: 0.5, lines: [{ who: 'pushok', text: 'Тише... Кто-то рыжий нюхает цветы. Мне кажется, это лисичка!' }] },
      ],
      outro: [
        { who: 'iriska', text: 'Все думают, что лисы хитрые. А я просто люблю придумывать! Можно с вами?' },
        { who: 'timosha', text: 'Конечно! Нас теперь трое!' },
        { who: 'iriska', text: 'Смотрите, какой у меня пушистый хвост — [[tail]]! Он как облачко.', word: ['fox', 'лиса', '[фокс]'] },
        { who: 'sys', text: 'Новый друг: Ириска! Хвост-парашют: зажми «прыжок» в воздухе — и ты медленно планируешь.' },
      ],
    },
    {
      id: 3, name: 'Ручей у камушков', en: 'Stream Stones', friend: 'tisha', theme: 'stream', music: 'happy', tr: -3,
      spec: { w: 200, seed: 37, mix: { flat: 3, gap: 3, plats: 3, step: 1, tower: 1 }, enemies: ['bush', 'bee', 'crow'], beeP: 0.35, crowP: 0.3, heartP: 0.15, maxGap: 3 },
      water: true,
      hints: [{ x: 5, text: 'Не упади в ручей! Падение отнимает сердечко.' }],
      intro: [
        { who: 'iriska', text: 'Придумала! Через ручей мы пойдём по камушкам и брёвнышкам!' },
        { who: 'timosha', text: 'Осторожно, ручей — [[stream]]. Не упасть!', word: ['stream', 'ручей', '[стрим]'] },
      ],
      triggers: [
        { at: 0.5, lines: [{ who: 'pushok', text: 'Вороны каркают! Они не злые, просто не выспались. Прыгнем им на спинку!' }] },
      ],
      outro: [
        { who: 'pushok', text: 'Ой, черепашка! Ты такая медленная!' },
        { who: 'tisha', text: 'Зато я очень внимательная. И знаю в лесу каждую тропинку — [[path]].', word: ['turtle', 'черепаха', '[тё́ртл]'] },
        { who: 'timosha', text: 'Пойдём с нами, Тиша! Мы будем идти не спеша.' },
        { who: 'sys', text: 'Новый друг: Тиша! Её панцирь-щит спасает от одного удара (и снова появляется у цветочка).' },
      ],
    },
    {
      id: 4, name: 'Малиновые кусты', en: 'Raspberry Bushes', friend: 'toptyzhka', theme: 'berry', music: 'happy', tr: 5,
      spec: { w: 220, seed: 41, mix: { flat: 4, gap: 2, step: 2, tower: 1, mush: 2, plats: 1 }, enemies: ['bush', 'thorn', 'bee', 'crow'], beeP: 0.4, crowP: 0.25, heartP: 0.12, maxGap: 3 },
      hints: [{ x: 8, text: 'Прыгни на грибок — он подбросит высоко-высоко!' }],
      intro: [
        { who: 'tisha', text: 'Дальше малинник. Слышите? Там шуршит кто-то большой...' },
        { who: 'pushok', text: 'Ой! А вдруг он страшный?' },
      ],
      triggers: [
        { at: 0.5, lines: [{ who: 'iriska', text: 'Красные грибки такие упругие! Прыгни на грибок — и ты взлетишь!' }] },
      ],
      outro: [
        { who: 'toptyzhka', text: 'Я такой большой, что все меня боятся...' },
        { who: 'timosha', text: 'А мы не боимся! Иди к нам!', word: ['bear', 'медведь', '[бэ́а]'] },
        { who: 'toptyzhka', text: 'Правда? Спасибо! Я такой сильный — [[strong]]! Я вам помогу.', word: ['big', 'большой', '[биг]'] },
        { who: 'sys', text: 'Новый друг: Топтыжка! Теперь у тебя на одно сердечко больше. Нас пятеро — [[five]]!' },
      ],
    },
    {
      id: 5, name: 'Тропинка к озеру', en: 'Lake Path', friend: 'chik', theme: 'dusk', music: 'calm', tr: 0,
      spec: { w: 240, seed: 53, mix: { flat: 3, gap: 3, plats: 2, step: 2, tower: 1, mush: 1 }, enemies: ['bush', 'thorn', 'bee', 'crow'], beeP: 0.45, crowP: 0.35, heartP: 0.12, maxGap: 3 },
      water: true,
      hints: [],
      intro: [
        { who: 'pushok', text: 'Тише! Остановитесь и послушайте — [[listen]]! Где-то совсем рядом кто-то тихонько плачет.', word: ['listen', 'слушать', '[ли́сн]'] },
        { who: 'timosha', text: 'Пойдём скорее на звук!' },
      ],
      triggers: [
        { at: 0.5, lines: [{ who: 'tisha', text: 'Идём так, чтобы никто не отстал. Все вместе — быстрее!' }] },
      ],
      outro: [
        { who: 'chik', text: 'Пи-пи! Я Чик. Я выпал из гнезда, а летать ещё не умею...', word: ['bird', 'птица', '[бёрд]'] },
        { who: 'tisha', text: 'Я знаю, где твой дом — [[home]]! Старый дуб у Синего озера.', word: ['home', 'дом', '[хо́ум]'] },
        { who: 'toptyzhka', text: 'Я понесу тебя в тёплых лапах. Не бойся!' },
        { who: 'sys', text: 'Чик с вами! Он собирает жёлуди с небольшого расстояния — они сами летят к тебе.' },
      ],
    },
    {
      id: 6, name: 'Старый дуб: Ворчун-Туча', en: 'The Old Oak', friend: 'mama', theme: 'storm', music: 'boss', tr: 0, boss: true,
      spec: { approach: 60 },
      hints: [{ x: 4, text: 'Скоро старый дуб! Береги сердечки.' }],
      intro: [
        { who: 'tisha', text: 'Вот и старый дуб у Синего озера! Но почему так темно?' },
        { who: 'chik', text: 'Это Ворчун-Туча! Она закрыла всё небо...' },
      ],
      triggers: [],
      bossIntro: [
        { who: 'boss', text: 'Ворчу-ворчу-ворчу! Всем весело, а мне одиноко! Никто не играет с тучкой! Бу-бу-бу!' },
        { who: 'timosha', text: 'Не бойся, тучка! Мы хотим с тобой подружиться — [[friend]]!' },
        { who: 'boss', text: 'Ворчу! Тогда попробуй меня развеселить! Если допрыгнешь!' },
        { who: 'sys', text: 'Прыгай Ворчуну-Туче на спинку, когда она спустится. Увёртывайся от капелек дождя!' },
      ],
      bossWin: [
        { who: 'boss', text: 'Ой... Вы правда хотите дружить со мной? Я же такая ворчливая...' },
        { who: 'timosha', text: 'Дружба — это когда тебя любят таким, какой ты есть!' },
        { who: 'boss', text: 'Спасибо, друзья! Я больше не буду ворчать. Я буду поливать цветочки и рисовать радугу!' },
        { who: 'mama', text: 'Спасибо, друзья — [[thank you]]! Вы такие разные, а вместе — настоящее чудо! Чик, ты дома!', word: ['different', 'разный', '[ди́френт]'] },
      ],
    },
  ];

  const WORDS_END = [
    ['friend', 'друг'], ['hare', 'заяц'], ['fox', 'лиса'], ['turtle', 'черепаха'], ['bear', 'медведь'], ['bird', 'птица'], ['home', 'дом'],
  ];

  window.LEVELS = LEVELS; window.WORDS_END = WORDS_END;
  window.buildLevel = function (i) { const L = LEVELS[i]; return L.boss ? buildBoss(L.spec) : build(L.spec); };
})();
