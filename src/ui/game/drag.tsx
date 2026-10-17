// Minimal pointer-event drag and drop. Works with mouse, pen and touch (the
// HTML5 drag API doesn't support touch). A press that doesn't move past a few
// pixels stays a normal click, so every draggable is also clickable.
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { decodeTarget, encodeTarget, type DragSource, type DropTarget } from './dropRules.ts';

const DRAG_THRESHOLD_PX = 6;
/** While dragging near the top or bottom edge, scroll the page (for small screens). */
const EDGE_PX = 70;
const EDGE_SCROLL_PX = 14;

interface ActiveDrag {
  source: DragSource;
  ghost: ReactNode;
  x: number;
  y: number;
  over: string | null;
}

interface DragApi {
  active: ActiveDrag | null;
  begin: (e: React.PointerEvent, source: DragSource, ghost: ReactNode) => void;
  canDrop: (source: DragSource, target: DropTarget) => boolean;
  /** True right after `source` was dragged, so the click that ends the drag can be ignored. */
  justDragged: (source: DragSource) => boolean;
}

const DragContext = createContext<DragApi | null>(null);

function useDragApi(): DragApi {
  const api = useContext(DragContext);
  if (!api) throw new Error('Drag hooks must be used inside <DragProvider>');
  return api;
}

function targetAt(x: number, y: number): string | null {
  const el = typeof document === 'undefined' ? null : document.elementFromPoint(x, y);
  return el?.closest<HTMLElement>('[data-drop]')?.dataset.drop ?? null;
}

export function DragProvider({
  children,
  canDrop,
  onDrop,
}: {
  children: ReactNode;
  canDrop: (source: DragSource, target: DropTarget) => boolean;
  onDrop: (source: DragSource, target: DropTarget) => void;
}) {
  const [active, setActive] = useState<ActiveDrag | null>(null);
  const pending = useRef<{ source: DragSource; ghost: ReactNode; x0: number; y0: number; started: boolean } | null>(null);
  const lastDrag = useRef({ at: 0, key: '' });
  const handlers = useRef({ canDrop, onDrop });
  useEffect(() => {
    handlers.current = { canDrop, onDrop };
  });

  const end = useCallback((x: number, y: number, drop: boolean) => {
    const p = pending.current;
    pending.current = null;
    if (!p?.started) return;
    lastDrag.current = { at: performance.now(), key: JSON.stringify(p.source) };
    setActive(null);
    const target = drop ? decodeTarget(targetAt(x, y)) : null;
    if (target && handlers.current.canDrop(p.source, target)) handlers.current.onDrop(p.source, target);
  }, []);

  useEffect(() => {
    const move = (e: PointerEvent) => {
      const p = pending.current;
      if (!p) return;
      if (!p.started) {
        if (Math.hypot(e.clientX - p.x0, e.clientY - p.y0) < DRAG_THRESHOLD_PX) return;
        p.started = true;
      }
      e.preventDefault();
      if (e.clientY < EDGE_PX) window.scrollBy(0, -EDGE_SCROLL_PX);
      else if (e.clientY > window.innerHeight - EDGE_PX) window.scrollBy(0, EDGE_SCROLL_PX);
      setActive({ source: p.source, ghost: p.ghost, x: e.clientX, y: e.clientY, over: targetAt(e.clientX, e.clientY) });
    };
    const up = (e: PointerEvent) => end(e.clientX, e.clientY, true);
    const cancel = (e: PointerEvent) => end(e.clientX, e.clientY, false);
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') end(0, 0, false);
    };
    window.addEventListener('pointermove', move, { passive: false });
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', cancel);
    window.addEventListener('keydown', key);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', cancel);
      window.removeEventListener('keydown', key);
    };
  }, [end]);

  const api: DragApi = {
    active,
    begin: (e, source, ghost) => {
      if (e.button !== 0) return;
      pending.current = { source, ghost, x0: e.clientX, y0: e.clientY, started: false };
    },
    canDrop,
    justDragged: (source) => lastDrag.current.key === JSON.stringify(source) && performance.now() - lastDrag.current.at < 250,
  };

  return (
    <DragContext.Provider value={api}>
      <div className={active ? 'dragging-root' : undefined}>{children}</div>
      {active && (
        <div className="drag-ghost" style={{ left: active.x, top: active.y }} aria-hidden>
          {active.ghost}
        </div>
      )}
    </DragContext.Provider>
  );
}

/**
 * Props for a draggable element. `onClick` runs for a plain press; it's
 * skipped when the press turned into a drag.
 */
export function useDraggable(source: DragSource, ghost: ReactNode, onClick?: () => void) {
  const api = useDragApi();
  const key = JSON.stringify(source);
  const dragging = api.active !== null && JSON.stringify(api.active.source) === key;
  return {
    dragging,
    props: {
      onPointerDown: (e: React.PointerEvent) => api.begin(e, source, ghost),
      onClick: () => {
        if (!api.justDragged(source)) onClick?.();
      },
    },
  };
}

/** State of a drop target during a drag: can it accept, and is the pointer over it. */
export function useDropTarget(target: DropTarget) {
  const api = useDragApi();
  const encoded = encodeTarget(target);
  const accepts = api.active !== null && api.canDrop(api.active.source, target);
  return {
    accepts,
    over: accepts && api.active?.over === encoded,
    props: { 'data-drop': encoded },
  };
}

/** Whether anything is being dragged right now (for showing the sell zone). */
export function useIsDragging(): DragSource | null {
  return useDragApi().active?.source ?? null;
}
