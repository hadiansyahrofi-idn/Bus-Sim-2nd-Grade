/**
 * Realistic Procedural Sound Engine for Indonesian Bus Driving Experience
 * Synthesizes authentic diesel bus engine, road asphalt tires, wind rush,
 * turn signal relays, air brakes, city & SPBU ambience, and passing vehicles.
 */

export class BusSoundEngine {
  private ctx: AudioContext | null = null;
  private isStarted = false;

  // Engine nodes
  private engineOsc1: OscillatorNode | null = null;
  private engineOsc2: OscillatorNode | null = null;
  private engineSubOsc: OscillatorNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;
  private engineGain: GainNode | null = null;

  // Road / Tire nodes
  private tireFilter: BiquadFilterNode | null = null;
  private tireGain: GainNode | null = null;

  // Wind nodes
  private windFilter: BiquadFilterNode | null = null;
  private windGain: GainNode | null = null;

  // Ambient City / Traffic hum
  private ambientGain: GainNode | null = null;

  // State tracking for one-shot events
  private lastBlinkerTick = 0;
  private blinkerPhase = false;
  private wasBrakingHard = false;
  private lastPassSoundTime = 0;

  constructor() {
    // Will initialize on first frame or automatic user gesture listener
  }

  public initAndResume(): void {
    if (!this.ctx) {
      try {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        this.ctx = new AudioCtx();
        this.setupContinuousGraph();
      } catch {
        return;
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  private createNoiseBuffer(durationSec: number): AudioBuffer | null {
    if (!this.ctx) return null;
    const sampleRate = this.ctx.sampleRate;
    const bufferSize = sampleRate * durationSec;
    const buffer = this.ctx.createBuffer(1, bufferSize, sampleRate);
    const data = buffer.getChannelData(0);
    // Pinkish noise approximation
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.05;
      b6 = white * 0.115926;
    }
    return buffer;
  }

  private setupContinuousGraph(): void {
    if (!this.ctx || this.isStarted) return;
    this.isStarted = true;

    const now = this.ctx.currentTime;
    const masterGain = this.ctx.createGain();
    masterGain.gain.setValueAtTime(0.42, now);
    masterGain.connect(this.ctx.destination);

    // 1. DIESEL BUS ENGINE (Multi-cylinder heavy low rumble + turbo whistle hint)
    this.engineOsc1 = this.ctx.createOscillator();
    this.engineOsc2 = this.ctx.createOscillator();
    this.engineSubOsc = this.ctx.createOscillator();

    this.engineOsc1.type = 'sawtooth';
    this.engineOsc2.type = 'triangle';
    this.engineSubOsc.type = 'sine';

    this.engineOsc1.frequency.setValueAtTime(38, now);
    this.engineOsc2.frequency.setValueAtTime(76, now);
    this.engineSubOsc.frequency.setValueAtTime(19, now);

    this.engineFilter = this.ctx.createBiquadFilter();
    this.engineFilter.type = 'lowpass';
    this.engineFilter.frequency.setValueAtTime(145, now);
    this.engineFilter.Q.setValueAtTime(2.4, now);

    this.engineGain = this.ctx.createGain();
    this.engineGain.gain.setValueAtTime(0.28, now);

    this.engineOsc1.connect(this.engineFilter);
    this.engineOsc2.connect(this.engineFilter);
    this.engineSubOsc.connect(this.engineFilter);
    this.engineFilter.connect(this.engineGain);
    this.engineGain.connect(masterGain);

    this.engineOsc1.start(now);
    this.engineOsc2.start(now);
    this.engineSubOsc.start(now);

    // 2. TIRE / ASPHALT ROLLING NOISE
    const noiseBuf = this.createNoiseBuffer(4);
    if (noiseBuf) {
      const tireSource = this.ctx.createBufferSource();
      tireSource.buffer = noiseBuf;
      tireSource.loop = true;

      this.tireFilter = this.ctx.createBiquadFilter();
      this.tireFilter.type = 'bandpass';
      this.tireFilter.frequency.setValueAtTime(260, now);
      this.tireFilter.Q.setValueAtTime(0.9, now);

      this.tireGain = this.ctx.createGain();
      this.tireGain.gain.setValueAtTime(0.0, now);

      tireSource.connect(this.tireFilter);
      this.tireFilter.connect(this.tireGain);
      this.tireGain.connect(masterGain);
      tireSource.start(now);

      // 3. WIND RUSH & CABIN INSULATION
      const windSource = this.ctx.createBufferSource();
      windSource.buffer = noiseBuf;
      windSource.loop = true;

      this.windFilter = this.ctx.createBiquadFilter();
      this.windFilter.type = 'lowpass';
      this.windFilter.frequency.setValueAtTime(420, now);

      this.windGain = this.ctx.createGain();
      this.windGain.gain.setValueAtTime(0.015, now);

      windSource.connect(this.windFilter);
      this.windFilter.connect(this.windGain);
      this.windGain.connect(masterGain);
      windSource.start(now);

      // 4. URBAN INDONESIA AMBIENCE (Subtle distant traffic bed)
      const ambSource = this.ctx.createBufferSource();
      ambSource.buffer = noiseBuf;
      ambSource.loop = true;

      const ambFilter = this.ctx.createBiquadFilter();
      ambFilter.type = 'bandpass';
      ambFilter.frequency.setValueAtTime(520, now);
      ambFilter.Q.setValueAtTime(0.6, now);

      this.ambientGain = this.ctx.createGain();
      this.ambientGain.gain.setValueAtTime(0.04, now);

      ambSource.connect(ambFilter);
      ambFilter.connect(this.ambientGain);
      this.ambientGain.connect(masterGain);
      ambSource.start(now);
    }
  }

  public update(params: {
    speedKmh: number;
    pitchSlope: number; // positive = uphill (tanjakan), negative = downhill (turunan)
    blinker: 'off' | 'left' | 'right';
    isBraking: boolean;
    isRefueling: boolean;
    elapsedSec: number;
  }): void {
    if (!this.ctx || this.ctx.state !== 'running') return;

    const now = this.ctx.currentTime;
    const { speedKmh, pitchSlope, blinker, isBraking, isRefueling, elapsedSec } = params;

    // Calculate realistic engine RPM load
    // Uphill (Scene 9 Tanjakan) makes engine work heavier and deeper
    const uphillLoad = Math.max(0, pitchSlope * 18);
    const speedRatio = Math.min(1, speedKmh / 50);

    // Gear shifts simulation (3 city gears)
    let gearFactor = speedRatio;
    if (speedKmh > 18 && speedKmh <= 34) {
      gearFactor = 0.35 + ((speedKmh - 18) / 16) * 0.55;
    } else if (speedKmh > 34) {
      gearFactor = 0.45 + ((speedKmh - 34) / 25) * 0.55;
    }

    const baseFreq = 35 + gearFactor * 38 + uphillLoad * 12;
    if (this.engineOsc1 && this.engineOsc2 && this.engineSubOsc && this.engineFilter && this.engineGain) {
      this.engineOsc1.frequency.setTargetAtTime(baseFreq, now, 0.08);
      this.engineOsc2.frequency.setTargetAtTime(baseFreq * 2.01, now, 0.08);
      this.engineSubOsc.frequency.setTargetAtTime(baseFreq * 0.5, now, 0.08);

      const filterCutoff = 130 + gearFactor * 160 + uphillLoad * 95;
      this.engineFilter.frequency.setTargetAtTime(filterCutoff, now, 0.1);

      const engineVol = isRefueling
        ? 0.14
        : 0.24 + speedRatio * 0.12 + Math.min(0.16, uphillLoad * 0.08);
      this.engineGain.gain.setTargetAtTime(engineVol, now, 0.1);
    }

    // Tire roll sound proportional to speed
    if (this.tireGain && this.tireFilter) {
      const tireVol = Math.pow(speedRatio, 1.35) * 0.24;
      this.tireGain.gain.setTargetAtTime(tireVol, now, 0.1);
      this.tireFilter.frequency.setTargetAtTime(200 + speedKmh * 6.5, now, 0.1);
    }

    // Wind rush sound
    if (this.windGain && this.windFilter) {
      const windVol = 0.015 + Math.pow(speedRatio, 1.7) * 0.12;
      this.windGain.gain.setTargetAtTime(windVol, now, 0.12);
      this.windFilter.frequency.setTargetAtTime(350 + speedKmh * 11, now, 0.12);
    }

    // Turn signal (Lampu Sein) authentic mechanical relay click-clack
    if (blinker !== 'off') {
      if (elapsedSec - this.lastBlinkerTick >= 0.42) {
        this.lastBlinkerTick = elapsedSec;
        this.blinkerPhase = !this.blinkerPhase;
        this.triggerRelayClick(this.blinkerPhase);
      }
    } else {
      this.blinkerPhase = false;
    }

    // Pneumatic Air Brake hiss when slowing down / stopping
    if (isBraking && !this.wasBrakingHard && speedKmh > 6) {
      this.triggerAirBrakeHiss();
    }
    this.wasBrakingHard = isBraking;

    // Occasional passing motorcycle / traffic Doppler whoosh or SPBU pump sound
    if (isRefueling) {
      if (elapsedSec - this.lastPassSoundTime > 2.2) {
        this.lastPassSoundTime = elapsedSec;
        this.triggerSPBUBeep();
      }
    } else if (speedKmh > 12 && elapsedSec - this.lastPassSoundTime > 4.8) {
      if (Math.sin(elapsedSec * 7.3) > 0.65) {
        this.lastPassSoundTime = elapsedSec;
        this.triggerPassingMotorbike();
      }
    }
  }

  private triggerRelayClick(highTick: boolean): void {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(highTick ? 1150 : 820, now);
    osc.frequency.exponentialRampToValueAtTime(220, now + 0.025);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.028);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.03);
  }

  private triggerAirBrakeHiss(): void {
    if (!this.ctx) return;
    const buf = this.createNoiseBuffer(0.45);
    if (!buf) return;

    const now = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2400, now);
    filter.Q.setValueAtTime(1.8, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.42);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    src.start(now);
    src.stop(now + 0.44);
  }

  private triggerPassingMotorbike(): void {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    // Doppler shift high to low
    osc.frequency.setValueAtTime(145, now);
    osc.frequency.linearRampToValueAtTime(185, now + 0.35);
    osc.frequency.linearRampToValueAtTime(110, now + 0.95);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(420, now);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.028, now + 0.35);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.95);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 1.0);
  }

  private triggerSPBUBeep(): void {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(2100, now);

    gain.gain.setValueAtTime(0.018, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.09);
  }

  public dispose(): void {
    if (this.ctx) {
      this.ctx.close().catch(() => {});
      this.ctx = null;
    }
  }
}
