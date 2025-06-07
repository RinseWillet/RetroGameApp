import { describe, it, expect } from 'vitest';
import { spawnParticles, spawnShipDebris } from '../games/asteroids/entities/debris';

describe('spawnParticles', () => {
  it('generates the specified number of particles', () => {
    const particles = spawnParticles(200, 300, 10);
    expect(particles).toHaveLength(10);
  });

  it('each particle has expected properties', () => {
    const [p] = spawnParticles(100, 100, 1);
    expect(p).toMatchObject({
      x: 100,
      y: 100,
      xVel: expect.any(Number),
      yVel: expect.any(Number),
      life: expect.any(Number),
      size: expect.any(Number),
      color: expect.any(String),
    });
  });
});

describe('spawnShipDebris', () => {
    const mockShip = {
      x: 500,
      y: 300,
      r: 15,
      a: Math.PI / 2, // 90 degrees
    };
  
    it('generates 5 debris chunks', () => {
      const debris = spawnShipDebris(mockShip);
      expect(debris).toHaveLength(5);
    });
  
    it('each debris chunk has expected properties', () => {
      const [d] = spawnShipDebris(mockShip);
      expect(d).toMatchObject({
        x: expect.any(Number),
        y: expect.any(Number),
        xVel: expect.any(Number),
        yVel: expect.any(Number),
        life: expect.any(Number),
        maxLife: expect.any(Number),
        size: expect.any(Number),
        angle: expect.any(Number),
        rotationSpeed: expect.any(Number),
      });
    });
  });