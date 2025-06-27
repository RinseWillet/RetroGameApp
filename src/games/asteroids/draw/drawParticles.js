const drawParticles = (ctx, particles) => {
    particles.forEach(p => {
      ctx.save();
      ctx.shadowBlur = 5;
      ctx.shadowColor = p.color;
      ctx.fillStyle = p.color || 'white';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  };
  
  export default drawParticles;
