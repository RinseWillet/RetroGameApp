import { describe, it, expect, beforeEach } from 'vitest';
import Player from '../games/pong/entities/Player';

describe('Player', () => {
  let player;
  const height = 800;

  beforeEach(() => {
    player = new Player(height);
  });

  it('moves up when ArrowUp is pressed', () => {
    const initialY = player.paddle.y;
    player.update({ ArrowUp: true }, height);
    expect(player.paddle.y).toBeLessThan(initialY);
  });

  it('moves down when ArrowDown is pressed', () => {
    const initialY = player.paddle.y;
    player.update({ ArrowDown: true }, height);
    expect(player.paddle.y).toBeGreaterThan(initialY);
  });

  it('does not move without input', () => {
    const initialY = player.paddle.y;
    player.update({}, height);
    expect(player.paddle.y).toBe(initialY);
  });
});