import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import useAsteroidsGame from './useAsteroidsGame';

const Asteroids = () => {
    const navigate = useNavigate();
    const canvasRef = useRef(null);

    useAsteroidsGame(canvasRef);

    return (
        <div className="h-screen bg-black flex flex-col items-center justify-center">
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