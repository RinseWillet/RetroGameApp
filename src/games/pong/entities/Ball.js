export default class Ball {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 5;
    this.x_speed = 7;
    this.y_speed = 0;
  }

  reset(centerX, centerY, direction = 1) {
    this.x = centerX;
    this.y = centerY;
    this.x_speed = 7 * direction;
    this.y_speed = 0;
  }

  update(playerPaddle, computerPaddle, width, height, beep) {
    this.x += this.x_speed;
    this.y += this.y_speed;

    if (this.y - this.radius < 0) {
      this.y = this.radius;
      this.y_speed = -this.y_speed;
      beep(300, 0.2, 'square');
    } else if (this.y + this.radius > height) {
      this.y = height - this.radius;
      this.y_speed = -this.y_speed;
      beep(300, 0.2, 'square');
    }

    if (this.x < 0 || this.x > width) {
      const scoredOnLeft = this.x < 0;
      const scorer = scoredOnLeft ? playerPaddle : computerPaddle;   
      scorer.score++;
      this.reset(width / 2, height / 2, scoredOnLeft ? 1 : -1);
      beep(600, 0.4, 'triangle');
    }

    const top_x = this.x - this.radius;
    const bottom_x = this.x + this.radius;
    const top_y = this.y - this.radius;
    const bottom_y = this.y + this.radius;

    const paddle = top_x > width / 2 ? playerPaddle : computerPaddle;
    const paddleBounds = {
      left: paddle.x,
      right: paddle.x + paddle.width,
      top: paddle.y,
      bottom: paddle.y + paddle.height
    };

    if (
      bottom_x > paddleBounds.left &&
      top_x < paddleBounds.right &&
      bottom_y > paddleBounds.top &&
      top_y < paddleBounds.bottom
    ) {
      this.x_speed = top_x > width / 2 ? -7 : 7;
      this.y_speed += paddle.y_speed / 2;
      this.x += this.x_speed;
      beep(200, 0.2, 'square');
    }
  }

  render(ctx) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
  }
}
