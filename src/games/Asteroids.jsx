import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const FPS = 60;
const SHIP_SIZE = 30;
const TURN_SPEED = 360;
const THRUST = 5;
const FRICTION = 0.7;

//Asteroid constants:
const ASTEROID_SPEED = 50 / FPS; // pixels per frame (since everything updates every frame)
const ASTEROID_RADIUS = 100; // initial asteroid size
const HITBOX_MULTIPLIER = 1.2;

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
                xVel: (Math.random() - 0.5) * ASTEROID_SPEED,
                yVel: (Math.random() - 0.5) * ASTEROID_SPEED,
                angle: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.01,
                sides: sides,
                vertices: vertices,
            });
        };
        asteroidsRef.current = newAsteroids;
    }

    const destroyAsteroid = (index) => {
        const asteroid = asteroidsRef.current[index];

        const x = asteroid.x;
        const y = asteroid.y;
        const r = asteroid.r;

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

    const checkShipCollision = () => {
        if (invincible.current) return false;

        const ship = shipRef.current;
        for (const ast of asteroidsRef.current) {
            const d = dist(ship.x, ship.y, ast.x, ast.y);
            if (d < ship.r + ast.r * HITBOX_MULTIPLIER) {
                return true;
            }
        }
        return false;
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        createAsteroids(canvas);

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
                }
            }
        };

        const handleKeyUp = (e) => {
            keyRefs.current[e.code] = false;
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        const updateShip = () => {
            const keys = keyRefs.current;
            const ship = shipRef.current;

            if (!shipExploding.current && checkShipCollision()) {
                shipExploding.current = true;
                explosionTime.current = 60;
                ship.thrust.x = 0;
                ship.thrust.y = 0;
                spawnShipDebris();
                return;
            }

            if (shipExploding.current) {
                explosionTime.current--;
                if (explosionTime.current <= 0) {
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
            asteroidsRef.current.forEach(ast => {
                ast.x += ast.xVel;
                ast.y += ast.yVel;
                ast.angle += ast.rotationSpeed;
                wrapAround(ast, canvas);
            });
        };

        const updateBullets = () => {
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
                    if (dist(bullet.x, bullet.y, ast.x, ast.y) < ast.r * HITBOX_MULTIPLIER) {
                        destroyAsteroid(j);
                        bullets.splice(i, 1); // remove bullet
                        break; // move to next bullet
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

            //respawning blinking ship 
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

            asteroidsRef.current.forEach(drawAsteroid);
            // ctx.strokeStyle = 'red';
            // ctx.lineWidth = 1;
            // asteroidsRef.current.forEach(ast => {
            //     ctx.beginPath();
            //     ctx.arc(ast.x, ast.y, ast.r * HITBOX_MULTIPLIER, 0, Math.PI * 2);
            //     ctx.stroke();
            // });
        };

        const gameLoop = () => {
            updateShip();
            updateBullets();
            updateAsteroids();
            updateParticles();
            updateShipDebris();
            render();
            animationRef.current = requestAnimationFrame(gameLoop);
        };

        animationRef.current = requestAnimationFrame(gameLoop);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            cancelAnimationFrame(animationRef.current);
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