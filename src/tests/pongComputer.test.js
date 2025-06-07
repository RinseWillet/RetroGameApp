import { describe, it, expect, beforeEach } from 'vitest';
import Computer from '../games/pong/entities/Computer';

describe('Computer', () => {
  let computer;
  const height = 800;

  beforeEach(() => {
    computer = new Computer(height);
  });

  it('moves down if ball is below', () => {
    const ball = { y: computer.paddle.y + 100 };
    const initialY = computer.paddle.y;

    computer.update(ball, height);

    expect(computer.paddle.y).toBeGreaterThan(initialY);
  });

  it('moves up if ball is above', () => {
    const ball = { y: computer.paddle.y - 100 };
    const initialY = computer.paddle.y;

    computer.update(ball, height);

    expect(computer.paddle.y).toBeLessThan(initialY);
  });

  it('does not move if ball is aligned with paddle center', () => {
    // Align ball with the *center* of the paddle
    const paddleY = computer.paddle.y;
    const paddleHeight = computer.paddle.height;
    const ball = { y: paddleY + paddleHeight / 2 };
  
    const initialY = computer.paddle.y;
  
    computer.update(ball, height);
  
    expect(computer.paddle.y).toBe(initialY);
  });
});
