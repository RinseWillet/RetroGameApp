export default class Paddle {
    constructor(x, y, width, height) {
      this.x = x;
      this.y = y;
      this.width = width;
      this.height = height;
      this.y_speed = 0;
      this.x_speed = 0;
      this.score = 0;
    }
  
    move(dx, dy, canvasHeight) {
      this.x += dx;
      this.y += dy;
      this.x_speed = dx;
      this.y_speed = dy;
  
      if (this.y < 0) {
        this.y = 0;
        this.y_speed = 0;
      } else if (this.y + this.height > canvasHeight) {
        this.y = canvasHeight - this.height;
        this.y_speed = 0;
      }
    }
  
    render(ctx) {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(this.x, this.y, this.width, this.height);
    }
  }
  