import { describe, expect, it } from 'vitest';
import { cropsFrom, fitWithin, nextTurn, turnedSize } from '../album-scan';

describe('cropsFrom', () => {
  it('turns 0–1000 boxes into pixel crops with a small margin, in reading order', () => {
    const crops = cropsFrom([
      { box_2d: [100, 550, 450, 950], turn: 0 },  // top right
      { box_2d: [100, 50, 450, 450], turn: 90 },  // top left
      { box_2d: [550, 50, 950, 950], turn: 0 },   // bottom, full width
    ], 2000, 1000, 0);
    expect(crops).toEqual([
      { x: 100, y: 100, w: 800, h: 350, turn: 90 },
      { x: 1100, y: 100, w: 800, h: 350, turn: 0 },
      { x: 100, y: 550, w: 1800, h: 400, turn: 0 },
    ]);
  });
  it('keeps crops inside the picture and fixes boxes given backwards', () => {
    expect(cropsFrom([{ box_2d: [1000, 1000, -20, 0], turn: 0 }], 1000, 1000, 0.05)).toEqual([{ x: 0, y: 0, w: 1000, h: 1000, turn: 0 }]);
  });
  it('drops specks, broken boxes and the same photo found twice', () => {
    const crops = cropsFrom([
      { box_2d: [0, 0, 10, 10] },
      { box_2d: [0, 0, 500] },
      { box_2d: ['a', 0, 500, 500] },
      { box_2d: [100, 100, 600, 600], turn: 45 },
      { box_2d: [110, 110, 590, 590], turn: 0 },
      null,
    ], 1000, 1000, 0);
    expect(crops).toEqual([{ x: 100, y: 100, w: 500, h: 500, turn: 0 }]);
  });
  it('returns nothing for nonsense', () => {
    expect(cropsFrom('nope', 100, 100)).toEqual([]);
    expect(cropsFrom([{ box_2d: [0, 0, 500, 500] }], 0, 100)).toEqual([]);
  });
});

describe('turning and sizing', () => {
  it('cycles through quarter turns and swaps sides when sideways', () => {
    expect(nextTurn(0)).toBe(90);
    expect(nextTurn(270)).toBe(0);
    expect(turnedSize({ w: 300, h: 200, turn: 90 })).toEqual({ w: 200, h: 300 });
    expect(turnedSize({ w: 300, h: 200, turn: 180 })).toEqual({ w: 300, h: 200 });
  });
  it('shrinks big pages but never enlarges small ones', () => {
    expect(fitWithin(4800, 3600)).toEqual({ w: 2400, h: 1800 });
    expect(fitWithin(800, 600)).toEqual({ w: 800, h: 600 });
  });
});
