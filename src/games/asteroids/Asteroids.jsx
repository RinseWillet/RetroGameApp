import React, { useRef } from 'react';
import useAsteroidsGame from './useAsteroidsGame';

const Asteroids = () => {
  const canvasRef = useRef(null);

  useAsteroidsGame(canvasRef);

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center">
      <h1 className="text-4xl font-bold text-pink-400 mb-6 neon-text">Asteroids</h1>
      <canvas
        ref={canvasRef}
        width={1200}
        height={800}
        className="border-4 border-pink-500 bg-black"
      />
    </div>
  );
};

export default Asteroids;