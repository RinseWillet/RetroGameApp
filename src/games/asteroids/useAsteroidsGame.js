import {useEffect, useRef} from 'react';
import useSynthFX from '../../hooks/useSynthFX';
import useSoundFX from '../../hooks/useSoundFX';
import {dist, wrapAround} from './utils/mathUtils';
import {pointInPolygon, polygonsIntersect} from './utils/collisionUtils';
import {getAsteroidPolygon, getShipPolygon} from './entities/getPolygons';
import createAsteroids from './entities/createAsteroids';
import createUFO from './entities/createUFO.js';
import drawUFO from './draw/drawUFO.js';
import {spawnParticles, spawnShipDebris} from './entities/debris';
import drawAsteroid from './draw/drawAsteroid';
import drawShip from './draw/drawShip';
import drawUI from './draw/drawUI';
import drawParticles from './draw/drawParticles';
import drawShipDebris from './draw/drawShipDebris';
import {splitAsteroid} from './logic/splitAsteroid';
import {scoreForRadius} from './logic/scoreForRadius';

const FPS = 60;
const SHIP_SIZE = 30;
const TURN_SPEED = 360;
const THRUST = 5;
const FRICTION = 0.7;
const HYPERSPACE_COOLDOWN = 180;
const MAXINTERVAL = 1000;
const MININTERVAL = 100;

