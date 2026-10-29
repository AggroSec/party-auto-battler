import { describe, expect, it } from 'vitest';
import attribution from '../../assets/ATTRIBUTION.md?raw';
import { ICONS } from '../../assets/icons.ts';
import { buildRunContext } from '../../data/content.ts';
import { CLASS_IDS } from '../../data/classes.ts';
import { classStyle } from './classStyle.ts';

const content = buildRunContext().content;

describe('icons', () => {
  it('gives every base, advanced and tertiary class its base class icon', () => {
    for (const id of CLASS_IDS) expect(classStyle(content, id).icon).toBe(id);
    for (const [id, adv] of Object.entries(content.advancedClasses)) expect(classStyle(content, id).icon).toBe(adv.baseClassId);
    for (const [id, tert] of Object.entries(content.tertiaryClasses)) expect(classStyle(content, id).icon).toBe(tert.baseClassId);
  });

  it('credits every icon in ATTRIBUTION.md', () => {
    for (const [id, icon] of Object.entries(ICONS)) {
      expect(attribution).toContain(`\`${id}\`: "${icon.name}" by ${icon.author}, ${icon.url}, CC BY 3.0`);
    }
  });
});
