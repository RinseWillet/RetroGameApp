const drawShip = (ctx, ship, options = {}) => {
    const { thrusting = false, color = 'white', shipSize = 30 } = options;
    const r = ship.r;
    const x = ship.x;
    const y = ship.y;
    const a = ship.a;
  
    ctx.strokeStyle = color;
    ctx.lineWidth = shipSize / 20;
    ctx.beginPath();
  
    ctx.moveTo(
      x + (4 / 3) * r * Math.cos(a),
      y - (4 / 3) * r * Math.sin(a)
    );

    ctx.lineTo(
      x - r * (Math.cos(a) + 0.6 * Math.sin(a)),
      y + r * (Math.sin(a) - 0.6 * Math.cos(a))
    );
  
    ctx.lineTo(
      x - 0.5 * r * (Math.cos(a) + Math.sin(a)),
      y + 0.5 * r * (Math.sin(a) - Math.cos(a))
    );
  
    ctx.lineTo(
      x - 0.5 * r * (Math.cos(a) - Math.sin(a)),
      y + 0.5 * r * (Math.sin(a) + Math.cos(a))
    );
  
    ctx.lineTo(
      x - r * (Math.cos(a) - 0.6 * Math.sin(a)),
      y + r * (Math.sin(a) + 0.6 * Math.cos(a))
    );
  
    ctx.closePath();
    ctx.stroke();
  
    if (thrusting) {
      ctx.strokeStyle = Math.random() < 0.2 ? 'white' : '#88ccff';
      ctx.lineWidth = shipSize / 22;
      ctx.beginPath();
      ctx.moveTo(
        x - 0.4 * r * (Math.cos(a) + Math.sin(a)),
        y + 0.4 * r * (Math.sin(a) - Math.cos(a))
      );
  
      ctx.lineTo(
        x - (1.2 + Math.random() * 0.4) * r * Math.cos(a),
        y + (1.2 + Math.random() * 0.4) * r * Math.sin(a)
      );
  
      ctx.lineTo(
        x - 0.4 * r * (Math.cos(a) - Math.sin(a)),
        y + 0.4 * r * (Math.sin(a) + Math.cos(a))
      );
  
      ctx.closePath();
      ctx.stroke();
    }
  }
  
  export default drawShip;
