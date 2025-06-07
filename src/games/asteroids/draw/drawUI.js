import drawShip from "./drawShip";

const drawUI = (ctx, score, lives, cooldown, shipSize = 30) => {
    ctx.fillStyle = 'white';
    ctx.font = '20px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`Score: ${score}`, ctx.canvas.width / 2, 40);
  
    // Lives
    ctx.textAlign = 'left';
    const r = shipSize / 2;
    for (let i = 0; i < lives; i++) {
        const x = 20 + i * (shipSize / 2 + 10);
        const y = 60;
        drawShip(ctx, { x, y, a: Math.PI / 2, r: shipSize / 2 }, { thrusting: false, color: 'white', shipSize });
      }
  
    // Hyperspace Cooldown
    if (cooldown > 0) {
      const alpha = (cooldown / 180).toFixed(2);
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.font = '15px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`Hyperspace cooling down...`, ctx.canvas.width / 2, 70);
    }
  }
  
  export default drawUI;