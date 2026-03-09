import { useCallback, useRef } from "react";
import { useSound } from "@/contexts/SoundContext";

const AudioContext = window.AudioContext || (window as any).webkitAudioContext;

export function useGameSounds() {
  const ctxRef = useRef<AudioContext | null>(null);
  const { muted } = useSound();

  const getCtx = useCallback(() => {
    if (!ctxRef.current) {
      ctxRef.current = new AudioContext();
    }
    return ctxRef.current;
  }, []);

  const playTone = useCallback(
    (freq: number, duration: number, type: OscillatorType = "sine", volume = 0.15) => {
      if (muted) return;
      try {
        const ctx = getCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(volume, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + duration);
      } catch {
        // Audio not supported
      }
    },
    [getCtx, muted]
  );

  const playRoundStart = useCallback(() => {
    playTone(523, 0.15, "sine", 0.12);
    setTimeout(() => playTone(659, 0.15, "sine", 0.12), 100);
    setTimeout(() => playTone(784, 0.2, "sine", 0.15), 200);
  }, [playTone]);

  const playCashout = useCallback(() => {
    playTone(880, 0.1, "sine", 0.12);
    setTimeout(() => playTone(1108, 0.1, "sine", 0.12), 80);
    setTimeout(() => playTone(1318, 0.25, "sine", 0.15), 160);
  }, [playTone]);

  const playCrash = useCallback(() => {
    playTone(220, 0.4, "sawtooth", 0.1);
    setTimeout(() => playTone(110, 0.5, "sawtooth", 0.08), 150);
  }, [playTone]);

  const playHistoryPop = useCallback(
    (value: number) => {
      if (value >= 10) {
        // Big win - triumphant chime
        playTone(660, 0.12, "sine", 0.1);
        setTimeout(() => playTone(880, 0.12, "sine", 0.1), 60);
        setTimeout(() => playTone(1100, 0.2, "sine", 0.12), 120);
      } else if (value >= 2) {
        // Medium - pleasant pop
        playTone(700, 0.12, "sine", 0.08);
        setTimeout(() => playTone(900, 0.15, "sine", 0.1), 70);
      } else {
        // Low crash - dull thud
        playTone(180, 0.15, "triangle", 0.06);
      }
    },
    [playTone]
  );

  return { playRoundStart, playCashout, playCrash, playHistoryPop };
}
