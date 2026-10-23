import type { RunError } from '../../engine/run/index.ts';

export const ERROR_TEXT: Record<RunError, string> = {
  notShopPhase: 'The run is over.',
  notEnoughGold: 'Not enough gold.',
  noSuchOffer: 'That offer is gone.',
  invalidSlot: 'Invalid slot.',
  slotOccupied: 'That slot is taken.',
  emptySlot: 'Nothing there.',
  boardFull: 'Your party is full (5 units). Sell someone first.',
  emptyBoard: 'Recruit at least one unit before fighting.',
  needsTarget: 'Drag it onto a unit, or select a unit first.',
  itemSlotsFull: 'That unit already has 2 items. Sell or move one first.',
  wrongClass: 'That is for a different class.',
  noSuchItem: 'No such item.',
  pendingChoice: 'Choose your level-up rewards before fighting.',
  noPendingChoice: 'Nothing to choose.',
  invalidChoice: 'Invalid choice.',
  maxLevel: 'That unit is already max level.',
  invalidAllocation: 'Invalid stat points.',
  notEnoughPoints: 'Not enough stat points.',
  alreadyEquipped: 'That unit already has one.',
};
