import { useEffect, useRef } from 'react';
import useSynthFX from '../../hooks/useSynthFX';
import useSoundFX from '../../hooks/useSoundFX';
import { wrapAround, dist } from './utils/mathUtils'
import { pointInPolygon, polygonsIntersect } from './utils/collisionUtils';
import { getAsteroidPolygon, getShipPolygon } from './entities/getPolygons';
import createAsteroids from './entities/createAsteroids';
import { spawnParticles, spawnShipDebris } from './entities/debris';
import drawAsteroid from './draw/drawAsteroid';
import drawShip from './draw/drawShip';
import drawUI from './draw/drawUI';
import drawParticles from './draw/drawParticles';
import drawShipDebris from './draw/drawShipDebris';

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
        thrust: { x: 0, y: 0 },
    });

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

    const { beep } = useSynthFX();
    const { playLaser, playExplosion, playHyperspace, playEngineHum } = useSoundFX();
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
                        life: 90,
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

                return;
            }

        };

        const handleKeyUp = (e) => {
            keyRefs.current[e.code] = false;
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);



        const update = () => {
            // Particle updates
            particlesRef.current.forEach(p => {
                p.x += p.xVel;
                p.y += p.yVel;
                p.life--;
            });
            particlesRef.current = particlesRef.current.filter(p => p.life > 0);

            // Ship debris updates
            shipDebrisRef.current.forEach(d => {
                d.x += d.xVel;
                d.y += d.yVel;
                d.angle += d.rotationSpeed;
                d.life--;
            });
            shipDebrisRef.current = shipDebrisRef.current.filter(d => d.life > 0);

            // Hyperspace cooldown
            if (hyperspaceCooldownRef.current > 0) {
                hyperspaceCooldownRef.current--;
            }

            // Update ship
            const keys = keyRefs.current;
            const ship = shipRef.current;

            if (!shipExploding.current && !invincible.current) {
                const shipPoly = getShipPolygon(ship);
                for (const asteroid of asteroidsRef.current) {
                    const asteroidPoly = getAsteroidPolygon(asteroid);
                    if (polygonsIntersect(shipPoly, asteroidPoly)) {
                        shipExploding.current = true;
                        explosionTime.current = 60;
                        ship.thrust.x = 0;
                        ship.thrust.y = 0;
                        shipDebrisRef.current = spawnShipDebris(ship);
                        playExplosion('big');
                        return;
                    }
                }
            }

            if (shipExploding.current) {
                explosionTime.current--;
                if (explosionTime.current <= 0) {
                    livesRef.current--;
                    if (livesRef.current <= 0) {
                        gameOverRef.current = true;
                        return;
                    }
                    ship.x = canvas.width / 2;
                    ship.y = canvas.height / 2;
                    ship.a = Math.PI / 2;
                    ship.thrust = { x: 0, y: 0 };
                    ship.rot = 0;
                    shipExploding.current = false;
                    invincible.current = true;
                    invincibleTime.current = 180;
                }
                return;
            }

            if (invincible.current) {
                invincibleTime.current--;
                if (invincibleTime.current <= 0) {
                    invincible.current = false;
                }
            }

            if (keys['ArrowLeft']) {
                ship.rot = TURN_SPEED / 180 * Math.PI / FPS;
            } else if (keys['ArrowRight']) {
                ship.rot = -TURN_SPEED / 180 * Math.PI / FPS;
            } else {
                ship.rot = 0;
            }

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

            ship.a += ship.rot;
            ship.x += ship.thrust.x;
            ship.y += ship.thrust.y;

            wrapAround(ship, canvas);

            // Asteroid updates
            asteroidsRef.current.forEach(ast => {
                ast.x += ast.xVel;
                ast.y += ast.yVel;
                ast.angle += ast.rotationSpeed;
                wrapAround(ast, canvas);
            });

            // Bullet updates
            bulletsRef.current.forEach(bullet => {
                bullet.x += bullet.xVel;
                bullet.y += bullet.yVel;
                bullet.life--;
            });

            // Bullet collision
            for (let i = bulletsRef.current.length - 1; i >= 0; i--) {
                const bullet = bulletsRef.current[i];
                for (let j = asteroidsRef.current.length - 1; j >= 0; j--) {
                    const asteroid = asteroidsRef.current[j];
                    const poly = getAsteroidPolygon(asteroid);
                    if (pointInPolygon({ x: bullet.x, y: bullet.y }, poly)) {
                        // Split asteroid or spawn particles
                        const r = asteroid.r;
                        scoreRef.current += r > 50 ? 20 : r > 25 ? 50 : 100;
                        playExplosion(r > 50 ? 'big' : r > 25 ? 'medium' : 'small');

                        if (r > 25) {
                            for (let k = 0; k < 2; k++) {
                                asteroidsRef.current.push({
                                    ...asteroid,
                                    r: r / 2,
                                    xVel: (Math.random() - 0.5) * 2 * 50 / 60,
                                    yVel: (Math.random() - 0.5) * 2 * 50 / 60
                                });
                            }
                        } else {
                            particlesRef.current.push(...spawnParticles(asteroid.x, asteroid.y));
                        }

                        asteroidsRef.current.splice(j, 1);
                        updateHeartbeatInterval();
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

            // End wave logic
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

        const render = () => {
            ctx.fillStyle = 'black';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            if (!startedRef.current) {
                ctx.fillStyle = 'black';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = 'white';
                ctx.font = '40px "Press Start 2P"';
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
                        drawShip(ctx, shipRef.current, { thrusting: shipRef.current.thrusting });
                    }
                } else {
                    drawShip(ctx, shipRef.current, { thrusting: shipRef.current.thrusting });
                }
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
