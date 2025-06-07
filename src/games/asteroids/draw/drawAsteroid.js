const drawAsteroid = (ctx, ast) => {
    ctx.save();
    ctx.translate(ast.x, ast.y);
    ctx.rotate(ast.angle);
  
    ctx.strokeStyle = 'slategrey';
    ctx.lineWidth = 2;
    ctx.beginPath();
  
    const firstX = ast.r * ast.vertices[0] * Math.cos(0);
    const firstY = ast.r * ast.vertices[0] * Math.sin(0);
    ctx.moveTo(firstX, firstY);
  
    for (let i = 1; i < ast.sides; i++) {
      const angle = i * Math.PI * 2 / ast.sides;
      const x = ast.r * ast.vertices[i] * Math.cos(angle);
      const y = ast.r * ast.vertices[i] * Math.sin(angle);
      ctx.lineTo(x, y);
    }
  
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }

  export default drawAsteroid;
  