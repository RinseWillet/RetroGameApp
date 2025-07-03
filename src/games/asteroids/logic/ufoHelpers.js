import createUFO from '../entities/createUFO.js';
import {FPS} from './constants.js';
import {spawnParticles} from '../entities/debris.js';

export const updateUFO = (ufoState, gameState, canvas, shipRef) => {
	const {ufoRef, ufoTimerRef} = ufoState;
	const {startedRef, gameOverRef} = gameState;

	if (!ufoRef.current && startedRef.current && !gameOverRef.current) {
		if (ufoTimerRef.current <= 0) {
			ufoRef.current = createUFO(canvas.width, canvas.height);
			// Next UFO in 20–40 seconds
			ufoTimerRef.current = FPS * (20 + Math.random() * 20);
		} else {
			ufoTimerRef.current--;
		}
	}

	// UFO update and despawn
	if (ufoRef.current) {
		ufoRef.current.update(shipRef.current, canvas.width, canvas.height);
		if (!ufoRef.current.isAlive) {
			ufoRef.current = null;
			ufoTimerRef.current = FPS * (20 + Math.random() * 20);
		}
	}
};

export const checkShipUFOCollision = (ufoState, shipState, soundFX) => {
	const {ufoRef} = ufoState;
	const {shipRef, shipExploding, invincible, shipDebrisRef, explosionTime, spawnShipDebris} = shipState;
	const {playExplosion} = soundFX;

	if (ufoRef.current && !shipExploding.current && !invincible.current) {
		const dx = shipRef.current.x - (ufoRef.current.x + ufoRef.current.width / 2);
		const dy = shipRef.current.y - (ufoRef.current.y + ufoRef.current.height / 2);
		const distSq = dx * dx + dy * dy;
		const minDist = shipRef.current.r + Math.max(ufoRef.current.width, ufoRef.current.height) / 2;
		if (distSq < minDist * minDist) {
			shipExploding.current = true;
			explosionTime.current = 60;
			shipRef.current.thrust.x = 0;
			shipRef.current.thrust.y = 0;
			shipDebrisRef.current = spawnShipDebris(shipRef.current);
			playExplosion('big');
			ufoRef.current.isAlive = false;
			return true;
		}
	}
	return false;
};

export const checkUFOBulletsHitShip = (
	ufoState, shipState, asteroidsState, gameState, soundFX
) => {
	const {ufoRef} = ufoState;
	const {shipRef, shipExploding, invincible, shipDebrisRef, explosionTime, spawnShipDebris} = shipState;
	const {playExplosion} = soundFX;

	if (
		ufoRef.current &&
		!shipExploding.current &&
		!invincible.current
	) {
		for (const bullet of ufoRef.current.bullets) {
			const dx = shipRef.current.x - bullet.x;
			const dy = shipRef.current.y - bullet.y;
			if (Math.sqrt(dx * dx + dy * dy) < shipRef.current.r) {
				shipExploding.current = true;
				explosionTime.current = 60;
				shipRef.current.thrust.x = 0;
				shipRef.current.thrust.y = 0;
				shipDebrisRef.current = spawnShipDebris(shipRef.current);
				playExplosion('big');
				return true;
			}
		}
	}
	return false;
};

export const checkShipBulletsHitUFO = (
	ufoState,
	bulletsRef,
	asteroidsState,
	gameState,
	soundFX
) => {
	const {ufoRef} = ufoState;
	const {particlesRef} = asteroidsState;
	const {scoreRef} = gameState;
	const {playExplosion} = soundFX;

	if (ufoRef.current) {
		for (let i = bulletsRef.current.length - 1; i >= 0; i--) {
			const bullet = bulletsRef.current[i];
			const dx = bullet.x - (ufoRef.current.x + ufoRef.current.width / 2);
			const dy = bullet.y - (ufoRef.current.y + ufoRef.current.height / 2);
			const hitRadius = Math.max(ufoRef.current.width, ufoRef.current.height) / 2;
			if (dx * dx + dy * dy < hitRadius * hitRadius) {
				particlesRef.current.push(
					...spawnParticles(
						ufoRef.current.x + ufoRef.current.width / 2,
						ufoRef.current.y + ufoRef.current.height / 2,
						20,
						['#d726ff', '#00ffe7', '#ff61a6', '#fff200']
					)
				);
				ufoRef.current.isAlive = false;
				scoreRef.current += 200;
				playExplosion('medium');
				bulletsRef.current.splice(i, 1);
				return true;
			}
		}
	}
	return false;
};

export const handleUFOHit = (
	ufoState,
	shipState,
	bulletsRef,
	particlesRef,
	gameState,
	asteroidsState,
	soundFX
) => {

	checkShipUFOCollision(ufoState, shipState, soundFX);

	checkUFOBulletsHitShip(ufoState, shipState, asteroidsState, gameState, soundFX);

	checkShipBulletsHitUFO(ufoState, bulletsRef, asteroidsState, gameState, soundFX);
};
