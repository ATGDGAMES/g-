export class ArcadeSfx {
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
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      if (!this.ctx) {
        this.ctx = new AudioCtx();
      }
      if (this.ctx.state === 'suspended') {
        void this.ctx.resume().catch(() => {});
      }
      return this.ctx;
    } catch {
      return null;
    }
  }

  public tone(
    freq: number,
    duration = 0.09,
    type: OscillatorType = 'triangle',
    gainPeak = 0.12,
    endFreq?: number,
  ): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);
      if (endFreq !== undefined) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(30, endFreq), now + duration);
      }
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(gainPeak, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + duration + 0.01);
    } catch {
      // ignore audio errors
    }
  }

  public pickup(): void {
    this.tone(580, 0.07, 'sine', 0.11, 920);
  }

  public hit(): void {
    this.tone(170, 0.11, 'sawtooth', 0.13, 68);
  }

  public crash(): void {
    this.tone(110, 0.22, 'sawtooth', 0.16, 38);
  }

  public jump(): void {
    this.tone(240, 0.1, 'triangle', 0.1, 510);
  }

  public boost(): void {
    this.tone(320, 0.18, 'square', 0.09, 640);
  }

  public score(): void {
    this.tone(523, 0.08, 'triangle', 0.11, 784);
  }
}
