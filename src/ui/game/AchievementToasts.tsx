import { useEffect } from 'react';
import { rewardText } from './CollectionScreen.tsx';
import type { Game } from './useGame.ts';

/** Shows newly earned achievements one at a time; tap to dismiss (or wait). */
export function AchievementToasts({ game }: { game: Game }) {
  const toast = game.toasts[0];
  const { dismissToast } = game;
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(dismissToast, 6000);
    return () => clearTimeout(timer);
  }, [toast, dismissToast]);
  if (!toast) return null;
  return (
    <button type="button" className="toast" onClick={dismissToast} aria-live="polite">
      <span className="toast-title">🏅 Achievement: {toast.name}</span>
      <span className="small">{toast.description}</span>
      <span className="small reward">Unlocked: {rewardText(toast.reward, game)}</span>
      {game.toasts.length > 1 && <span className="muted small">+{game.toasts.length - 1} more</span>}
    </button>
  );
}
