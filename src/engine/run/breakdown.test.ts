import { describe, expect, it } from 'vitest';
import { buildRunContext } from '../../data/content.ts';
import type { ActionTally } from '../events.ts';
import { breakdownRows } from './breakdown.ts';

const { content } = buildRunContext();
const tally = (over: Partial<ActionTally> & Pick<ActionTally, 'key' | 'kind' | 'label'>): ActionTally => ({ uses: 0, damage: 0, healing: 0, shielding: 0, afflictions: 0, kills: 0, ...over });
const none = { cooldown: 0, unmet: 0, silenced: 0, above: 0 };

describe('fight breakdown rows', () => {
  it('labels rules by their text and explains the ones that never fired', () => {
    const rows = breakdownRows(
      [
        tally({ key: 'rule:0', kind: 'rule', label: 'Ward', rule: 0, uses: 13, shielding: 700, healing: 2, passed: none }),
        tally({ key: 'rule:1', kind: 'rule', label: 'Heal', rule: 1, passed: { ...none, above: 13 } }),
        tally({ key: 'rule:2', kind: 'rule', label: 'Mend', rule: 2, uses: 2, passed: { ...none, unmet: 4, cooldown: 1 } }),
        tally({ key: 'attack', kind: 'attack', label: 'Basic attack' }),
      ],
      [{ skill: 'ward' }, { skill: 'heal', when: { kind: 'allyHpBelow', percent: 60 } }, { skill: 'mend' }],
      content,
    );
    expect(rows.map((r) => [r.label, r.support, r.note])).toEqual([
      ['1. Ward', 702, undefined],
      ['2. Heal, if an ally below 60% HP', 0, 'never fired: a rule above fired first ×13'],
      ['3. Mend', 0, 'skipped: condition not met ×4, on cooldown ×1'],
    ]);
  });

  it('classic units list only what happened', () => {
    const rows = breakdownRows([tally({ key: 'ability:x', kind: 'ability', label: 'Cleave' }), tally({ key: 'attack', kind: 'attack', label: 'Basic attack', uses: 4, damage: 40 })], undefined, content);
    expect(rows.map((r) => r.label)).toEqual(['Basic attack']);
  });
});
