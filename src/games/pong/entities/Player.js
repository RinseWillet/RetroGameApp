import Paddle from './Paddle';

export default class Player {
  constructor(canvasHeight) {
    this.paddle = new Paddle(1180, canvasHeight / 2 - 25, 10, 50);
  }

  update(keysDown, canvasHeight) {
    if (keysDown['ArrowUp']) {
      this.paddle.move(0, -6, canvasHeight);
    } else if (keysDown['ArrowDown']) {
      this.paddle.move(0, 6, canvasHeight);
    } else {
      this.paddle.move(0, 0, canvasHeight);
    }
  }

  render(ctx) {
    this.paddle.render(ctx);
  }
}