const useAsteroidsGame = (canvasRef) => {
	const animationRef = useRef();
	const keyRefs = useRef({});
	const bulletsRef = useRef([]);
	const asteroidsRef = useRef([]);
	const shipRef = useRef({
		x: 600,
		y: 400,
		r: SHIP_SIZE / 2,
		a: Math.PI / 2,
		rot: 0,
		thrusting: false,
		thrust: {x: 0, y: 0}
	});

	const ufoRef = useRef(null);
	const ufoTimerRef = useRef(0);

	const scoreRef = useRef(0);
	const livesRef = useRef(3);
	const startedRef = useRef(false);
	const gameOverRef = useRef(false);
	const shipExploding = useRef(false);
	const explosionTime = useRef(0);
	const invincible = useRef(false);
	const invincibleTime = useRef(0);
	const hyperspaceCooldownRef = useRef(0);

	const initialAsteroidCountRef = useRef(0);
	const particlesRef = useRef([]);
	const shipDebrisRef = useRef([]);
	const waveRef = useRef(1);

	const {beep} = useSynthFX();
	const {playLaser, playExplosion, playHyperspace, playEngineHum} = useSoundFX();
	const engineSoundRef = useRef(null);

	const heartbeatIntervalRef = useRef(null);
	const isHighRef = useRef(true);
	const currentHeartbeatIntervalRef = useRef(1000);

	const startHeartbeat = () => {
		if (heartbeatIntervalRef.current) return; // already running
		const interval = currentHeartbeatIntervalRef.current;

		heartbeatIntervalRef.current = setInterval(() => {
			const freq = isHighRef.current ? 110 : 115;
			beep(freq, 0.5, 'square', 100);
			isHighRef.current = !isHighRef.current;
		}, interval);
	};

	const updateHeartbeatInterval = () => {
		if (heartbeatIntervalRef.current) {
			clearInterval(heartbeatIntervalRef.current);
		}

		const remaining = asteroidsRef.current.length;
		const initial = initialAsteroidCountRef.current || 1;

		const ratio = remaining / initial;
		const intervalRange = MAXINTERVAL - MININTERVAL;

		// Use squared ratio for pacing (slower at start, faster near end)
		let newInterval = MININTERVAL + intervalRange * Math.pow(ratio, 2);

		// Clamp to never increase
		newInterval = Math.max(MININTERVAL, Math.min(newInterval, currentHeartbeatIntervalRef.current));
		currentHeartbeatIntervalRef.current = newInterval;

		heartbeatIntervalRef.current = setInterval(() => {
			const frequency = isHighRef.current ? 110 : 115;
			beep(frequency, 0.5, 'square', 100);
			isHighRef.current = !isHighRef.current;
		}, newInterval);
	};

	const hyperspaceJump = (canvas) => {
		let safe = false;
		let attempts = 0;
		playHyperspace();

		while (!safe && attempts < 100) {
			const newX = Math.random() * canvas.width;
			const newY = Math.random() * canvas.height;

			safe = true;
			for (const asteroid of asteroidsRef.current) {
				const d = dist(newX, newY, asteroid.x, asteroid.y);
				if (d < asteroid.r * 2) {
					safe = false;
					break;
				}
			}

			if (safe) {
				shipRef.current.x = newX;
				shipRef.current.y = newY;
			}
			attempts++;
		}
	};

	useEffect(() => {
		const canvas = canvasRef.current;
		const ctx = canvas.getContext('2d');

		const handleKeyDown = (e) => {
			keyRefs.current[e.code] = true;

			if (e.code === 'Space') {
				if (
					bulletsRef.current.length < 4 &&
					!shipExploding.current &&
					!gameOverRef.current
				) {
					const ship = shipRef.current;
					bulletsRef.current.push({
						x: ship.x + (4 / 3) * ship.r * Math.cos(ship.a),
						y: ship.y - (4 / 3) * ship.r * Math.sin(ship.a),
						xVel: (500 / FPS) * Math.cos(ship.a),
						yVel: -(500 / FPS) * Math.sin(ship.a),
						life: 90
					});
					playLaser();
				}
			}

			if (e.code === 'KeyR' && gameOverRef.current) {
				window.location.reload(); // or a cleaner reset logic later
			}

			if ((e.code === 'ShiftLeft' || e.code === 'ShiftRight') && startedRef.current) {
				if (
					hyperspaceCooldownRef.current <= 0 &&
					!shipExploding.current &&
					!gameOverRef.current
				) {
					hyperspaceJump(canvas);
					hyperspaceCooldownRef.current = HYPERSPACE_COOLDOWN;
				}
			}

			if (!startedRef.current) {
				startedRef.current = true;

				createAsteroids(canvas, asteroidsRef, waveRef);
				initialAsteroidCountRef.current = asteroidsRef.current.length;
				currentHeartbeatIntervalRef.current = MAXINTERVAL;
				startHeartbeat();

				//brief period of invincibility to avoid spawning kills
				invincible.current = true;
				invincibleTime.current = 180;

			}

		};

		const handleKeyUp = (e) => {
			keyRefs.current[e.code] = false;
		};

		window.addEventListener('keydown', handleKeyDown);
		window.addEventListener('keyup', handleKeyUp);

		const updateParticles = (particlesRef) => {
			particlesRef.current.forEach(p => {
				p.x += p.xVel;
				p.y += p.yVel;
				p.life--;
			});
			particlesRef.current = particlesRef.current.filter(p => p.life > 0);
		};

		const updateShipDebris = (shipDebrisRef) => {
			shipDebrisRef.current.forEach(d => {
				d.x += d.xVel;
				d.y += d.yVel;
				d.angle += d.rotationSpeed;
				d.life--;
			});
			shipDebrisRef.current = shipDebrisRef.current.filter(d => d.life > 0);
		};

		const updateHyperspaceCooldown = (hyperspaceCooldownRef) => {
			if (hyperspaceCooldownRef.current > 0) {
				hyperspaceCooldownRef.current--;
			}
		};

		const handleShipAsteroidCollision = (shipState, asteroidsRef, playExplosion) => {
			const {shipRef, shipExploding, invincible, shipDebrisRef, explosionTime, spawnShipDebris} = shipState;
			if (!shipExploding.current && !invincible.current) {
				const shipPoly = getShipPolygon(shipRef.current);
				for (const asteroid of asteroidsRef.current) {
					const asteroidPoly = getAsteroidPolygon(asteroid);
					if (polygonsIntersect(shipPoly, asteroidPoly)) {
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

		const handleShipRespawn = (shipState, canvas, playExplosion, gameState) => {
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
					shipRef.current.a = Math.PI / 2;
					shipRef.current.thrust = {x: 0, y: 0};
					shipRef.current.rot = 0;
					shipExploding.current = false;
					invincible.current = true;
					invincibleTime.current = 180;
				}
				return true;
			}
			return false;
		};

		const handleShipRotation = (keys, ship, TURN_SPEED, FPS) => {
			if (keys['ArrowLeft']) {
				ship.rot = TURN_SPEED / 180 * Math.PI / FPS;
			} else if (keys['ArrowRight']) {
				ship.rot = -TURN_SPEED / 180 * Math.PI / FPS;
			} else {
				ship.rot = 0;
			}
		};

		const handleShipThrust = (keys, ship, engineSoundRef, playEngineHum, THRUST, FRICTION, FPS) => {
			const thrustingNow = keys['ArrowUp'] || false;
			if (thrustingNow && !ship.thrusting) {
				ship.thrusting = true;
				if (!engineSoundRef.current) {
					engineSoundRef.current = playEngineHum();
				}
			} else if (!thrustingNow && ship.thrusting) {
				ship.thrusting = false;
				if (engineSoundRef.current) {
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

		const updateShip = (keyRefs,
		                    asteroidsRef,
		                    gameState,
		                    canvas,
		                    playExplosion,
		                    constants,
		                    shipState) => {

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

		const updateAsteroids = (asteroidsState, canvas) => {
			const {asteroidsRef} = asteroidsState;
			asteroidsRef.current.forEach(ast => {
				ast.x += ast.xVel;
				ast.y += ast.yVel;
				ast.angle += ast.rotationSpeed;
				wrapAround(ast, canvas);
			});
		};

		const updateBullets = (bulletsRef) => {
			bulletsRef.current.forEach(bullet => {
				bullet.x += bullet.xVel;
				bullet.y += bullet.yVel;
				bullet.life--;
			});
		};

		// Helper function outside updateBulletAsteroidsHit
		const handleAsteroidHit = (bullet, asteroid, asteroidsRef, particlesRef, scoreRef, playExplosion, updateHeartbeatInterval) => {
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

// Refactored updateBulletAsteroidsHit
		const updateBulletAsteroidsHit = (bulletsRef, asteroidsState) => {
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

		const updateUFO = (ufoState, gameState, canvas, shipRef) => {
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

		const checkShipUFOCollision = (ufoState, shipState, soundFX) => {
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

		const checkUFOBulletsHitShip = (
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

		const checkShipBulletsHitUFO = (
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

		const handleUFOHit = (
			ufoState,
			shipState,
			bulletsRef,
			particlesRef,
			gameState,
			asteroidsState,
			soundFX
		) => {

			if (checkShipUFOCollision(ufoState, shipState, soundFX)) return;

			if (checkUFOBulletsHitShip(ufoState, shipState, asteroidsState, gameState, soundFX)) return;

			if (checkShipBulletsHitUFO(ufoState, bulletsRef, asteroidsState, gameState, soundFX)) return;
		};

		const handleWaveEnd = (
			gameState,
			asteroidsState,
			canvas,
			currentHeartbeatIntervalRef,
			MAXINTERVAL,
			startHeartbeat,
			shipState
		) => {
			const {startedRef, gameOverRef, waveRef} = gameState;
			const {invincible, invincibleTime} = shipState;
			const {asteroidsRef, initialAsteroidCountRef, createAsteroids} = asteroidsState;
			if (startedRef.current && asteroidsRef.current.length === 0 && !gameOverRef.current) {
				waveRef.current++;

				createAsteroids(canvas, asteroidsRef, waveRef, 5 + waveRef.current);
				initialAsteroidCountRef.current = asteroidsRef.current.length;

				//reset heartbeat
				currentHeartbeatIntervalRef.current = MAXINTERVAL;
				startHeartbeat();

				//short invincibility mode to avoid spawning kills
				invincible.current = true;
				invincibleTime.current = 180;
			}
		};

		const update = () => {
				const shipState = {
					shipRef,
					shipExploding,
					explosionTime,
					shipDebrisRef,
					spawnShipDebris,
					engineSoundRef,
					invincible,
					invincibleTime,
					livesRef
				};

				const ufoState = {
					ufoRef,
					ufoTimerRef
				};

				const gameState = {
					startedRef,
					gameOverRef,
					scoreRef,
					livesRef,
					waveRef
				};

				const constants = {TURN_SPEED, FPS, THRUST, FRICTION};

				const asteroidsState = {
					asteroidsRef,
					particlesRef,
					initialAsteroidCountRef,
					createAsteroids
				};

				const soundFX = {playExplosion};

				updateParticles(particlesRef);
				updateShipDebris(shipDebrisRef);
				updateHyperspaceCooldown(hyperspaceCooldownRef);
				updateShip(keyRefs,
					asteroidsRef,
					gameState,
					canvas,
					playExplosion,
					constants,
					shipState);

				updateAsteroids(asteroidsState, canvas);

				updateBullets(bulletsRef);

				updateBulletAsteroidsHit(bulletsRef, asteroidsState);

				updateUFO(ufoState, gameState, canvas, shipRef);

				handleUFOHit(
					ufoState,
					shipState,
					bulletsRef,
					particlesRef,
					gameState,
					asteroidsState,
					soundFX
				);

				handleWaveEnd(
					gameState,
					asteroidsState,
					canvas,
					currentHeartbeatIntervalRef,
					MAXINTERVAL,
					startHeartbeat,
					shipState
				);

			}
		;

		const render = () => {
			const pulse = 0.75 + 0.25 * Math.sin(Date.now() / 700);
			ctx.fillStyle = 'black';
			ctx.fillRect(0, 0, canvas.width, canvas.height);
			ctx.fillStyle = `rgba(255, 255, 255, ${pulse.toFixed(2)})`;

			if (!startedRef.current) {
				ctx.fillStyle = 'black';
				ctx.fillRect(0, 0, canvas.width, canvas.height);
				ctx.fillStyle = 'white';
				ctx.font = '50px "Press Start 2P"';
				ctx.textAlign = 'center';
				ctx.fillText('Press Any Key to Start', canvas.width / 2, canvas.height / 2);
				return;
			}

			drawUI(ctx, scoreRef.current, livesRef.current, hyperspaceCooldownRef.current);
			drawParticles(ctx, particlesRef.current);
			drawShipDebris(ctx, shipDebrisRef.current);
			asteroidsRef.current.forEach(ast => drawAsteroid(ctx, ast));
			if (!shipExploding.current) {
				if (invincible.current) {
					// Flicker: show ship every 10 frames
					if (Math.floor(invincibleTime.current / 10) % 2 === 0) {
						drawShip(ctx, shipRef.current, {thrusting: shipRef.current.thrusting});
					}
				} else {
					drawShip(ctx, shipRef.current, {thrusting: shipRef.current.thrusting});
				}
			}

			if (ufoRef.current) {
				drawUFO(ctx, ufoRef.current);
			}

			if (gameOverRef.current) {
				ctx.fillStyle = 'white';
				ctx.font = '50px "Press Start 2P"';
				ctx.textAlign = 'center';
				ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2);
				ctx.font = '20px "Press Start 2P"';
				ctx.fillText('Press R to Restart', canvas.width / 2, canvas.height / 2 + 50);
			}

			// Draw bullets
			ctx.fillStyle = 'white';
			bulletsRef.current.forEach(bullet => {
				ctx.beginPath();
				ctx.arc(bullet.x, bullet.y, 2, 0, Math.PI * 2);
				ctx.fill();
			});
		};

		const loop = () => {
			update();
			render();
			animationRef.current = requestAnimationFrame(loop);
		};

		animationRef.current = requestAnimationFrame(loop);

		return () => {
			window.removeEventListener('keydown', handleKeyDown);
			window.removeEventListener('keyup', handleKeyUp);
			cancelAnimationFrame(animationRef.current);
			clearInterval(heartbeatIntervalRef.current);
			heartbeatIntervalRef.current = null;
			if (engineSoundRef.current) engineSoundRef.current.stop();
		};
	}, [canvasRef]);

};

export default useAsteroidsGame;
