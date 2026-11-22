// Web Audio API synthesizer for an intense, high-pitched supernatural creature shriek.

export interface ScreamController {
  stop: () => void;
}

function makeDistortionCurve(amount = 380): Float32Array<ArrayBuffer> {
  const samples = 44100;
  const buffer = new ArrayBuffer(samples * 4);
  const curve = new Float32Array(buffer);
  const deg = Math.PI / 180;
  for (let i = 0; i < samples; i++) {
    const x = (i * 2) / samples - 1;
    curve[i] = ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x));
  }
  return curve;
}

export interface ScreamOptions {
  volume?: number;
  durationSeconds?: number;
}

export function playSupernaturalScream(options: ScreamOptions = {}): ScreamController {
  const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) {
    return { stop: () => {} };
  }

  const ctx = new AudioCtx();
  if (ctx.state === 'suspended') {
    void ctx.resume();
  }

  const now = ctx.currentTime;
  const volume = Math.min(1, Math.max(0.05, options.volume ?? 1.0));
  const duration = Math.min(6, Math.max(1.2, options.durationSeconds ?? 3.6));

  // Aggressive limiter/compressor so output hits maximum perceived loudness safely
  const compressor = ctx.createDynamicsCompressor();
  compressor.threshold.setValueAtTime(-26, now);
  compressor.knee.setValueAtTime(4, now);
  compressor.ratio.setValueAtTime(18, now);
  compressor.attack.setValueAtTime(0.001, now);
  compressor.release.setValueAtTime(0.08, now);

  const shaper = ctx.createWaveShaper();
  shaper.curve = makeDistortionCurve(420);
  shaper.oversample = '4x';

  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(volume, now);
  masterGain.gain.setValueAtTime(volume, now + Math.max(0.5, duration - 1.2));
  masterGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

  shaper.connect(compressor);
  compressor.connect(masterGain);
  masterGain.connect(ctx.destination);

  // 1. Instant impact sub-slam for physical startle reflex
  const slamOsc = ctx.createOscillator();
  const slamGain = ctx.createGain();
  slamOsc.type = 'triangle';
  slamOsc.frequency.setValueAtTime(150, now);
  slamOsc.frequency.exponentialRampToValueAtTime(34, now + 0.24);
  slamGain.gain.setValueAtTime(1.4, now);
  slamGain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
  slamOsc.connect(slamGain);
  slamGain.connect(compressor);
  slamOsc.start(now);
  slamOsc.stop(now + 0.3);

  // 2. Piercing high-pitched banshee shriek (oscillator 1 + chaotic FM flutter)
  const shriekOsc1 = ctx.createOscillator();
  shriekOsc1.type = 'sawtooth';
  shriekOsc1.frequency.setValueAtTime(1180, now);
  shriekOsc1.frequency.exponentialRampToValueAtTime(2680, now + 0.14);
  shriekOsc1.frequency.linearRampToValueAtTime(2150, now + 0.65);
  shriekOsc1.frequency.linearRampToValueAtTime(2890, now + 1.25);
  shriekOsc1.frequency.exponentialRampToValueAtTime(1420, now + 2.8);

  const lfo1 = ctx.createOscillator();
  const lfoGain1 = ctx.createGain();
  lfo1.type = 'sine';
  lfo1.frequency.setValueAtTime(46, now);
  lfo1.frequency.linearRampToValueAtTime(64, now + 1.4);
  lfoGain1.gain.setValueAtTime(440, now);
  lfo1.connect(lfoGain1);
  lfoGain1.connect(shriekOsc1.frequency);

  const shriekGain1 = ctx.createGain();
  shriekGain1.gain.setValueAtTime(0.85, now);
  shriekOsc1.connect(shriekGain1);
  shriekGain1.connect(shaper);

  // 3. Dissonant high metallic harmonic screech (oscillator 2)
  const shriekOsc2 = ctx.createOscillator();
  shriekOsc2.type = 'square';
  shriekOsc2.frequency.setValueAtTime(1760, now);
  shriekOsc2.frequency.exponentialRampToValueAtTime(3420, now + 0.18);
  shriekOsc2.frequency.linearRampToValueAtTime(2480, now + 0.9);
  shriekOsc2.frequency.linearRampToValueAtTime(3180, now + 1.5);
  shriekOsc2.frequency.exponentialRampToValueAtTime(1650, now + 3.0);

  const lfo2 = ctx.createOscillator();
  const lfoGain2 = ctx.createGain();
  lfo2.type = 'sawtooth';
  lfo2.frequency.setValueAtTime(59, now);
  lfoGain2.gain.setValueAtTime(520, now);
  lfo2.connect(lfoGain2);
  lfoGain2.connect(shriekOsc2.frequency);

  const shriekGain2 = ctx.createGain();
  shriekGain2.gain.setValueAtTime(0.75, now);
  shriekOsc2.connect(shriekGain2);
  shriekGain2.connect(shaper);

  // 4. Lower demonic guttural rasp underneath the screech
  const monsterOsc = ctx.createOscillator();
  monsterOsc.type = 'sawtooth';
  monsterOsc.frequency.setValueAtTime(240, now);
  monsterOsc.frequency.linearRampToValueAtTime(490, now + 0.3);
  monsterOsc.frequency.linearRampToValueAtTime(185, now + 1.9);

  const monsterGain = ctx.createGain();
  monsterGain.gain.setValueAtTime(0.65, now);
  monsterOsc.connect(monsterGain);
  monsterGain.connect(shaper);

  // 5. Breathy supernatural hiss / noise burst through resonant screaming formant filter
  const bufferSize = Math.floor(ctx.sampleRate * duration);
  const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const output = noiseBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    output[i] = Math.random() * 2 - 1;
  }

  const noiseSource = ctx.createBufferSource();
  noiseSource.buffer = noiseBuffer;

  const bandpass = ctx.createBiquadFilter();
  bandpass.type = 'bandpass';
  bandpass.frequency.setValueAtTime(1800, now);
  bandpass.frequency.exponentialRampToValueAtTime(3600, now + 0.25);
  bandpass.frequency.exponentialRampToValueAtTime(1400, now + 2.6);
  bandpass.Q.setValueAtTime(4.5, now);

  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(1.15, now);

  noiseSource.connect(bandpass);
  bandpass.connect(noiseGain);
  noiseGain.connect(shaper);

  shriekOsc1.start(now);
  lfo1.start(now);
  shriekOsc2.start(now);
  lfo2.start(now);
  monsterOsc.start(now);
  noiseSource.start(now);

  shriekOsc1.stop(now + duration);
  lfo1.stop(now + duration);
  shriekOsc2.stop(now + duration);
  lfo2.stop(now + duration);
  monsterOsc.stop(now + duration);
  noiseSource.stop(now + duration);

  const stop = () => {
    try {
      masterGain.gain.cancelScheduledValues(ctx.currentTime);
      masterGain.gain.setValueAtTime(0.0001, ctx.currentTime);
      if (ctx.state !== 'closed') {
        void ctx.close();
      }
    } catch {
      // Ignore already closed AudioContext errors
    }
  };

  return { stop };
}
