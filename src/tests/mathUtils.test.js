import { describe, it, expect } from 'vitest';
import { dist, wrapAround } from './src/games/asteroids/utils/mathUtils';

describe('dist', () => {
  it('computes the distance between two points correctly', () => {
    expect(dist(0, 0, 3, 4)).toBe(5); // classic 3-4-5 triangle
  });
});

describe('wrapAround', () => {
  it('wraps object to opposite side of canvas when out of bounds', () => {
    const canvas = { width: 100, height: 100 };
    const obj = { x: -10, y: -10, r: 5 };
    wrapAround(obj, canvas);
    expect(obj.x).toBe(105);
    expect(obj.y).toBe(105);
  });
});