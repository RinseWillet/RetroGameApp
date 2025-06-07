import { describe, it, expect, beforeEach, vi } from 'vitest';
import Ball from '../games/pong/entities/Ball';

describe('Ball', () => {
    let ball;
    const width = 1200;
    const height = 800;
    const centerX = width / 2;
    const centerY = height / 2;

    const mockBeep = vi.fn();

    const makePaddle = (x, y) => ({
        x,
        y,
        width: 20,
        height: 100,
        y_speed: 0,
        score: 0
    });

    beforeEach(() => {
        ball = new Ball(centerX, centerY);
        mockBeep.mockClear();
    });

    it('bounces off the top wall', () => {
        ball.y = ball.radius - 1;
        ball.y_speed = -5;

        ball.update(makePaddle(0, 0), makePaddle(0, 0), width, height, mockBeep);

        expect(ball.y_speed).toBeGreaterThan(0); // should reverse
        expect(mockBeep).toHaveBeenCalledWith(300, 0.2, 'square');
    });

    it('bounces off the bottom wall', () => {
        ball.y = height - ball.radius + 1;
        ball.y_speed = 5;

        ball.update(makePaddle(0, 0), makePaddle(0, 0), width, height, mockBeep);

        expect(ball.y_speed).toBeLessThan(0); // should reverse
        expect(mockBeep).toHaveBeenCalledWith(300, 0.2, 'square');
    });

    it('resets and gives point when ball goes off left', () => {
        const player = makePaddle(width - 30, centerY);
        const computer = makePaddle(10, centerY);

        ball.x = -ball.radius - 10;
        ball.update(player, computer, width, height, mockBeep);

        expect(player.score).toBe(1); 
        expect(ball.x).toBe(centerX);
        expect(ball.x_speed).toBe(7);
        expect(mockBeep).toHaveBeenCalledWith(600, 0.4, 'triangle');
    });

    it('resets and gives point when ball goes off right', () => {
        const player = makePaddle(width - 30, centerY);
        const computer = makePaddle(10, centerY);

        ball.x = width + ball.radius + 1;
        ball.update(player, computer, width, height, mockBeep);

        expect(computer.score).toBe(1);
        expect(ball.x).toBe(centerX);
        expect(ball.x_speed).toBe(-7);
        expect(mockBeep).toHaveBeenCalledWith(600, 0.4, 'triangle');
    });

    it('collides with paddle and bounces', () => {
        const player = makePaddle(width - 30, centerY - 50);
        const computer = makePaddle(10, centerY - 50);

        ball.x = player.x - ball.radius;
        ball.y = centerY;
        ball.x_speed = 7;

        ball.update(player, computer, width, height, mockBeep);

        expect(ball.x_speed).toBeLessThan(0); // bounced left
        expect(mockBeep).toHaveBeenCalledWith(200, 0.2, 'square');
    });
});
