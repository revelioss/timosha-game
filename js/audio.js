// Procedural chiptune audio (WebAudio). No external assets.
(function () {
  const NOTE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  function midi(tok) {
    if (!tok || tok === '.' || tok === '-') return null;
    let n = NOTE[tok[0]], i = 1;
    if (tok[i] === '#') { n++; i++; } else if (tok[i] === 'b') { n--; i++; }
    const oct = parseInt(tok.slice(i), 10);
    return 12 * (oct + 1) + n;
  }
  const hz = m => 440 * Math.pow(2, (m - 69) / 12);

  const TUNES = {
    happy: {
      bpm: 132,
      mel: ('E5 . G5 E5 C5 . D5 E5 | A4 . C5 E5 A5 . G5 E5 | F5 . A5 F5 C5 . D5 F5 | G5 . D5 G5 B5 . A5 G5 |' +
            'G5 . E5 C5 E5 . G5 C6 | A5 . E5 C5 A4 . C5 E5 | F5 A5 C6 A5 F5 . A5 C6 | D6 . B5 G5 D5 . G5 .').split('|'),
      bass: 'C3 . G3 . C3 . G3 . | A2 . E3 . A2 . E3 . | F2 . C3 . F2 . C3 . | G2 . D3 . G2 . D3 . |'
          + 'C3 . G3 . C3 . G3 . | A2 . E3 . A2 . E3 . | F2 . C3 . F2 . C3 . | G2 . D3 . G2 . B2 .',
      wave: 'square', bwave: 'triangle'
    },
    calm: {
      bpm: 96,
      mel: ('C5 . E5 . G5 . E5 . | A4 . C5 . E5 . C5 . | F4 . A4 . C5 . A4 . | G4 . B4 . D5 . . .').split('|'),
      bass: 'C3 . . . G3 . . . | A2 . . . E3 . . . | F2 . . . C3 . . . | G2 . . . D3 . . .',
      wave: 'triangle', bwave: 'sine'
    },
    boss: {
      bpm: 156,
      mel: ('A4 . A4 C5 E5 . D5 C5 | F4 . F4 A4 C5 . B4 A4 | G4 . G4 B4 D5 . C5 B4 | E5 . D5 C5 B4 . E4 . |' +
            'A5 . G5 E5 A5 . G5 E5 | F5 . E5 C5 F5 . E5 C5 | G5 . F5 D5 G5 . F5 D5 | E5 D5 C5 B4 E5 . . .').split('|'),
      bass: 'A2 A2 . A2 A2 . A2 A2 | F2 F2 . F2 F2 . F2 F2 | G2 G2 . G2 G2 . G2 G2 | E2 E2 . E2 E2 . E2 E2 |'
          + 'A2 A2 . A2 A2 . A2 A2 | F2 F2 . F2 F2 . F2 F2 | G2 G2 . G2 G2 . G2 G2 | E2 E2 . E2 B2 . E3 .',
      wave: 'sawtooth', bwave: 'square'
    },
    win: {
      bpm: 150,
      mel: ('C5 E5 G5 C6 . G5 C6 . | E6 . . . . . . .').split('|'),
      bass: 'C3 . G3 . C4 . . . | C3 . . . . . . .', wave: 'square', bwave: 'triangle', once: true
    }
  };
  TUNES.happy.mel = TUNES.happy.mel.map(s => s.trim().split(/\s+/));
  TUNES.happy.bass = TUNES.happy.bass.split('|').map(s => s.trim().split(/\s+/));
  for (const k of ['calm', 'boss', 'win']) {
    const t = TUNES[k];
    t.mel = t.mel.map(s => s.trim().split(/\s+/));
    t.bass = t.bass.split('|').map(s => s.trim().split(/\s+/));
  }

  const A = {
    ctx: null, master: null, musicGain: null, sfxGain: null, muted: false,
    cur: null, timer: null, step: 0, nextT: 0, transpose: 0,
    init() {
      if (this.ctx) return;
      const C = window.AudioContext || window.webkitAudioContext;
      if (!C) return;
      this.ctx = new C();
      this.master = this.ctx.createGain(); this.master.gain.value = this.muted ? 0 : 1;
      this.master.connect(this.ctx.destination);
      this.musicGain = this.ctx.createGain(); this.musicGain.gain.value = 0.10; this.musicGain.connect(this.master);
      this.sfxGain = this.ctx.createGain(); this.sfxGain.gain.value = 0.28; this.sfxGain.connect(this.master);
      const len = this.ctx.sampleRate * 0.5, buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate), d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      this.noiseBuf = buf;
    },
    resume() { this.init(); if (this.ctx && this.ctx.state !== 'running') this.ctx.resume(); },
    setMuted(m) { this.muted = m; if (this.master) this.master.gain.value = m ? 0 : 1; },
    tone(type, f0, f1, t, dur, vol, dest) {
      const c = this.ctx; if (!c) return;
      const o = c.createOscillator(), g = c.createGain();
      o.type = type; o.frequency.setValueAtTime(f0, t);
      if (f1 && f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(dest || this.sfxGain);
      o.start(t); o.stop(t + dur + 0.02);
    },
    noise(t, dur, vol, fq) {
      const c = this.ctx; if (!c) return;
      const s = c.createBufferSource(); s.buffer = this.noiseBuf;
      const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = fq || 1200;
      const g = c.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      s.connect(f); f.connect(g); g.connect(this.sfxGain); s.start(t); s.stop(t + dur + 0.02);
    },
    sfx(name) {
      if (!this.ctx || this.muted) return;
      const c = this.ctx, t = c.currentTime;
      switch (name) {
        case 'jump': this.tone('square', 300, 720, t, 0.16, 0.5); break;
        case 'jump2': this.tone('square', 450, 1000, t, 0.14, 0.45); break;
        case 'collect': this.tone('square', 988, 988, t, 0.06, 0.4); this.tone('square', 1319, 1319, t + 0.06, 0.12, 0.4); break;
        case 'heart': [523, 659, 784, 1047].forEach((f, i) => this.tone('triangle', f, f, t + i * 0.07, 0.14, 0.6)); break;
        case 'stomp': this.tone('square', 400, 100, t, 0.14, 0.6); this.noise(t, 0.08, 0.5, 800); break;
        case 'hit': this.tone('sawtooth', 380, 90, t, 0.35, 0.6); this.noise(t, 0.2, 0.5, 400); break;
        case 'spring': this.tone('sine', 200, 900, t, 0.25, 0.7); break;
        case 'check': [659, 880, 1175].forEach((f, i) => this.tone('triangle', f, f, t + i * 0.08, 0.16, 0.6)); break;
        case 'blip': this.tone('square', 600 + Math.random() * 200, 0, t, 0.035, 0.18); break;
        case 'select': this.tone('square', 660, 660, t, 0.07, 0.35); this.tone('square', 880, 880, t + 0.07, 0.09, 0.35); break;
        case 'friend': [523, 659, 784, 1047, 1319].forEach((f, i) => this.tone('square', f, f, t + i * 0.1, 0.2, 0.4)); break;
        case 'win': [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => this.tone('square', f, f, t + i * 0.11, 0.2, 0.4)); break;
        case 'lose': [494, 466, 440, 415, 392, 330].forEach((f, i) => this.tone('triangle', f, f * 0.98, t + i * 0.2, 0.3, 0.7)); break;
        case 'boom': this.noise(t, 0.4, 0.8, 200); this.tone('sawtooth', 180, 40, t, 0.4, 0.6); break;
        case 'drop': this.tone('sine', 1200, 500, t, 0.08, 0.25); break;
        case 'shield': this.tone('triangle', 900, 300, t, 0.2, 0.6); break;
        default: break;
      }
    },
    music(name, transpose) {
      if (this.curName === name && this.transpose === (transpose || 0)) return;
      this.curName = name; this.transpose = transpose || 0;
      clearInterval(this.timer); this.timer = null;
      if (!name) return;
      this.init(); if (!this.ctx) return;
      this.cur = TUNES[name]; this.step = 0; this.nextT = this.ctx.currentTime + 0.08;
      this.timer = setInterval(() => this.pump(), 50);
    },
    pump() {
      const c = this.ctx, t = this.cur; if (!c || !t) return;
      const stepDur = 60 / t.bpm / 2;
      if (c.state !== 'running') { this.nextT = c.currentTime + 0.05; return; }
      while (this.nextT < c.currentTime + 0.25) {
        const bars = t.mel.length, bar = Math.floor(this.step / 8) % bars, s = this.step % 8;
        const m = midi(t.mel[bar][s]), b = midi(t.bass[bar % t.bass.length][s]);
        if (m !== null) this.tone(t.wave, hz(m + this.transpose), 0, this.nextT, stepDur * 1.6, 0.5, this.musicGain);
        if (b !== null) this.tone(t.bwave, hz(b + this.transpose), 0, this.nextT, stepDur * 1.9, 0.9, this.musicGain);
        this.nextT += stepDur; this.step++;
        if (t.once && this.step >= bars * 8) { clearInterval(this.timer); this.timer = null; this.curName = null; break; }
      }
    }
  };
  window.GAUDIO = A;
})();
