import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import usePongGame from './usePongGame';

const Pong = () => {
  const canvasRef = useRef(null);
  const navigate = useNavigate();

  usePongGame(canvasRef);

  return (
    <div className="relative h-screen bg-black flex flex-col items-center justify-center">
      <div className="absolute inset-0 z-0 animate-stars pointer-events-none" />
      <h1 className="text-4xl font-bold text-pink-400 mb-6 neon-text z-10">Pong</h1>

      <canvas
        ref={canvasRef}
        tabIndex={0}
        width={1200}
        height={800}
        className="border-4 border-pink-500 bg-black z-10 focus:outline-none"
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

export default Pong;