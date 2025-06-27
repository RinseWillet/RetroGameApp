import { useEffect, useRef } from 'react';
import useSynthFX from '../../hooks/useSynthFX';
import Player from './entities/Player';
import Computer from './entities/Computer';
import Ball from './entities/Ball';

const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 800;

const usePongGame = (canvasRef) => {
  const keysDownRef = useRef({});
  const animationRef = useRef(null);
  const gameStartedRef = useRef(false);
  const gameOverRef = useRef(false);
  const allowRestartRef = useRef(true);

  const { beep } = useSynthFX();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    canvas.focus();

    const handleCanvasClick = () => canvas.focus();
    canvas.addEventListener('click', handleCanvasClick);

    const player = new Player(CANVAS_HEIGHT);
    const computer = new Computer(CANVAS_HEIGHT);
    const ball = new Ball(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);

    const drawNetAndScore = () => {
      // Net
      ctx.beginPath();
      ctx.setLineDash([7, 15]);
      ctx.moveTo(CANVAS_WIDTH / 2, 0);
      ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT);
      ctx.lineWidth = 5;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();

      // Scores
      ctx.font = "40px 'Press Start 2P', monospace";
      ctx.fillStyle = 'white';
      ctx.textAlign = 'center';
      ctx.fillText(computer.paddle.score, CANVAS_WIDTH / 4, 50);
      ctx.fillText(player.paddle.score, CANVAS_WIDTH * 3 / 4, 50);
    };

    const drawScanlines = () => {
      const alpha = 0.03 + 0.01 * Math.sin(Date.now() / 500);
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha.toFixed(3)})`;
      for (let y = 0; y < CANVAS_HEIGHT; y += 4) {
        ctx.fillRect(0, y, CANVAS_WIDTH, 1);
      }
    };

    const render = () => {
      const pulse = 0.75 + 0.25 * Math.sin(Date.now() / 700);
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      drawNetAndScore();
      player.render(ctx);
      computer.render(ctx);
      ball.render(ctx);

      if (!gameStartedRef.current) {
        ctx.font = "50px 'Press Start 2P', monospace";
        ctx.textAlign = 'center';
        ctx.fillStyle = `rgba(255, 255, 255, ${pulse.toFixed(2)})`;
        
        if (gameOverRef.current) {
          ctx.fillText(
            player.paddle.score >= 10 ? 'PLAYER WINS!' : 'COMPUTER WINS!',
            CANVAS_WIDTH / 2,
            CANVAS_HEIGHT / 2
          );
        } else {
          ctx.fillText('Press SPACE to Start', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
        }
      }

      drawScanlines();
    };

    const update = () => {
      player.update(keysDownRef.current, CANVAS_HEIGHT);
      computer.update(ball, CANVAS_HEIGHT);
      ball.update(player.paddle, computer.paddle, CANVAS_WIDTH, CANVAS_HEIGHT, beep);

      if (player.paddle.score >= 10 || computer.paddle.score >= 10) {
        gameStartedRef.current = false;
        gameOverRef.current = true;
        allowRestartRef.current = false;
        beep(1000, 0.5, 'triangle');

        setTimeout(() => {
          player.paddle.score = 0;
          computer.paddle.score = 0;
          gameOverRef.current = false;
          allowRestartRef.current = true;
        }, 3000);
      }
    };

    const step = () => {
      render();
      if (gameStartedRef.current) update();
      animationRef.current = requestAnimationFrame(step);
    };

    animationRef.current = requestAnimationFrame(step);

    const handleKeyDown = (e) => {
      if (e.code === 'Space') e.preventDefault();

      if (!gameStartedRef.current && !gameOverRef.current && allowRestartRef.current && e.code === 'Space') {
        gameStartedRef.current = true;
        player.paddle.score = 0;
        computer.paddle.score = 0;
        ball.reset(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, -1);
        beep(800, 0.5, 'triangle');
      }
      keysDownRef.current[e.code] = true;
    };

    const handleKeyUp = (e) => {
      delete keysDownRef.current[e.code];
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      canvas.removeEventListener('click', handleCanvasClick);
      cancelAnimationFrame(animationRef.current);
    };
  }, [beep, canvasRef]);
};

export default usePongGame;
