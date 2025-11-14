export const updateBullets = (bulletsRef) => {
	bulletsRef.current.forEach(bullet => {
		bullet.x += bullet.xVel;
		bullet.y += bullet.yVel;
		bullet.life--;
	});
};
