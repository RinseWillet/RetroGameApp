import {useCallback, useEffect, useRef} from 'react';
import useSynthFX from '../../hooks/useSynthFX';
import useSoundFX from '../../hooks/useSoundFX';
import {dist} from './utils/mathUtils';
import createAsteroids from './entities/createAsteroids';
import drawUFO from './draw/drawUFO.js';
import {spawnShipDebris, updateParticles} from './entities/debris';
import drawAsteroid from './draw/drawAsteroid';
import drawShip from './draw/drawShip';
import drawUI from './draw/drawUI';
import drawParticles from './draw/drawParticles';
import drawShipDebris from './draw/drawShipDebris';
import {updateHyperspaceCooldown, updateShip, updateShipDebris} from './logic/updateShipHelpers';
import {updateAsteroids, updateBulletAsteroidsHit} from './logic/asteroidHelpers.js';
import {updateBullets} from './logic/bulletHelpers.js';
import {handleUFOHit, updateUFO} from './logic/ufoHelpers.js';
import {handleWaveEnd} from './logic/gameLogic.js';
import {
	FPS,
	FRICTION,
	HYPERSPACE_COOLDOWN,
	MAXINTERVAL,
	MININTERVAL,
	SHIP_SIZE,
	THRUST,
	TURN_SPEED
} from './logic/constants.js';

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

	const startHeartbeat = useCallback(() => {
		if (heartbeatIntervalRef.current) return; // already running
		const interval = currentHeartbeatIntervalRef.current;

		heartbeatIntervalRef.current = setInterval(() => {
			const freq = isHighRef.current ? 110 : 115;
			beep(freq, 0.5, 'square', 100);
			isHighRef.current = !isHighRef.current;
		}, interval);
	}, [beep, heartbeatIntervalRef, currentHeartbeatIntervalRef, isHighRef]);

	const updateHeartbeatInterval = useCallback(() => {
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
	}, [asteroidsRef, initialAsteroidCountRef, currentHeartbeatIntervalRef, beep, isHighRef]);

	const hyperspaceJump = useCallback((canvas) => {
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
	}, [playHyperspace, asteroidsRef, shipRef]);

	useEffect(() => {
		const canvas = canvasRef.current;
		const ctx = canvas.getContext('2d');

		const engineSound = engineSoundRef.current;

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
				updateShip({
					keyRefs,
					asteroidsRef,
					gameState,
					canvas,
					playExplosion,
					constants,
					shipState
				}, playEngineHum);

				updateAsteroids(asteroidsState, canvas);

				updateBullets(bulletsRef);

				updateBulletAsteroidsHit(bulletsRef, asteroidsState, canvas, scoreRef, playExplosion, updateHeartbeatInterval);

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

			if (engineSound) engineSound.stop();
		};
	}, [canvasRef, hyperspaceJump, playEngineHum, playLaser, playExplosion, startHeartbeat, updateHeartbeatInterval]);

};

export default useAsteroidsGame;
