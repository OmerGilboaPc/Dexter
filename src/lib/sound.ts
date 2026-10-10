import { createStore } from './bus';

// ================= SFX (synthesized: no audio files needed) =================
let ctx: AudioContext | null = null;
let sfxEnabled = true;
export const setSfxEnabled = (v: boolean) => (sfxEnabled = v);

function ac() {
  if (!ctx) {
    try {
      ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch {
      return null;
    }
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

function noiseBuffer(c: AudioContext, seconds: number) {
  const b = c.createBuffer(1, Math.floor(c.sampleRate * seconds), c.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return b;
}

function tone(freq: number, dur: number, type: OscillatorType = 'sine', gain = 0.08, endFreq?: number, delay = 0) {
  const c = ac();
  if (!c) return;
  const t = c.currentTime + delay;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (endFreq) o.frequency.exponentialRampToValueAtTime(endFreq, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(c.destination);
  o.start(t);
  o.stop(t + dur + 0.02);
}

function noise(dur: number, gain = 0.05, filter: BiquadFilterType = 'bandpass', f1 = 1200, f2?: number, q = 0.8) {
  const c = ac();
  if (!c) return;
  const t = c.currentTime;
  const s = c.createBufferSource();
  s.buffer = noiseBuffer(c, dur);
  const bf = c.createBiquadFilter();
  bf.type = filter;
  bf.Q.value = q;
  bf.frequency.setValueAtTime(f1, t);
  if (f2) bf.frequency.exponentialRampToValueAtTime(f2, t + dur);
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + dur * 0.15);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(bf).connect(g).connect(c.destination);
  s.start(t);
}

let lastHover = 0;
export const sfx = {
  hover() {
    if (!sfxEnabled) return;
    const n = performance.now();
    if (n - lastHover < 60) return;
    lastHover = n;
    tone(2400, 0.035, 'sine', 0.012);
  },
  click() {
    if (!sfxEnabled) return;
    tone(900, 0.06, 'triangle', 0.035, 500);
  },
  whoosh() {
    if (!sfxEnabled) return;
    noise(0.55, 0.06, 'bandpass', 300, 3000, 0.6);
  },
  drip() {
    if (!sfxEnabled) return;
    tone(1400, 0.18, 'sine', 0.07, 380);
    tone(600, 0.1, 'sine', 0.03, 300, 0.12);
  },
  heartbeat() {
    if (!sfxEnabled) return;
    tone(70, 0.16, 'sine', 0.25, 45);
    tone(62, 0.18, 'sine', 0.2, 40, 0.22);
  },
  plastic() {
    if (!sfxEnabled) return;
    noise(0.35, 0.04, 'highpass', 3000, 6000, 0.4);
  },
  success() {
    if (!sfxEnabled) return;
    tone(523, 0.12, 'triangle', 0.05);
    tone(784, 0.2, 'triangle', 0.05, undefined, 0.1);
  },
  fail() {
    if (!sfxEnabled) return;
    tone(180, 0.35, 'sawtooth', 0.04, 90);
  },
  unlock() {
    if (!sfxEnabled) return;
    [659, 880, 1318].forEach((f, i) => tone(f, 0.35, 'sine', 0.05, undefined, i * 0.09));
  },
  key() {
    if (!sfxEnabled) return;
    noise(0.04, 0.05, 'bandpass', 2500, undefined, 2);
  },
  slash() {
    if (!sfxEnabled) return;
    noise(0.25, 0.07, 'highpass', 1800, 8000, 0.7);
  },
};

// ================= Background music =================
export type Track = { title: string; url: string };
export const musicStore = createStore({ tracks: [] as Track[], index: 0, playing: false, volume: 0.35, blocked: false, enabled: true });

let audio: HTMLAudioElement | null = null;
let pendingGesture = false;

function ensureAudio() {
  if (!audio) {
    audio = new Audio();
    audio.preload = 'auto';
    audio.crossOrigin = 'anonymous';
    audio.addEventListener('ended', () => music.next());
    audio.addEventListener('play', () => musicStore.set((s) => ({ ...s, playing: true, blocked: false })));
    audio.addEventListener('pause', () => musicStore.set((s) => ({ ...s, playing: false })));
  }
  return audio;
}

function waitForGesture() {
  if (pendingGesture) return;
  pendingGesture = true;
  const go = () => {
    pendingGesture = false;
    window.removeEventListener('pointerdown', go);
    window.removeEventListener('keydown', go);
    if (musicStore.get().enabled) music.play();
  };
  window.addEventListener('pointerdown', go, { once: true });
  window.addEventListener('keydown', go, { once: true });
}

export const music = {
  configure(tracks: Track[], volume: number) {
    const s = musicStore.get();
    const same = JSON.stringify(s.tracks) === JSON.stringify(tracks);
    musicStore.set({ ...s, tracks, volume: s.volume ?? volume, index: same ? s.index : 0 });
    const a = ensureAudio();
    a.volume = musicStore.get().volume;
    if (!same && tracks.length) {
      a.src = tracks[0].url;
    }
  },
  setEnabled(v: boolean) {
    musicStore.set((s) => ({ ...s, enabled: v }));
    if (!v) audio?.pause();
  },
  play() {
    const s = musicStore.get();
    if (!s.tracks.length || !s.enabled) return;
    const a = ensureAudio();
    if (!a.src) a.src = s.tracks[s.index]?.url;
    a.volume = s.volume;
    a.play().catch(() => {
      musicStore.set((x) => ({ ...x, blocked: true }));
      waitForGesture();
    });
  },
  pause() {
    audio?.pause();
  },
  toggle() {
    musicStore.get().playing ? music.pause() : music.play();
  },
  next() {
    const s = musicStore.get();
    if (!s.tracks.length) return;
    const index = (s.index + 1) % s.tracks.length;
    musicStore.set({ ...s, index });
    const a = ensureAudio();
    a.src = s.tracks[index].url;
    music.play();
  },
  prev() {
    const s = musicStore.get();
    if (!s.tracks.length) return;
    const index = (s.index - 1 + s.tracks.length) % s.tracks.length;
    musicStore.set({ ...s, index });
    const a = ensureAudio();
    a.src = s.tracks[index].url;
    music.play();
  },
  setVolume(v: number) {
    musicStore.set((s) => ({ ...s, volume: v }));
    if (audio) audio.volume = v;
  },
  /** Called from a user gesture (sign-in click) so autoplay is allowed. */
  unlockAndPlay() {
    ac();
    music.play();
  },
  duck(on: boolean) {
    if (audio) audio.volume = on ? Math.min(0.08, musicStore.get().volume) : musicStore.get().volume;
  },
};
