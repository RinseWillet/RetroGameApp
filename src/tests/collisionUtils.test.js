import { describe, it, expect } from 'vitest';
import { pointInPolygon, polygonsIntersect } from './src/games/asteroids/utils/collisionUtils';

describe('pointInPolygon', () => {
  const square = [
    { x: 0, y: 0 }, { x: 0, y: 10 },
    { x: 10, y: 10 }, { x: 10, y: 0 }
  ];

  it('returns true for point inside polygon', () => {
    expect(pointInPolygon({ x: 5, y: 5 }, square)).toBe(true);
  });

  it('returns false for point outside polygon', () => {
    expect(pointInPolygon({ x: 15, y: 5 }, square)).toBe(false);
  });
});

describe('polygonsIntersect', () => {
  const squareA = [
    { x: 0, y: 0 }, { x: 0, y: 5 },
    { x: 5, y: 5 }, { x: 5, y: 0 }
  ];
  const squareB = [
    { x: 3, y: 3 }, { x: 3, y: 8 },
    { x: 8, y: 8 }, { x: 8, y: 3 }
  ];
  const squareC = [
    { x: 6, y: 6 }, { x: 6, y: 9 },
    { x: 9, y: 9 }, { x: 9, y: 6 }
  ];

  it('detects intersecting polygons', () => {
    expect(polygonsIntersect(squareA, squareB)).toBe(true);
  });

  it('detects non-intersecting polygons', () => {
    expect(polygonsIntersect(squareA, squareC)).toBe(false);
  });
});