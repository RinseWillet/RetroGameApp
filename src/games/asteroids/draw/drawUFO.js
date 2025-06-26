const drawUFO = (ctx, ufo) => {
	if (!ufo.isAlive) return;

	// Draw UFO body (simple oval)
	ctx.save();
	ctx.strokeStyle = 'white';
	ctx.lineWidth = 2;
	ctx.beginPath();
	ctx.ellipse(
		ufo.x + ufo.width / 2,
		ufo.y + ufo.height / 2,
		ufo.width / 2,
		ufo.height / 2,
		0,
		0,
		Math.PI * 2
	);
	ctx.stroke();

	// Draw dome
	ctx.beginPath();
	ctx.ellipse(
		ufo.x + ufo.width / 2,
		ufo.y + ufo.height / 2.2,
		ufo.width / 4,
		ufo.height / 3,
		0,
		0,
		Math.PI
	);
	ctx.stroke();

	// Draw bullets
	ctx.fillStyle = 'red';
	ufo.bullets.forEach(bullet => {
		ctx.beginPath();
		ctx.arc(bullet.x, bullet.y, 2, 0, Math.PI * 2);
		ctx.fill();
	});

	ctx.restore();
};

export default drawUFO;
