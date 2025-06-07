const drawShipDebris = (ctx, debris) => {
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
  
    debris.forEach(d => {
      const alpha = (d.life / d.maxLife) ** 2;
      ctx.save();
      ctx.translate(d.x, d.y);
      ctx.rotate(d.angle);
      ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.beginPath();
      ctx.moveTo(-d.size * 2, 0);
      ctx.lineTo(d.size * 2, 0);
      ctx.stroke();
      ctx.restore();
    });
  };
  
  export default drawShipDebris;
  