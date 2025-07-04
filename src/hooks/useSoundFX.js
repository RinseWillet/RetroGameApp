// src/hooks/useSoundFX.js
import { getAudioContext } from '../audio/audioCTX';

let isMuted = false;
const activeNodes = new Set(); // ← GLOBAL
const track = (node) => {
    activeNodes.add(node);
    return node;
};

export const setMuted = (value) => {
    isMuted = value;
};

export const stopAll = () => {
    activeNodes.forEach(node => {
        try {
            if (typeof node.stop === 'function') node.stop();
            node.disconnect?.();
        } catch {}
    });
    activeNodes.clear();
};

const useSoundFX = () => {

    const playLaser = () => {
        if (isMuted) return;

        const audioCtx = getAudioContext();
        const now = audioCtx.currentTime;

        const osc = track(audioCtx.createOscillator());
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(1000, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.8);

        const gain = track(audioCtx.createGain());
        gain.gain.setValueAtTime(0.8, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.9);

        const distortion = track(audioCtx.createWaveShaper());
        const curve = new Float32Array(44100);
        for (let i = 0; i < curve.length; i++) {
            const x = (i * 2) / curve.length - 1;
            curve[i] = x * 10 / (Math.PI + Math.abs(x));
        }
        distortion.curve = curve;
        distortion.oversample = '2x';

        osc.connect(gain);
        gain.connect(distortion);
        distortion.connect(audioCtx.destination);

        osc.start(now);
        osc.stop(now + 1.4);

        osc.onended = () => {
            try {
                osc.disconnect();
                activeNodes.delete(osc);
            } catch { }
        };

        // Safety fallback (if onended doesn't fire)
        setTimeout(() => {
            try {
                osc.disconnect();
                activeNodes.delete(osc);
            } catch { }
        }, 1500);
    };

    const playExplosion = (type) => {
        if (isMuted) return;

        const audioCtx = getAudioContext();
        const rand = (base, variance) => base + (Math.random() - 0.5) * variance;

        const settings = {
            small: { noiseDecay: rand(0.35, 0.05), filterStart: rand(2200, 200), filterEnd: 700, sub1Freq: rand(300, 20), sub2Freq: rand(340, 20), sub1Gain: 0.5, sub2Gain: 0.25 },
            medium: { noiseDecay: rand(0.85, 0.1), filterStart: rand(1700, 150), filterEnd: 90, sub1Freq: rand(180, 10), sub2Freq: rand(210, 10), sub1Gain: 1.6, sub2Gain: 0.5 },
            big: { noiseDecay: rand(1.2, 0.2), filterStart: rand(1400, 100), filterEnd: 60, sub1Freq: rand(110, 10), sub2Freq: rand(142, 10), sub1Gain: 2.0, sub2Gain: 0.6 },
        }[type];

        const now = audioCtx.currentTime;

        const bufferSize = audioCtx.sampleRate * settings.noiseDecay;
        const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) output[i] = Math.random() * 2 - 1;

        const whiteNoise = track(audioCtx.createBufferSource());
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = false;

        const filter = track(audioCtx.createBiquadFilter());
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(settings.filterStart, now);
        filter.frequency.exponentialRampToValueAtTime(settings.filterEnd, now + settings.noiseDecay);
        filter.Q.setValueAtTime(1.2, now);

        const gainNode = track(audioCtx.createGain());
        gainNode.gain.setValueAtTime(1.5, now);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + settings.noiseDecay);

        const subOsc1 = track(audioCtx.createOscillator());
        subOsc1.type = 'sine';
        subOsc1.frequency.setValueAtTime(settings.sub1Freq, now);
        subOsc1.frequency.exponentialRampToValueAtTime(5, now + settings.noiseDecay);

        const subGain1 = track(audioCtx.createGain());
        subGain1.gain.setValueAtTime(settings.sub1Gain, now);
        subGain1.gain.exponentialRampToValueAtTime(0.0001, now + settings.noiseDecay);

        const subOsc2 = track(audioCtx.createOscillator());
        subOsc2.type = 'sine';
        subOsc2.frequency.setValueAtTime(settings.sub2Freq, now);
        subOsc2.frequency.exponentialRampToValueAtTime(10, now + settings.noiseDecay);

        const subGain2 = track(audioCtx.createGain());
        subGain2.gain.setValueAtTime(settings.sub2Gain, now);
        subGain2.gain.exponentialRampToValueAtTime(0.0001, now + settings.noiseDecay);

        const distortion = track(audioCtx.createWaveShaper());
        const curve = new Float32Array(44100);
        for (let i = 0; i < curve.length; i++) {
            const x = (i * 2) / curve.length - 1;
            curve[i] = (3 + 5) * x * 20 / (Math.PI + 5 * Math.abs(x));
        }
        distortion.curve = curve;
        distortion.oversample = '4x';

        const convolver = track(audioCtx.createConvolver());
        const reverbBuffer = track(audioCtx.createBuffer(2, audioCtx.sampleRate * 1.0, audioCtx.sampleRate));
        for (let channel = 0; channel < 2; channel++) {
            const data = reverbBuffer.getChannelData(channel);
            for (let i = 0; i < data.length; i++) {
                data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
            }
        }
        convolver.buffer = reverbBuffer;

        const masterGain = track(audioCtx.createGain());
        masterGain.gain.setValueAtTime(type === 'big' ? 0.4 : type === 'medium' ? 0.9 : 1.6, now);

        let lightDistortion = null;
        let lightReverb = null;

        whiteNoise.connect(filter);
        filter.connect(gainNode);

        if (type === 'medium' || type === 'big') {
            gainNode.connect(distortion);
            distortion.connect(convolver);
            convolver.connect(masterGain);
        } else {
            lightDistortion = track(audioCtx.createWaveShaper());
            const lightCurve = new Float32Array(44100);
            for (let i = 0; i < lightCurve.length; i++) {
                const x = (i * 2) / lightCurve.length - 1;
                lightCurve[i] = x * 10 / (Math.PI + 2 * Math.abs(x));
            }
            lightDistortion.curve = lightCurve;
            lightDistortion.oversample = '2x';

            lightReverb = track(audioCtx.createConvolver());
            const lightReverbBuffer = track(audioCtx.createBuffer(2, audioCtx.sampleRate * 0.4, audioCtx.sampleRate));
            for (let ch = 0; ch < 2; ch++) {
                const d = lightReverbBuffer.getChannelData(ch);
                for (let i = 0; i < d.length; i++) {
                    d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
                }
            }
            lightReverb.buffer = lightReverbBuffer;

            gainNode.connect(lightDistortion);
            lightDistortion.connect(lightReverb);
            lightReverb.connect(masterGain);
        }

        masterGain.connect(audioCtx.destination);

        subOsc1.connect(subGain1);
        subGain1.connect(audioCtx.destination);

        subOsc2.connect(subGain2);
        subGain2.connect(audioCtx.destination);

        whiteNoise.start(now);
        whiteNoise.stop(now + settings.noiseDecay);

        subOsc1.start(now);
        subOsc1.stop(now + settings.noiseDecay);

        subOsc2.start(now);
        subOsc2.stop(now + settings.noiseDecay);

        whiteNoise.onended = () => {
            whiteNoise.disconnect();
            filter.disconnect();
            gainNode.disconnect();
            masterGain.disconnect();
            distortion.disconnect();
            convolver.disconnect();
            lightDistortion?.disconnect();
            lightReverb?.disconnect();
            activeNodes.delete(whiteNoise);
        };

        subOsc1.onended = () => {
            subOsc1.disconnect();
            subGain1.disconnect();
            activeNodes.delete(subOsc1);
        };

        subOsc2.onended = () => {
            subOsc2.disconnect();
            subGain2.disconnect();
            activeNodes.delete(subOsc2);
        };

        setTimeout(() => {
            try {
                whiteNoise.disconnect();
                filter.disconnect();
                gainNode.disconnect();
                masterGain.disconnect();
                distortion.disconnect();
                convolver.disconnect();
                lightDistortion?.disconnect();
                lightReverb?.disconnect();
                activeNodes.delete(subOsc1);
                activeNodes.delete(subOsc2);
                activeNodes.delete(whiteNoise);
            } catch { }
        }, (settings.noiseDecay * 1000) + 100);
    };

    const playHyperspace = () => {
        if (isMuted) return;

        const audioCtx = getAudioContext();
        const now = audioCtx.currentTime;

        // Oscillator
        const osc = track(audioCtx.createOscillator());
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.4);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.8);

        // Gain envelope
        const gain = track(audioCtx.createGain());
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.exponentialRampToValueAtTime(9, now + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.0);

        // Filter for a more "spacey" resonance
        const filter = track(audioCtx.createBiquadFilter());
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(600, now);
        filter.Q.setValueAtTime(6, now);

        // Connect
        osc.connect(gain);
        gain.connect(filter);
        filter.connect(audioCtx.destination);

        // Start/stop
        osc.start(now);
        osc.stop(now + 1.2);

        osc.onended = () => {
            try {
                osc.disconnect();
                gain.disconnect();
                filter.disconnect();
                activeNodes.delete(osc);
            } catch { }

        };

        // Safety fallback (if onended doesn't fire)
        setTimeout(() => {
            try {
                osc.disconnect();
                gain.disconnect();
                filter.disconnect();
                activeNodes.delete(osc);
            } catch { }
        }, 1300);
    };

    const playEngineHum = () => {
        if (isMuted) return;

        const audioCtx = getAudioContext();
        const now = audioCtx.currentTime;

        // === Oscillator 1: Deep rumble ===
        const osc1 = track(audioCtx.createOscillator());
        osc1.type = 'triangle';
        osc1.frequency.setValueAtTime(40, now); // very deep

        // === Oscillator 2: midrange engine texture ===
        const osc2 = track(audioCtx.createOscillator());
        osc2.type = 'sawtooth';
        osc2.frequency.setValueAtTime(70, now); // blends with osc1

        // === Subtle LFO for pulsing/texture ===
        const lfo = track(audioCtx.createOscillator());
        lfo.frequency.setValueAtTime(3.5, now); // pulse rate
        const lfoGain = audioCtx.createGain();
        lfoGain.gain.setValueAtTime(0.25, now); // pulse intensity

        // === Engine Gain Node ===
        const engineGain = track(audioCtx.createGain());
        engineGain.gain.setValueAtTime(0.6, now); // base volume

        // === Filter to remove harsh highs ===
        const filter = track(audioCtx.createBiquadFilter());
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(200, now); // muffles higher freqs

        // === Optional Distortion for grit ===
        const distortion = track(audioCtx.createWaveShaper());
        const curve = new Float32Array(44100);
        for (let i = 0; i < curve.length; i++) {
            const x = (i * 2) / curve.length - 1;
            curve[i] = x * 10 / (Math.PI + Math.abs(x)); // moderate curve
        }
        distortion.curve = curve;
        distortion.oversample = '2x';

        // === Connect nodes ===
        lfo.connect(lfoGain);
        lfoGain.connect(engineGain.gain); // LFO modulates volume

        osc1.connect(engineGain);
        osc2.connect(engineGain);
        engineGain.connect(filter);
        filter.connect(distortion);
        distortion.connect(audioCtx.destination);

        // === Start oscillators ===
        osc1.start(now);
        osc2.start(now);
        lfo.start(now);

        // === Return stop method for cleanup ===
        return {
            stop: () => {
                osc1.stop();
                osc2.stop();
                lfo.stop();

                osc1.disconnect();
                osc2.disconnect();
                lfo.disconnect();
                lfoGain.disconnect();
                engineGain.disconnect();
                filter.disconnect();
                distortion.disconnect();
            }
        };
    };

    return { playLaser, playExplosion, playHyperspace, playEngineHum };
};

export default useSoundFX;