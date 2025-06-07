const drawPolygon = (ctx, points, color = 'lime') => {
    if (!points?.length) return;
  
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }

  export default drawPolygon;
