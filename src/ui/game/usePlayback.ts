import { useEffect, useState } from 'react';
import type { Frame } from './playback.ts';
import { load, save } from './storage.ts';

export type Speed = 1 | 2;

const SPEED_KEY = 'speed';
const isSpeed = (x: unknown): x is Speed => x === 1 || x === 2;

/** Base time a frame stays on screen at 1x, in ms. */
export function frameDuration(frame: Frame | undefined): number {
  if (!frame) return 0;
  switch (frame.kind) {
    case 'start':
      return frame.fx.length > 0 ? 900 : 600;
    case 'overtime':
      return 1000;
    case 'end':
      return 0;
    case 'turn':
      return frame.ability ? 950 : 650;
  }
}

/** Steps through frames on a timer. Speed is remembered between fights. */
export function usePlayback(frames: Frame[]) {
  const last = Math.max(0, frames.length - 1);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeedState] = useState<Speed>(() => load(SPEED_KEY, isSpeed) ?? 1);

  useEffect(() => {
    if (!playing || index >= last) return;
    const t = setTimeout(() => setIndex((i) => Math.min(last, i + 1)), frameDuration(frames[index]) / speed);
    return () => clearTimeout(t);
  }, [playing, index, last, speed, frames]);

  const setSpeed = (s: Speed) => {
    setSpeedState(s);
    save(SPEED_KEY, s);
  };

  return {
    index,
    frame: frames[index],
    done: index >= last,
    playing,
    speed,
    /** Current frame duration at the chosen speed (for CSS animation timing). */
    duration: frameDuration(frames[index]) / speed,
    togglePlay: () => setPlaying((p) => !p),
    setSpeed,
    skip: () => setIndex(last),
    restart: () => {
      setIndex(0);
      setPlaying(true);
    },
  };
}
