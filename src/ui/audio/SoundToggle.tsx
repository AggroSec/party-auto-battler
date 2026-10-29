import { useSyncExternalStore } from 'react';
import { Icon } from '../game/Icon.tsx';
import { setSoundEnabled, soundEnabled, subscribeSound } from './sfx.ts';

export function useSoundEnabled(): boolean {
  return useSyncExternalStore(subscribeSound, soundEnabled, soundEnabled);
}

/** Mute / unmute button, remembered between visits. */
export function SoundToggle({ className, withLabel = false }: { className?: string; withLabel?: boolean }) {
  const on = useSoundEnabled();
  const label = on ? 'Sound on' : 'Sound off';
  return (
    <button
      type="button"
      className={`sound-toggle${on ? '' : ' off'}${className ? ` ${className}` : ''}`}
      aria-pressed={on}
      aria-label={withLabel ? undefined : label}
      title={on ? 'Sound on (click to mute)' : 'Sound off (click to unmute)'}
      onClick={() => setSoundEnabled(!on)}
    >
      <Icon id={on ? 'sound-on' : 'sound-off'} />
      {withLabel && ` ${label}`}
    </button>
  );
}
