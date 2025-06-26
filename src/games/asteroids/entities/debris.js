export const spawnParticles = (x, y, count, colors) => {
	const newParticles = [];

	for (let i = 0; i < count; i++) {
		newParticles.push({
			x,
			y,
			xVel: (Math.random() - 0.5) * 6,
			yVel: (Math.random() - 0.5) * 6,
			life: Math.floor(Math.random() * 30) + 30,
			size: Math.random() * 2 + 0.5,
			color: colors[Math.floor(Math.random() * colors.length)]
		});
	}

	return newParticles;
};

export const spawnShipDebris = (ship) => {
	const debris = [];
	const points = [
		{x: ship.x + (4 / 3) * ship.r * Math.cos(ship.a), y: ship.y - (4 / 3) * ship.r * Math.sin(ship.a)},
		{
			x: ship.x - ship.r * (Math.cos(ship.a) + 0.6 * Math.sin(ship.a)),
			y: ship.y + ship.r * (Math.sin(ship.a) - 0.6 * Math.cos(ship.a))
		},
		{
			x: ship.x - 0.5 * ship.r * (Math.cos(ship.a) + Math.sin(ship.a)),
			y: ship.y + 0.5 * ship.r * (Math.sin(ship.a) - Math.cos(ship.a))
		},
		{
			x: ship.x - 0.5 * ship.r * (Math.cos(ship.a) - Math.sin(ship.a)),
			y: ship.y + 0.5 * ship.r * (Math.sin(ship.a) + Math.cos(ship.a))
		},
		{
			x: ship.x - ship.r * (Math.cos(ship.a) - 0.6 * Math.sin(ship.a)),
			y: ship.y + ship.r * (Math.sin(ship.a) + 0.6 * Math.cos(ship.a))
		}
	];

	points.forEach(p => {
		debris.push({
			x: p.x,
			y: p.y,
			xVel: (Math.random() - 0.5) * 8,
			yVel: (Math.random() - 0.5) * 8,
			life: 90,
			maxLife: 90,
			size: Math.random() * 2 + 1.5,
			angle: Math.random() * Math.PI * 2,
			rotationSpeed: (Math.random() - 0.5) * 0.1
		});
	});

	return debris;
};
