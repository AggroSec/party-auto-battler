import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { GLOSSARY, segmentRules, type Term } from './glossary.ts';

const canHover = () => globalThis.matchMedia?.('(hover: hover)').matches ?? false;

/**
 * A glossary term inside rules text: tap (or hover, with a mouse) to explain
 * it. A span rather than a button, because rules text also appears inside
 * buttons (talent choices, shop offers); tapping a term doesn't press those.
 */
function TermLink({ term, text }: { term: Term; text: string }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  const ref = useRef<HTMLSpanElement>(null);
  const tip = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: Event) => {
      if (e instanceof KeyboardEvent ? e.key === 'Escape' : !ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const hide = () => setOpen(false);
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', close);
    window.addEventListener('scroll', hide, true);
    return () => {
      document.removeEventListener('pointerdown', close);
      document.removeEventListener('keydown', close);
      window.removeEventListener('scroll', hide, true);
    };
  }, [open]);

  // Place the bubble under the word, kept inside the viewport. It is first
  // rendered hidden at the top-left so it measures at its full width, and it
  // lives in <body> because transformed ancestors (pop-in animations) would
  // otherwise anchor position: fixed to themselves.
  useLayoutEffect(() => {
    if (!open || !ref.current || !tip.current) return setPos(null);
    const r = ref.current.getBoundingClientRect();
    const w = tip.current.offsetWidth;
    const h = tip.current.offsetHeight;
    const left = Math.min(Math.max(8, r.left + r.width / 2 - w / 2), window.innerWidth - w - 8);
    const below = r.bottom + 6;
    setPos({ left, top: below + h > window.innerHeight - 8 ? r.top - h - 6 : below });
  }, [open]);

  return (
    <span
      ref={ref}
      role="button"
      tabIndex={0}
      className="term"
      aria-expanded={open}
      onClick={(e) => {
        e.stopPropagation();
        setOpen((o) => !o);
      }}
      onKeyDown={(e) => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        e.preventDefault();
        e.stopPropagation();
        setOpen((o) => !o);
      }}
      onMouseEnter={() => canHover() && setOpen(true)}
      onMouseLeave={() => canHover() && setOpen(false)}
    >
      {text}
      {open &&
        createPortal(
          <span ref={tip} role="tooltip" className="term-tip" style={pos ? { left: pos.left, top: pos.top } : { left: 0, top: 0, visibility: 'hidden' }}>
            <strong>{term.term}:</strong> {term.text}
          </span>,
          document.body,
        )}
    </span>
  );
}

/** Rules text with glossary terms made explainable. */
export function Rules({ text }: { text: string }) {
  return (
    <>
      {segmentRules(text).map((s, i) => (typeof s === 'string' ? s : <TermLink key={i} term={s.term} text={s.text} />))}
    </>
  );
}

/** Every term in one place, from the title screen or the in-run "?" button. */
export function Glossary({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="glossary-backdrop" onClick={onClose}>
      <section className="glossary" role="dialog" aria-modal="true" aria-label="Glossary" onClick={(e) => e.stopPropagation()}>
        <header>
          <h2>Glossary</h2>
          <button type="button" className="close" onClick={onClose} aria-label="Close glossary">
            ✕
          </button>
        </header>
        <p className="muted small">Underlined words in unit, item and talent text explain themselves when tapped.</p>
        <dl>
          {GLOSSARY.map((t) => (
            <div key={t.id}>
              <dt>{t.term}</dt>
              <dd>{t.text}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
