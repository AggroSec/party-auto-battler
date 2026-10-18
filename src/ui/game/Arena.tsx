import type { RunContent } from '../../engine/run/index.ts';
import { classStyle } from './classStyle.ts';
import { className } from './names.ts';
import type { Fx, Frame, UnitView } from './playback.ts';

const STAT_ICON = { atk: '⚔️', def: '🛡️', spd: '💨' } as const;

/** Floating text for a unit's effects this frame, merged so busy frames stay readable. */
export function floatsFor(fx: Fx[]): { text: string; cls: string }[] {
  let damage = 0, absorbed = 0, heal = 0, shield = 0, taunt = false, hasDamage = false;
  const stats = new Map<keyof typeof STAT_ICON, number>();
  let cooldown = 0;
  for (const f of fx) {
    if (f.kind === 'damage') {
      hasDamage = true;
      damage += f.value;
      absorbed += f.absorbed;
    } else if (f.kind === 'heal') heal += f.value;
    else if (f.kind === 'shield') shield += f.value;
    else if (f.kind === 'stat') stats.set(f.stat, (stats.get(f.stat) ?? 0) + f.value);
    else if (f.kind === 'cooldown') cooldown += f.turns;
    else if (f.kind === 'taunt') taunt = true;
  }
  const out: { text: string; cls: string }[] = [];
  if (hasDamage) out.push({ text: damage > 0 ? `-${damage}` : `(${absorbed})`, cls: 'dmg' });
  if (heal > 0) out.push({ text: `+${heal}`, cls: 'heal' });
  if (shield > 0) out.push({ text: `🛡${shield}`, cls: 'shield' });
  if (taunt) out.push({ text: 'Taunt!', cls: 'taunt' });
  const statText = [...stats]
    .filter(([, v]) => v !== 0)
    .map(([k, v]) => `${STAT_ICON[k]}${v > 0 ? '+' : ''}${v}`)
    .join(' ');
  if (statText) out.push({ text: statText, cls: [...stats.values()].some((v) => v < 0) ? 'debuff' : 'buff' });
  if (cooldown !== 0) out.push({ text: cooldown < 0 ? '⏩ hasted' : '⏸ delayed', cls: 'buff' });
  return out;
}

function ArenaUnit({ unit, frame, frameIndex, content }: { unit: UnitView; frame: Frame; frameIndex: number; content: RunContent }) {
  const style = classStyle(content, unit.classId);
  const fx = frame.fx.filter((f) => f.target === unit.id);
  const acting = frame.actor === unit.id;
  const hit = fx.some((f) => f.kind === 'damage' && (f.value > 0 || f.absorbed > 0));
  // The ability name, else the first trigger this unit fired (e.g. "Second Wind").
  const trigger = fx.find((f) => f.kind === 'trigger');
  const callout = acting && frame.ability ? frame.ability : trigger?.kind === 'trigger' ? trigger.label : null;
  const hpPct = Math.max(0, (unit.hp / unit.maxHp) * 100);
  const hpFromPct = Math.max(0, (unit.hpFrom / unit.maxHp) * 100);
  const shieldPct = Math.min(100, (unit.shield / unit.maxHp) * 100);
  const gaugePct = Math.min(100, unit.gauge);
  const gaugeFromPct = Math.min(100, unit.gaugeFrom);
  const cls = [
    'arena-unit',
    unit.side,
    `${unit.pos.row}-${unit.pos.col}`,
    unit.alive ? '' : 'dead',
    acting ? 'acting' : '',
    acting && frame.ability ? 'casting' : '',
    hit ? 'hit' : '',
    frame.attacked.includes(unit.id) ? 'targeted' : '',
    unit.taunt > 0 ? 'taunting' : '',
    unit.summoned ? 'summoned' : '',
    fx.some((f) => f.kind === 'summon') ? 'spawning' : '',
  ].join(' ');
  return (
    <div className={cls} style={{ '--class-color': style.color } as React.CSSProperties}>
      {/* Re-keyed every frame so the CSS animations replay. */}
      <div className="arena-body" key={`b${frameIndex}`}>
        <span className="avatar" aria-hidden>
          {style.glyph}
        </span>
        <span className="arena-name">{unit.name}</span>
        <span className="arena-class">{className(content, unit.classId)}</span>
        <div className="hp-bar" role="meter" aria-label={`${unit.name} HP`} aria-valuenow={unit.hp} aria-valuemin={0} aria-valuemax={unit.maxHp}>
          <span className="hp" style={{ '--from': `${hpFromPct}%`, '--to': `${hpPct}%` } as React.CSSProperties} />
          {shieldPct > 0 && <span className="shield-bar" style={{ width: `${shieldPct}%` }} />}
          <span className="hp-text">
            {unit.hp}/{unit.maxHp}
            {unit.shield > 0 ? ` +${unit.shield}` : ''}
          </span>
        </div>
        {unit.alive && (
          <div
            className={`gauge-bar${gaugePct >= 100 ? ' full' : ''}`}
            role="meter"
            aria-label={`${unit.name} action gauge`}
            aria-valuenow={Math.round(gaugePct)}
            aria-valuemin={0}
            aria-valuemax={100}
            title={`Action gauge: fills by SPD (${unit.spd}) each tick, acts at 100`}
          >
            <span className="gauge" style={{ '--from': `${gaugeFromPct}%`, '--to': `${gaugePct}%` } as React.CSSProperties} />
            <span className="gauge-spd">💨{unit.spd}</span>
          </div>
        )}
        {unit.taunt > 0 && (
          <span className="taunt-icon" title="Taunting: enemies must target this unit">
            🎯
          </span>
        )}
      </div>
      {callout && (
        <span className={`callout ${acting && frame.ability ? '' : 'trigger'}`} key={`c${frameIndex}`}>
          {callout}
        </span>
      )}
      <div className="floats" key={`f${frameIndex}`} aria-hidden>
        {floatsFor(fx).map((t, i) => (
          <span key={i} className={`float ${t.cls}`} style={{ animationDelay: `${i * 90}ms` }}>
            {t.text}
          </span>
        ))}
      </div>
    </div>
  );
}

function Side({ frame, frameIndex, side, content }: { frame: Frame; frameIndex: number; side: 'player' | 'enemy'; content: RunContent }) {
  const units = Object.values(frame.units).filter((u) => u.side === side && !u.replaced);
  return (
    <div className={`arena-side ${side}`}>
      {units.map((u) => (
        <ArenaUnit key={u.id} unit={u} frame={frame} frameIndex={frameIndex} content={content} />
      ))}
    </div>
  );
}

/**
 * The battlefield: enemy on top (back row furthest away), player below with
 * the front rows facing each other across the middle.
 */
export function Arena({ frame, frameIndex, content, duration }: { frame: Frame; frameIndex: number; content: RunContent; duration: number }) {
  return (
    <div className="arena" style={{ '--beat': `${Math.max(250, duration)}ms` } as React.CSSProperties}>
      <Side frame={frame} frameIndex={frameIndex} side="enemy" content={content} />
      <div className="arena-divider" aria-hidden>
        {frame.overtime ? <span className="overtime">⏳ Sudden death! −{Math.round(frame.overtime.percent * 100)}% max HP</span> : <span>⚔️</span>}
      </div>
      <Side frame={frame} frameIndex={frameIndex} side="player" content={content} />
    </div>
  );
}
