import type { MaterialType, WeaponId } from '../game/types';

export class SoundEffects {
  private ctx: AudioContext | null = null;
  private muted = false;

  public setMuted(muted: boolean): void {
    this.muted = muted;
  }

  public isMuted(): boolean {
    return this.muted;
  }

  private ensureContext(): AudioContext | null {
    if (this.muted || typeof window === 'undefined') return null;
    if (!this.ctx) {
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return null;
      this.ctx = new Ctx();
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private jitter(base: number, pct = 0.08): number {
    return base * (1 + (Math.random() * 2 - 1) * pct);
  }

  public playShoot(weaponId: WeaponId): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    if (weaponId === 'pickaxe') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(this.jitter(260), now);
      osc.frequency.exponentialRampToValueAtTime(95, now + 0.11);
      gain.gain.setValueAtTime(0.14, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.13);
      return;
    }

    // White noise burst for punchy gunfire
    const dur = weaponId === 'shotgun' ? 0.22 : weaponId === 'sniper' ? 0.3 : 0.11;
    const bufSize = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufSize * 0.28));
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buf;

    const filter = ctx.createBiquadFilter();
    filter.type = weaponId === 'shotgun' || weaponId === 'sniper' ? 'lowpass' : 'bandpass';
    filter.frequency.setValueAtTime(
      this.jitter(weaponId === 'shotgun' ? 680 : weaponId === 'sniper' ? 1100 : weaponId === 'smg' ? 1850 : 1400),
      now,
    );

    const gain = ctx.createGain();
    const vol = weaponId === 'shotgun' || weaponId === 'sniper' ? 0.28 : weaponId === 'smg' ? 0.13 : 0.18;
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    noise.connect(filter).connect(gain).connect(ctx.destination);
    noise.start(now);

    // Low thump body
    const osc = ctx.createOscillator();
    const og = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(weaponId === 'shotgun' ? 145 : weaponId === 'sniper' ? 180 : 210, now);
    osc.frequency.exponentialRampToValueAtTime(42, now + 0.09);
    og.gain.setValueAtTime(0.22, now);
    og.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    osc.connect(og).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.11);
  }

  public playHitMarker(kind: 'body' | 'crit' | 'kill'): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = kind === 'crit' || kind === 'kill' ? 'triangle' : 'sine';
    const freq = kind === 'kill' ? 980 : kind === 'crit' ? 1320 : 760;
    osc.frequency.setValueAtTime(this.jitter(freq, 0.05), now);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.28, now + 0.06);
    gain.gain.setValueAtTime(kind === 'kill' ? 0.22 : 0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.09);
  }

  public playHarvestHit(material: MaterialType, isCrit: boolean): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = material === 'metal' ? 'square' : material === 'brick' ? 'sawtooth' : 'triangle';
    const base = material === 'metal' ? 520 : material === 'brick' ? 190 : 140;
    osc.frequency.setValueAtTime(this.jitter(base), now);
    osc.frequency.exponentialRampToValueAtTime(base * 0.65, now + 0.09);
    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.11);

    if (isCrit) {
      const chime = ctx.createOscillator();
      const cg = ctx.createGain();
      chime.type = 'sine';
      chime.frequency.setValueAtTime(880, now);
      chime.frequency.setValueAtTime(1180, now + 0.04);
      cg.gain.setValueAtTime(0.12, now);
      cg.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
      chime.connect(cg).connect(ctx.destination);
      chime.start(now);
      chime.stop(now + 0.15);
    }
  }

  public playBuildPlace(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(this.jitter(220), now);
    osc.frequency.exponentialRampToValueAtTime(95, now + 0.08);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  public playChestOpen(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((f, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      const t = now + idx * 0.055;
      osc.frequency.setValueAtTime(f, t);
      gain.gain.setValueAtTime(0.13, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.26);
    });
  }

  public playVictory(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const notes = [440, 554.37, 659.25, 880];
    notes.forEach((f, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      const t = now + idx * 0.09;
      osc.frequency.setValueAtTime(f, t);
      gain.gain.setValueAtTime(0.16, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.58);
    });
  }

  public playDefeat(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const notes = [330, 293.66, 220];
    notes.forEach((f, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      const t = now + idx * 0.13;
      osc.frequency.setValueAtTime(f, t);
      gain.gain.setValueAtTime(0.1, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.36);
    });
  }
}
