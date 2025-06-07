import Paddle from './Paddle';

export default class Computer {
  constructor(canvasHeight) {
    this.paddle = new Paddle(10, canvasHeight / 2 - 25, 10, 50);
  }

  update(ball, canvasHeight) {
    const targetY = ball.y;
    let diff = -((this.paddle.y + this.paddle.height / 2) - targetY);

    if (diff < 0 && diff < -6) diff = -5;
    if (diff > 0 && diff > 6) diff = 5;

    this.paddle.move(0, diff, canvasHeight);
  }

  render(ctx) {
    this.paddle.render(ctx);
  }
}
