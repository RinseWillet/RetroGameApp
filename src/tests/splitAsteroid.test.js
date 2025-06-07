import { describe, it, expect } from 'vitest';
import { splitAsteroid } from '../games/asteroids/logic/splitAsteroid';

describe('splitAsteroid', () => {
  it('returns 2 smaller asteroids for large input', () => {
    const big = { r: 50, x: 100, y: 100 };
    const result = splitAsteroid(big);
    expect(result).toHaveLength(2);
    expect(result[0].r).toBe(25);
  });

  it('returns [] for small asteroid', () => {
    const small = { r: 20 };
    expect(splitAsteroid(small)).toEqual([]);
  });
});