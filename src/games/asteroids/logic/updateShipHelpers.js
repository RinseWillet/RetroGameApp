import {getAsteroidPolygon, getShipPolygon} from '../entities/getPolygons';
import {wrapAround} from '../utils/mathUtils';
import {polygonsIntersect} from '../utils/collisionUtils';

// Magic numbers as constants
const EXPLOSION_DURATION = 60;
const INVINCIBLE_DURATION = 180;
const SHIP_START_ANGLE = Math.PI / 2;

export const updateShipDebris = (shipDebrisRef) => {
	shipDebrisRef.current.forEach(d => {
		d.x += d.xVel;
		d.y += d.yVel;
		d.angle += d.rotationSpeed;
		d.life--;
	});
	shipDebrisRef.current = shipDebrisRef.current.filter(d => d.life > 0);
};

export const updateHyperspaceCooldown = (hyperspaceCooldownRef) => {
	if (hyperspaceCooldownRef.current > 0) {
		hyperspaceCooldownRef.current--;
	}
};

export const handleShipAsteroidCollision = (shipState, asteroidsRef, playExplosion) => {
	const {shipRef, shipExploding, invincible, shipDebrisRef, explosionTime, spawnShipDebris} = shipState;
	if (!shipExploding.current && !invincible.current) {
		const shipPoly = getShipPolygon(shipRef.current);
		for (const asteroid of asteroidsRef.current) {
			const asteroidPoly = getAsteroidPolygon(asteroid);
			if (polygonsIntersect(shipPoly, asteroidPoly)) {
				shipExploding.current = true;
				explosionTime.current = EXPLOSION_DURATION;
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

export const handleShipRespawn = (shipState, canvas, playExplosion, gameState) => {
	const {
		shipRef,
		shipExploding,
		explosionTime,
		invincible,
		invincibleTime,
		livesRef
	} = shipState;
	const {gameOverRef} = gameState;
	if (shipExploding.current) {
		explosionTime.current--;
		if (explosionTime.current <= 0) {
			livesRef.current--;
			if (livesRef.current <= 0) {
				gameOverRef.current = true;
				return;
			}
			shipRef.current.x = canvas.width / 2;
			shipRef.current.y = canvas.height / 2;
			shipRef.current.a = SHIP_START_ANGLE;
			shipRef.current.thrust = {x: 0, y: 0};
			shipRef.current.rot = 0;
			shipExploding.current = false;
			invincible.current = true;
			invincibleTime.current = INVINCIBLE_DURATION;
		}
		return true;
	}
	return false;
};

export const handleShipRotation = (keys, ship, TURN_SPEED, FPS) => {
	if (keys['ArrowLeft']) {
		ship.rot = TURN_SPEED / 180 * Math.PI / FPS;
	} else if (keys['ArrowRight']) {
		ship.rot = -TURN_SPEED / 180 * Math.PI / FPS;
	} else {
		ship.rot = 0;
	}
};

export const handleShipThrust = (keys, ship, engineSoundRef, playEngineHum, THRUST, FRICTION, FPS) => {
	const thrustingNow = keys['ArrowUp'] || false;
	if (thrustingNow && !ship.thrusting) {
		ship.thrusting = true;
		if (engineSoundRef.current && typeof engineSoundRef.current.stop === 'function') {
			engineSoundRef.current.stop();
		}
		engineSoundRef.current = playEngineHum();
	} else if (!thrustingNow && ship.thrusting) {
		ship.thrusting = false;
		if (engineSoundRef.current && typeof engineSoundRef.current.stop === 'function') {
			engineSoundRef.current.stop();
			engineSoundRef.current = null;
		}
	}
	if (ship.thrusting) {
		ship.thrust.x += (THRUST * Math.cos(ship.a)) / FPS;
		ship.thrust.y -= (THRUST * Math.sin(ship.a)) / FPS;
	} else {
		ship.thrust.x -= (FRICTION * ship.thrust.x) / FPS;
		ship.thrust.y -= (FRICTION * ship.thrust.y) / FPS;
	}
};

export const updateShip = (
	options, // object containing the first 7 parameters
	playEngineHum
) => {
	const {
		keyRefs,
		asteroidsRef,
		gameState,
		canvas,
		playExplosion,
		constants,
		shipState
	} = options;

	const {shipRef, invincible, invincibleTime} = shipState;
	const {TURN_SPEED, FPS, THRUST, FRICTION} = constants;
	const keys = keyRefs.current;
	const ship = shipRef.current;

	// Early exit if collision or respawn handled
	if (
		handleShipAsteroidCollision(shipState, asteroidsRef, playExplosion) ||
		handleShipRespawn(shipState, canvas, playExplosion, gameState)
	) {
		return;
	}

	if (invincible.current) {
		invincibleTime.current--;
		if (invincibleTime.current <= 0) {
			invincible.current = false;
		}
	}

	handleShipRotation(keys, ship, TURN_SPEED, FPS);
	handleShipThrust(
		keys,
		ship,
		shipState.engineSoundRef,
		playEngineHum,
		THRUST,
		FRICTION,
		FPS
	);

	ship.a += ship.rot;
	ship.x += ship.thrust.x;
	ship.y += ship.thrust.y;

	wrapAround(ship, canvas);
};
