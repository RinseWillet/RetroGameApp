import { describe, it, expect } from 'vitest';
import { scoreForRadius } from '../games/asteroids/logic/scoreForRadius';

describe('scoreForRadius', () => {
  it('returns 20 for large asteroid', () => {
    expect(scoreForRadius(80)).toBe(20);
  });

  it('returns 50 for medium asteroid', () => {
    expect(scoreForRadius(40)).toBe(50);
  });

  it('returns 100 for small asteroid', () => {
    expect(scoreForRadius(10)).toBe(100);
  });
});
