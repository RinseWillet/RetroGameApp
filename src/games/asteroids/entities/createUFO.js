// src/games/asteroids/entities/createUFO.js
const createUFO = (width, height) => {
	const ufo = {
		x: Math.random() < 0.5 ? 0 : width,
		y: Math.random() * height * 0.8,
		width: 40,
		height: 16,
		speed: 2 + Math.random() * 2,
		direction: 0, // will be set below
		isAlive: true,
		shootCooldown: 120,
		bullets: [],
		update(player, width, height) {
			this.x += this.speed * this.direction;
			if (this.x < -this.width || this.x > width + this.width) {
				this.isAlive = false;
			}
			if (this.shootCooldown > 0) {
				this.shootCooldown--;
			} else {
				this.shootAt(player);
				this.shootCooldown = 120 + Math.floor(Math.random() * 60);
			}
			this.bullets.forEach(bullet => {
				bullet.x += bullet.vx;
				bullet.y += bullet.vy;
			});
			this.bullets = this.bullets.filter(
				b => b.x > 0 && b.x < width && b.y > 0 && b.y < height
			);
		},
		shootAt(player) {
			if (!player) return;
			const dx = player.x - this.x;
			const dy = player.y - this.y;
			const mag = Math.sqrt(dx * dx + dy * dy);
			const speed = 5;
			this.bullets.push({
				x: this.x,
				y: this.y,
				vx: (dx / mag) * speed,
				vy: (dy / mag) * speed,
			});
		}
	};
	ufo.direction = ufo.x === 0 ? 1 : -1;
	return ufo;
};

export default createUFO;
