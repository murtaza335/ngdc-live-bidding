import { useCallback, useRef } from 'react';

export function useAudio() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const enabledRef = useRef(true);

  const getContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  const playTone = useCallback((
    frequency: number,
    duration: number,
    type: OscillatorType = 'sine',
    volume = 0.3
  ) => {
    if (!enabledRef.current) return;
    
    const ctx = getContext();
    if (ctx.state === 'suspended') ctx.resume();

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(frequency * 0.5, ctx.currentTime + duration);

    gainNode.gain.setValueAtTime(volume, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  }, [getContext]);

  const playBidSound = useCallback(() => {
    playTone(880, 0.15, 'square', 0.2);
    setTimeout(() => playTone(1320, 0.1, 'square', 0.15), 50);
  }, [playTone]);

  const playSoldSound = useCallback(() => {
    [523, 659, 784, 1047].forEach((freq, i) => {
      setTimeout(() => playTone(freq, 0.2, 'triangle', 0.25), i * 80);
    });
  }, [playTone]);

  const playTimerTick = useCallback(() => {
    playTone(1000, 0.05, 'sine', 0.1);
  }, [playTone]);

  const playTimerWarning = useCallback(() => {
    playTone(1500, 0.1, 'sawtooth', 0.2);
  }, [playTone]);

  const playTimerEnd = useCallback(() => {
    [300, 250, 200].forEach((freq, i) => {
      setTimeout(() => playTone(freq, 0.3, 'sawtooth', 0.3), i * 150);
    });
  }, [playTone]);

  const playRevealSound = useCallback(() => {
    [440, 554, 659, 880].forEach((freq, i) => {
      setTimeout(() => playTone(freq, 0.15, 'sine', 0.2), i * 60);
    });
  }, [playTone]);

  const setEnabled = useCallback((enabled: boolean) => {
    enabledRef.current = enabled;
  }, []);

  const toggleEnabled = useCallback(() => {
    enabledRef.current = !enabledRef.current;
    return enabledRef.current;
  }, []);

  return {
    playBidSound,
    playSoldSound,
    playTimerTick,
    playTimerWarning,
    playTimerEnd,
    playRevealSound,
    setEnabled,
    toggleEnabled,
    enabled: enabledRef.current,
  };
}