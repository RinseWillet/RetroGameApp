import {wrapAround} from '../utils/mathUtils.js';
import {splitAsteroid} from './splitAsteroid.js';
import {scoreForRadius} from './scoreForRadius.js';
import {getAsteroidPolygon} from '../entities/getPolygons.js';
import {pointInPolygon} from '../utils/collisionUtils.js';
import {spawnParticles} from '../entities/debris.js';

export const updateAsteroids = (asteroidsState, canvas) => {
	const {asteroidsRef} = asteroidsState;
	asteroidsRef.current.forEach(ast => {
		ast.x += ast.xVel;
		ast.y += ast.yVel;
		ast.angle += ast.rotationSpeed;
		wrapAround(ast, canvas);
	});
};

// Helper function outside updateBulletAsteroidsHit
export const handleAsteroidHit = (bullet, asteroid, asteroidsRef, particlesRef, scoreRef, playExplosion, updateHeartbeatInterval) => {
	const r = asteroid.r;
	scoreRef.current += scoreForRadius(r);
	let explosionType;
	if (r > 50) {
		explosionType = 'big';
	} else if (r > 25) {
		explosionType = 'medium';
	} else {
		explosionType = 'small';
	}
	playExplosion(explosionType);

	const children = splitAsteroid(asteroid);
	if (children.length > 0) {
		asteroidsRef.current.push(...children);
	} else {
		particlesRef.current.push(...spawnParticles(
			asteroid.x, asteroid.y, 15, ['white', '#cccccc', '#88ccff']
		));
	}
	updateHeartbeatInterval();
};

export const updateBulletAsteroidsHit = (bulletsRef, asteroidsState, canvas, scoreRef, playExplosion, updateHeartbeatInterval) => {
	const {asteroidsRef, particlesRef} = asteroidsState;
	for (let i = bulletsRef.current.length - 1; i >= 0; i--) {
		const bullet = bulletsRef.current[i];
		for (let j = asteroidsRef.current.length - 1; j >= 0; j--) {
			const asteroid = asteroidsRef.current[j];
			const poly = getAsteroidPolygon(asteroid);
			if (pointInPolygon({x: bullet.x, y: bullet.y}, poly)) {
				handleAsteroidHit(
					bullet, asteroid, asteroidsRef, particlesRef, scoreRef, playExplosion, updateHeartbeatInterval
				);
				asteroidsRef.current.splice(j, 1);
				bulletsRef.current.splice(i, 1);
				break;
			}
		}
	}

	bulletsRef.current = bulletsRef.current.filter(b =>
		b.life > 0 &&
		b.x >= 0 && b.x <= canvas.width &&
		b.y >= 0 && b.y <= canvas.height
	);
};
