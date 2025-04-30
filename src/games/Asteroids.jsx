import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import useSynthFX from '../hooks/useSynthFX'
import useSoundFX from '../hooks/useSoundFX';

const FPS = 60;
const SHIP_SIZE = 30;
const TURN_SPEED = 360;
const THRUST = 5;
const FRICTION = 0.7;
const HYPERSPACE_COOLDOWN = 180; // 3 seconds @ 60FPS
const DEBUG = false; // set to false to disable hitbox drawing

//Asteroid constants:
const ASTEROID_SPEED = 50 / FPS; // pixels per frame (since everything updates every frame)
const ASTEROID_RADIUS = 100; // initial asteroid size

//Bullet constants
const BULLET_SPEED = 500 / FPS;
const BULLET_LIFE = 90; // bullets live 1.5 second (60 frames)

const Asteroids = () => {
    const navigate = useNavigate();
    const canvasRef = useRef(null);
    const animationRef = useRef(null);
    const keyRefs = useRef({});
    const bulletsRef = useRef([]);
    const asteroidsRef = useRef([]);
    const shipExploding = useRef(false);
    const explosionTime = useRef(0);
    const invincible = useRef(false);
    const invincibleTime = useRef(0);
    const particlesRef = useRef([]);
    const shipDebrisRef = useRef([]);
    const scoreRef = useRef(0);
    const livesRef = useRef(3);
    const gameOverRef = useRef(false);
    const waveRef = useRef(1);
    const hyperspaceCooldownRef = useRef(0);    

    const { beep } = useSynthFX();
    const { playLaser, playExplosion, playHyperspace } = useSoundFX();
    const heartbeatIntervalRef = useRef(null);
    const isHighRef = useRef(true);
    const initialAsteroidCountRef = useRef(0);

    const shipRef = useRef({
        x: 600,
        y: 400,
        r: SHIP_SIZE / 2,
        a: 90 / 180 * Math.PI,
        rot: 0,
        thrusting: false,
        thrust: { x: 0, y: 0 },
    });

    const createAsteroids = (canvas, count = 5) => {
        const newAsteroids = [];
        const speedMultiplier = 1 + 0.1 * (waveRef.current - 1); // 10% faster per wave
        for (let i = 0; i < count; i++) {
            const sides = Math.floor(Math.random() * 9) + 8; // 8-16 sides
            const vertices = [];
            for (let j = 0; j < sides; j++) {
                vertices.push(0.5 + Math.random() * 1.0); // offset between 0.5 and 1.5
            }
            newAsteroids.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                r: ASTEROID_RADIUS,
                xVel: (Math.random() - 0.5) * ASTEROID_SPEED * speedMultiplier,
                yVel: (Math.random() - 0.5) * ASTEROID_SPEED * speedMultiplier,
                angle: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.01,
                sides: sides,
                vertices: vertices,
            });
        };
        asteroidsRef.current = newAsteroids;
        initialAsteroidCountRef.current = newAsteroids.length;
    }

    const destroyAsteroid = (index) => {
        const asteroid = asteroidsRef.current[index];

        const x = asteroid.x;
        const y = asteroid.y;
        const r = asteroid.r;

        // Score bonus based on asteroid size
        if (r > ASTEROID_RADIUS / 2) {
            scoreRef.current += 20;
        } else if (r > ASTEROID_RADIUS / 4) {
            scoreRef.current += 50;
        } else {
            scoreRef.current += 100;
        }

        //play explosion soundFX
        if (r > ASTEROID_RADIUS / 2) {
            playExplosion('big')   // Big asteroids = big boom
        } else if (r > ASTEROID_RADIUS / 4) {
            playExplosion('medium')
        } else {
            playExplosion('small')
        }

        // Split if not small
        if (r > ASTEROID_RADIUS / 4) { // Large (>80) or Medium (>40)

            // Big or Medium asteroid
            asteroidsRef.current.push({
                ...asteroid,
                r: r / 2,
                xVel: (Math.random() - 0.5) * ASTEROID_SPEED * 2,
                yVel: (Math.random() - 0.5) * ASTEROID_SPEED * 2,
            });

            asteroidsRef.current.push({
                ...asteroid,
                r: r / 2,
                xVel: (Math.random() - 0.5) * ASTEROID_SPEED * 2,
                yVel: (Math.random() - 0.5) * ASTEROID_SPEED * 2,
            });
        } else {
            //spawn particles for the smallest asteroids' destruction
            spawnParticles(x, y);

        }

        // Remove original asteroid
        asteroidsRef.current.splice(index, 1);

        // Check if all asteroids are gone
        if (asteroidsRef.current.length === 0 && !gameOverRef.current) {
            waveRef.current++;
            createAsteroids(canvasRef.current, 5 + waveRef.current); // spawn more each wave
            startHeartbeat();
        } else {
            updateHeartbeatInterval();
        }
    };

    const spawnParticles = (x, y, count = 15) => {
        const colors = ['white', '#cccccc', '#88ccff']; //white, light grey, light blue - inspired by Asteroids Deluxe 1981
        const newParticles = [];

        for (let i = 0; i < count; i++) {
            newParticles.push({
                x: x,
                y: y,
                xVel: (Math.random() - 0.5) * 6,
                yVel: (Math.random() - 0.5) * 6,
                life: Math.floor(Math.random() * 30) + 30,
                size: Math.random() * 2 + 0.5, // 1 to 3 px
                color: colors[Math.floor(Math.random() * colors.length)],
            });
        }
        particlesRef.current.push(...newParticles);
    };

    const updateParticles = () => {
        particlesRef.current.forEach(p => {
            p.x += p.xVel;
            p.y += p.yVel;
            p.life--;
        });

        // Filter dead particles
        particlesRef.current = particlesRef.current.filter(p => p.life > 0);
    };

    const spawnShipDebris = () => {
        const debris = [];
        const ship = shipRef.current;

        // Define the 5 points of the new ship shape
        const points = [
            { x: ship.x + (4 / 3) * ship.r * Math.cos(ship.a), y: ship.y - (4 / 3) * ship.r * Math.sin(ship.a) }, // tip
            { x: ship.x - ship.r * (Math.cos(ship.a) + 0.6 * Math.sin(ship.a)), y: ship.y + ship.r * (Math.sin(ship.a) - 0.6 * Math.cos(ship.a)) }, // rear left
            { x: ship.x - 0.5 * ship.r * (Math.cos(ship.a) + Math.sin(ship.a)), y: ship.y + 0.5 * ship.r * (Math.sin(ship.a) - Math.cos(ship.a)) }, // indent left
            { x: ship.x - 0.5 * ship.r * (Math.cos(ship.a) - Math.sin(ship.a)), y: ship.y + 0.5 * ship.r * (Math.sin(ship.a) + Math.cos(ship.a)) }, // indent right
            { x: ship.x - ship.r * (Math.cos(ship.a) - 0.6 * Math.sin(ship.a)), y: ship.y + ship.r * (Math.sin(ship.a) + 0.6 * Math.cos(ship.a)) }, // rear right
        ];

        points.forEach(p => {
            debris.push({
                x: p.x,
                y: p.y,
                xVel: (Math.random() - 0.5) * 8,
                yVel: (Math.random() - 0.5) * 8,
                life: 90, // 1.5 second
                maxLife: 90,
                size: Math.random() * 2 + 1.5, // make debris chunks a bit bigger
                angle: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.1, // for rotating debris// store original life for fading
            });
        });

        shipDebrisRef.current = debris;
    };

    const wrapAround = (obj, canvas) => {
        if (obj.x < 0 - obj.r) obj.x = canvas.width + obj.r;
        else if (obj.x > canvas.width + obj.r) obj.x = 0 - obj.r;
        if (obj.y < 0 - obj.r) obj.y = canvas.height + obj.r;
        else if (obj.y > canvas.height + obj.r) obj.y = 0 - obj.r;
    };

    const dist = (x1, y1, x2, y2) => {
        return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    };

    // Polygon collision helpers
    const getShipPolygon = (ship) => {
        return [
            { x: ship.x + (4 / 3) * ship.r * Math.cos(ship.a), y: ship.y - (4 / 3) * ship.r * Math.sin(ship.a) },
            { x: ship.x - ship.r * (Math.cos(ship.a) + 0.6 * Math.sin(ship.a)), y: ship.y + ship.r * (Math.sin(ship.a) - 0.6 * Math.cos(ship.a)) },
            { x: ship.x - 0.5 * ship.r * (Math.cos(ship.a) + Math.sin(ship.a)), y: ship.y + 0.5 * ship.r * (Math.sin(ship.a) - Math.cos(ship.a)) },
            { x: ship.x - 0.5 * ship.r * (Math.cos(ship.a) - Math.sin(ship.a)), y: ship.y + 0.5 * ship.r * (Math.sin(ship.a) + Math.cos(ship.a)) },
            { x: ship.x - ship.r * (Math.cos(ship.a) - 0.6 * Math.sin(ship.a)), y: ship.y + ship.r * (Math.sin(ship.a) + 0.6 * Math.cos(ship.a)) }
        ];
    };

    const getAsteroidPolygon = (asteroid) => {
        const points = [];
        for (let i = 0; i < asteroid.sides; i++) {
            const angle = asteroid.angle + i * Math.PI * 2 / asteroid.sides;
            points.push({
                x: asteroid.x + asteroid.r * asteroid.vertices[i] * Math.cos(angle),
                y: asteroid.y + asteroid.r * asteroid.vertices[i] * Math.sin(angle)
            });
        }
        return points;
    };

    const polygonsIntersect = (poly1, poly2) => {
        const polys = [poly1, poly2];
        for (let i = 0; i < polys.length; i++) {
            const polygon = polys[i];
            for (let j = 0; j < polygon.length; j++) {
                const k = (j + 1) % polygon.length;
                const p1 = polygon[j];
                const p2 = polygon[k];

                const normal = { x: p2.y - p1.y, y: p1.x - p2.x };

                let minA = Infinity, maxA = -Infinity;
                for (const p of poly1) {
                    const projected = normal.x * p.x + normal.y * p.y;
                    minA = Math.min(minA, projected);
                    maxA = Math.max(maxA, projected);
                }

                let minB = Infinity, maxB = -Infinity;
                for (const p of poly2) {
                    const projected = normal.x * p.x + normal.y * p.y;
                    minB = Math.min(minB, projected);
                    maxB = Math.max(maxB, projected);
                }

                if (maxA < minB || maxB < minA) {
                    return false;
                }
            }
        }
        return true;
    };

    const pointInPolygon = (point, polygon) => {
        let inside = false;
        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            const xi = polygon[i].x, yi = polygon[i].y;
            const xj = polygon[j].x, yj = polygon[j].y;

            const intersect = ((yi > point.y) !== (yj > point.y)) &&
                (point.x < (xj - xi) * (point.y - yi) / (yj - yi + 0.000001) + xi);
            if (intersect) inside = !inside;
        }
        return inside;
    };

    const checkShipCollision = () => {
        if (invincible.current) return false;

        const ship = shipRef.current;
        const shipPoly = getShipPolygon(ship);
        for (const ast of asteroidsRef.current) {
            const asteroidPoly = getAsteroidPolygon(ast);
            const d = dist(ship.x, ship.y, ast.x, ast.y);
            if (polygonsIntersect(shipPoly, asteroidPoly)) {
                return true;
            }
        }
        return false;
    };

    const hyperspaceJump = (canvas) => {
        let safe = false;
        let attempts = 0;
        playHyperspace();

        while (!safe && attempts < 100) {
            const newX = Math.random() * canvas.width;
            const newY = Math.random() * canvas.height;

            safe = true;
            for (const ast of asteroidsRef.current) {
                if (dist(newX, newY, ast.x, ast.y) < ast.r * 2) { // 2x radius for safety
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

    const startHeartbeat = () => {
        if (heartbeatIntervalRef.current) {
            clearInterval(heartbeatIntervalRef.current); // <- clear old heartbeat
        }

        const initialInterval = 1000; // start slow
        heartbeatIntervalRef.current = setInterval(() => {
            const frequency = isHighRef.current ? 110 : 115;
            beep(frequency, 0.5, 'square', 100);
            isHighRef.current = !isHighRef.current;
        }, initialInterval);
    };

    const updateHeartbeatInterval = () => {
        if (heartbeatIntervalRef.current) {
            clearInterval(heartbeatIntervalRef.current);
        }

        const remainingAsteroids = asteroidsRef.current.length;
        const initialAsteroids = initialAsteroidCountRef.current || 1;
        const maxInterval = 1000; // Slowest heartbeat
        const minInterval = 200;  // Fastest heartbeat
        const intervalRange = maxInterval - minInterval;
        const interval = minInterval + (intervalRange * (remainingAsteroids / initialAsteroids));

        heartbeatIntervalRef.current = setInterval(() => {
            const frequency = isHighRef.current ? 110 : 115;
            beep(frequency, 0.5, 'square', 100);
            isHighRef.current = !isHighRef.current;
        }, interval);
    };

    //debugging purpose (draws hitdetectionpolygons)
    const drawPolygon = (ctx, points, color = 'lime') => {
        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        createAsteroids(canvas);

        // Immediately give the ship invincibility after start/restart
        invincible.current = true;
        invincibleTime.current = 180; // 3 seconds at 60FPS

        const handleKeyDown = (e) => {
            keyRefs.current[e.code] = true;

            if (e.code === 'Space') {
                if (bulletsRef.current.length < 4) {
                    const ship = shipRef.current;
                    bulletsRef.current.push({
                        x: ship.x + (4 / 3) * ship.r * Math.cos(ship.a),
                        y: ship.y - (4 / 3) * ship.r * Math.sin(ship.a),
                        xVel: BULLET_SPEED * Math.cos(ship.a),
                        yVel: -BULLET_SPEED * Math.sin(ship.a),
                        life: BULLET_LIFE,
                    });
                    playLaser();
                }
            }

            if (e.code === 'KeyR' && gameOverRef.current) {
                window.location.reload(); // quick full reload
            }

            if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
                if (hyperspaceCooldownRef.current <= 0 && !shipExploding.current && !gameOverRef.current) {
                    hyperspaceJump(canvas);
                    hyperspaceCooldownRef.current = HYPERSPACE_COOLDOWN;
                }
            }
        };

        const handleKeyUp = (e) => {
            keyRefs.current[e.code] = false;
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        const updateShip = () => {
            if (gameOverRef.current) return;

            const keys = keyRefs.current;
            const ship = shipRef.current;

            if (!shipExploding.current && checkShipCollision()) {
                shipExploding.current = true;
                explosionTime.current = 60;
                ship.thrust.x = 0;
                ship.thrust.y = 0;
                spawnShipDebris();
                playExplosion('big');
                return;
            }

            if (shipExploding.current) {
                explosionTime.current--;
                if (explosionTime.current <= 0) {
                    livesRef.current--;

                    if (livesRef.current <= 0) {
                        gameOverRef.current = true;
                    }

                    // Reset ship position
                    ship.x = canvas.width / 2;
                    ship.y = canvas.height / 2;
                    ship.a = 90 / 180 * Math.PI;
                    ship.thrust.x = 0;
                    ship.thrust.y = 0;
                    ship.rot = 0;

                    shipExploding.current = false;

                    //three seconds (@60 FPS) invincibility at respawn                
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

            ship.thrusting = keys['ArrowUp'] || false;
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
        };

        const updateAsteroids = () => {
            if (gameOverRef.current) return;
            asteroidsRef.current.forEach(ast => {
                ast.x += ast.xVel;
                ast.y += ast.yVel;
                ast.angle += ast.rotationSpeed;
                wrapAround(ast, canvas);
            });
        };

        const updateBullets = () => {
            if (gameOverRef.current) return;
            const bullets = bulletsRef.current;
            const asteroids = asteroidsRef.current;

            bullets.forEach(bullet => {
                bullet.x += bullet.xVel;
                bullet.y += bullet.yVel;
                bullet.life--;
            });

            for (let i = bullets.length - 1; i >= 0; i--) {
                const bullet = bullets[i];
                for (let j = asteroids.length - 1; j >= 0; j--) {
                    const ast = asteroids[j];
                    const asteroidPoly = getAsteroidPolygon(ast);
                    if (pointInPolygon({ x: bullet.x, y: bullet.y }, asteroidPoly)) {
                        destroyAsteroid(j);
                        bullets.splice(i, 1); //remove bullet
                        break; //move to next bullet
                    }
                }
            }

            bulletsRef.current = bullets.filter(bullet =>
                bullet.life > 0 &&
                bullet.x > 0 && bullet.x < canvas.width &&
                bullet.y > 0 && bullet.y < canvas.height
            );
        };

        const drawShip = (x, y, a, thrusting = false, color = 'white') => {
            ctx.strokeStyle = color;
            ctx.lineWidth = SHIP_SIZE / 20;
            ctx.beginPath();

            // Tip of the ship
            ctx.moveTo(
                x + (4 / 3) * shipRef.current.r * Math.cos(a),
                y - (4 / 3) * shipRef.current.r * Math.sin(a)
            );

            // Rear left wingtip
            ctx.lineTo(
                x - shipRef.current.r * (Math.cos(a) + 0.6 * Math.sin(a)),
                y + shipRef.current.r * (Math.sin(a) - 0.6 * Math.cos(a))
            );

            // Indent left (bottom platform start)
            ctx.lineTo(
                x - 0.5 * shipRef.current.r * (Math.cos(a) + Math.sin(a)),
                y + 0.5 * shipRef.current.r * (Math.sin(a) - Math.cos(a))
            );

            // Indent right (bottom platform end)
            ctx.lineTo(
                x - 0.5 * shipRef.current.r * (Math.cos(a) - Math.sin(a)),
                y + 0.5 * shipRef.current.r * (Math.sin(a) + Math.cos(a))
            );

            // Rear right wingtip
            ctx.lineTo(
                x - shipRef.current.r * (Math.cos(a) - 0.6 * Math.sin(a)),
                y + shipRef.current.r * (Math.sin(a) + 0.6 * Math.cos(a))
            );

            ctx.closePath();
            ctx.stroke();

            if (thrusting) {
                ctx.strokeStyle = Math.random() < 0.2 ? 'white' : '#88ccff'; // flicker between blue and white
                ctx.lineWidth = SHIP_SIZE / 22;
                ctx.beginPath();
                ctx.moveTo(
                    x - 0.4 * shipRef.current.r * (Math.cos(a) + Math.sin(a)),
                    y + 0.4 * shipRef.current.r * (Math.sin(a) - Math.cos(a))
                );

                ctx.lineTo(
                    x - (1.2 + Math.random() * 0.4) * shipRef.current.r * Math.cos(a),
                    y + (1.2 + Math.random() * 0.4) * shipRef.current.r * Math.sin(a)
                );

                ctx.lineTo(
                    x - 0.4 * shipRef.current.r * (Math.cos(a) - Math.sin(a)),
                    y + 0.4 * shipRef.current.r * (Math.sin(a) + Math.cos(a))
                );

                ctx.closePath();
                ctx.stroke();
            }
        };

        const drawAsteroid = (ast) => {
            ctx.save();

            ctx.translate(ast.x, ast.y); // Move origin to asteroid's center
            ctx.rotate(ast.angle);       // Rotate the canvas to asteroid's angle

            ctx.strokeStyle = 'slategrey';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(
                ast.r * ast.vertices[0] * Math.cos(0),
                ast.r * ast.vertices[0] * Math.sin(0)
            );
            for (let i = 1; i < ast.sides; i++) {
                ctx.lineTo(
                    ast.r * ast.vertices[i] * Math.cos(i * Math.PI * 2 / ast.sides),
                    ast.r * ast.vertices[i] * Math.sin(i * Math.PI * 2 / ast.sides)
                );
            }
            ctx.closePath();
            ctx.stroke();
            ctx.restore();
        };

        const updateShipDebris = () => {
            shipDebrisRef.current.forEach(d => {
                d.x += d.xVel;
                d.y += d.yVel;
                d.angle += d.rotationSpeed;
                d.life--;
            });

            shipDebrisRef.current = shipDebrisRef.current.filter(d => d.life > 0);
        };

        const render = () => {
            ctx.fillStyle = 'black';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            //draw score and lives
            ctx.fillStyle = 'white';
            ctx.font = '20px "Press Start 2P"';
            ctx.textAlign = 'center';
            ctx.fillText(`Score: ${scoreRef.current}`, canvas.width / 2, 40);

            ctx.textAlign = 'left';
            const shipSize = SHIP_SIZE / 2; // smaller version
            for (let i = 0; i < livesRef.current; i++) {
                const offsetX = 20 + i * (shipSize + 10); // 10px gap between ships
                const offsetY = 60;
                drawShip(offsetX, offsetY, Math.PI / 2, false, 'white');
            }

            // Draw hyperspace cooldown text
            if (hyperspaceCooldownRef.current > 0) {
                ctx.fillStyle = `rgba(255, 255, 255, ${(hyperspaceCooldownRef.current / HYPERSPACE_COOLDOWN).toFixed(2)})`;
                ctx.font = '15px "Press Start 2P", Arial'; // Same retro font, smaller size
                ctx.textAlign = 'center';
                ctx.fillText(`Hyperspace cooling down...`, canvas.width / 2, 70);
            }

            //asteroid explosion particles
            particlesRef.current.forEach(p => {
                ctx.save();
                ctx.shadowBlur = 5;
                ctx.shadowColor = p.color;
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            });

            //ship explosion particles
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 2;
            shipDebrisRef.current.forEach(d => {
                const alpha = (d.life / d.maxLife) ** 2;
                ctx.save();
                ctx.translate(d.x, d.y);
                ctx.rotate(d.angle);
                ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(-d.size * 2, 0);
                ctx.lineTo(d.size * 2, 0);
                ctx.stroke();
                ctx.restore()
            });

            //respawning blinking ship or drawing the ship normally
            if (!shipExploding.current) {
                if (invincible.current) {
                    if (Math.floor(invincibleTime.current / 10) % 2 === 0) {
                        drawShip(shipRef.current.x,
                            shipRef.current.y,
                            shipRef.current.a,
                            shipRef.current.thrusting, // Pass whether ship is thrusting!
                            'white');
                    }
                } else {
                    drawShip(shipRef.current.x,
                        shipRef.current.y,
                        shipRef.current.a,
                        shipRef.current.thrusting, // Pass whether ship is thrusting!
                        'white');
                }
            }

            //bullets
            ctx.fillStyle = 'white';
            bulletsRef.current.forEach(bullet => {
                ctx.beginPath();
                ctx.arc(bullet.x, bullet.y, 2, 0, Math.PI * 2);
                ctx.fill();
            });

            //asteroids
            asteroidsRef.current.forEach(drawAsteroid);

            //debugging mode - shows hit boxes
            if (DEBUG) {
                // Draw asteroid polygons
                asteroidsRef.current.forEach(ast => {
                    const astPoly = getAsteroidPolygon(ast);
                    drawPolygon(ctx, astPoly, 'lime');
                });

                // Draw ship polygon
                const shipPoly = getShipPolygon(shipRef.current);

                let shipColor = 'cyan';
                if (!shipExploding.current) {
                    // Only check collision if ship is alive
                    for (const ast of asteroidsRef.current) {
                        const astPoly = getAsteroidPolygon(ast);
                        if (polygonsIntersect(shipPoly, astPoly)) {
                            shipColor = 'red';
                            break;
                        }
                    }
                } else {
                    shipColor = 'blue'; // or any color you want when ship is exploded
                }
                drawPolygon(ctx, shipPoly, shipColor);
            }

            //Draw gameover
            if (gameOverRef.current) {
                ctx.fillStyle = 'white';
                ctx.font = '50px "Press Start 2P"';
                ctx.textAlign = 'center';
                ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2);

                ctx.fillStyle = 'white';
                ctx.font = '20px "Press Start 2P"';
                ctx.fillText('Press R to Restart', canvas.width / 2, canvas.height / 2 + 50);
            }
        };

        startHeartbeat();

        const gameLoop = () => {
            updateShip();
            updateBullets();
            updateAsteroids();
            updateParticles();
            updateShipDebris();
            if (hyperspaceCooldownRef.current > 0) {
                hyperspaceCooldownRef.current--;
            }
            render();
            animationRef.current = requestAnimationFrame(gameLoop);
        };

        animationRef.current = requestAnimationFrame(gameLoop);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            cancelAnimationFrame(animationRef.current);
            clearInterval(heartbeatIntervalRef.current);
        };
    }, []);

    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center">
            <h1 className="text-4xl font-bold text-pink-400 mb-6 neon-text">Asteroids</h1>
            <canvas
                ref={canvasRef}
                width={1200}
                height={800}
                className="border-4 border-pink-500 bg-black"
            />
            <button
                onClick={() => navigate('/')}
                className="mt-8 px-6 py-3 border-2 border-pink-500 text-pink-400 hover:bg-pink-600 hover:text-black rounded-xl font-bold text-lg transition-all duration-300 neon-text"
            >
                Back to Games
            </button>
        </div>
    );
};

export default Asteroids;