import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const FPS = 60;
const SHIP_SIZE = 30; // ship height in pixels
const TURN_SPEED = 360; // degrees per second
const THRUST = 5; // acceleration in pixels per second^2
const FRICTION = 0.7; // friction coefficient (0 = no friction, 1 = lots)

const Asteroids = () => {
    const navigate = useNavigate();
    const canvasRef = useRef(null);
    const animationRef = useRef(null);

    const [keys, setKeys] = useState({});
    const shipRef = useRef({
        x: 600,
        y: 400,
        r: SHIP_SIZE / 2,
        a: 90 / 180 * Math.PI, // convert to radians
        rot: 0,
        thrusting: false,
        thrust: { x: 0, y: 0 },
    });

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        const handleKeyDown = (e) => {
            setKeys((prev) => ({ ...prev, [e.code]: true }));
        };

        const handleKeyUp = (e) => {
            setKeys((prev) => ({ ...prev, [e.code]: false }));
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        const update = () => {
            const ship = shipRef.current;

            // Handle rotation
            if (keys['ArrowLeft']) {
                ship.rot = TURN_SPEED / 180 * Math.PI / FPS;
            } else if (keys['ArrowRight']) {
                ship.rot = -TURN_SPEED / 180 * Math.PI / FPS;
            } else {
                ship.rot = 0;
            }

            // Handle thrust
            ship.thrusting = keys['ArrowUp'] || false;
            if (ship.thrusting) {
                ship.thrust.x += (THRUST * Math.cos(ship.a)) / FPS;
                ship.thrust.y -= (THRUST * Math.sin(ship.a)) / FPS;
            } else {
                ship.thrust.x -= (FRICTION * ship.thrust.x) / FPS;
                ship.thrust.y -= (FRICTION * ship.thrust.y) / FPS;
            }

            // Rotate
            ship.a += ship.rot;

            // Move
            ship.x += ship.thrust.x;
            ship.y += ship.thrust.y;

            // Screen wrap
            if (ship.x < 0 - ship.r) ship.x = canvas.width + ship.r;
            else if (ship.x > canvas.width + ship.r) ship.x = 0 - ship.r;
            if (ship.y < 0 - ship.r) ship.y = canvas.height + ship.r;
            else if (ship.y > canvas.height + ship.r) ship.y = 0 - ship.r;
        };

        const drawShip = (x, y, a, color = 'white') => {
            ctx.strokeStyle = color;
            ctx.lineWidth = SHIP_SIZE / 20;
            ctx.beginPath();
            ctx.moveTo(
                x + (4 / 3) * shipRef.current.r * Math.cos(a),
                y - (4 / 3) * shipRef.current.r * Math.sin(a)
            );
            ctx.lineTo(
                x - shipRef.current.r * ((2 / 3) * Math.cos(a) + Math.sin(a)),
                y + shipRef.current.r * ((2 / 3) * Math.sin(a) - Math.cos(a))
            );
            ctx.lineTo(
                x - shipRef.current.r * ((2 / 3) * Math.cos(a) - Math.sin(a)),
                y + shipRef.current.r * ((2 / 3) * Math.sin(a) + Math.cos(a))
            );
            ctx.closePath();
            ctx.stroke();
        };

        const render = () => {
            ctx.fillStyle = 'black';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            drawShip(shipRef.current.x, shipRef.current.y, shipRef.current.a);
        };

        const gameLoop = () => {
            update();
            render();
            animationRef.current = requestAnimationFrame(gameLoop);
        };

        animationRef.current = requestAnimationFrame(gameLoop);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            cancelAnimationFrame(animationRef.current);
        };
    }, [keys]);

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
