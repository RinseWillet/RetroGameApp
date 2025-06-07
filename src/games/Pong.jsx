import { useEffect, useRef } from 'react'
import useSynthFX from '../hooks/useSynthFX'
import { useNavigate } from 'react-router-dom';

const Pong = () => {
  const navigate = useNavigate(); 
  const canvasRef = useRef(null);
  const keysDownRef = useRef({});
  const animationRef = useRef(null);
  const gameStartedRef = useRef(false);
  const gameOverRef = useRef(false);
  const { beep } = useSynthFX();


  useEffect(() => {    
    const canvas = canvasRef.current;
    canvas.focus();
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width = 1200;
    const height = canvas.height = 800;

    //these lines make sure that the buttons pressed for playing the game
    //do not accidentally trigger the back to main page button
    canvas.focus();
    const handleCanvasClick = () => {
      canvas.focus();
    };
    
    canvas.addEventListener('click', handleCanvasClick);

    //boolean to create a small delay between gameover and restart
    let allowRestart = true;

    // --- Game Classes ---
    class Paddle {
      constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.x_speed = 0;
        this.y_speed = 0;
        this.score = 0;
      }
      render = () => {
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(this.x, this.y, this.width, this.height);
      }
      move = (x, y) => {
        this.x += x;
        this.y += y;
        this.x_speed = x;
        this.y_speed = y;
        if (this.y < 0) {
          this.y = 0;
          this.y_speed = 0;
        } else if (this.y + this.height > height) {
          this.y = height - this.height;
          this.y_speed = 0;
        }
      }
    }

    class Player {
      constructor() {
        this.paddle = new Paddle(1180, 375, 10, 50);
      }
      render = () => {
        this.paddle.render();
      }
      update = () => {
        const keysDown = keysDownRef.current
        if (keysDown["ArrowUp"]) {
          this.paddle.move(0, -6);
        } else if (keysDown["ArrowDown"]) {
          this.paddle.move(0, 6);
        } else {
          this.paddle.move(0, 0);
        }
      }
    }

    class Computer {
      constructor() {
        this.paddle = new Paddle(10, 375, 10, 50);
      }
      render = () => {
        this.paddle.render();
      }
      update = (ball) => {
        const y_pos = ball.y;
        let diff = -((this.paddle.y + this.paddle.height / 2) - y_pos);
        if (diff < 0 && diff < -6) diff = -5;
        if (diff > 0 && diff > 6) diff = 5;
        this.paddle.move(0, diff);
      }
    }

    class Ball {
      constructor(x, y) {
        this.x = x;
        this.y = y;
        this.x_speed = 7;
        this.y_speed = 0;
        this.radius = 5;
      }
      render = () => {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 2 * Math.PI, false);
        ctx.fillStyle = "#FFFFFF";
        ctx.fill();
      }
      update = (paddle1, paddle2) => {
        this.x += this.x_speed;
        this.y += this.y_speed;

        if (this.y - 5 < 0) {
          this.y = 5;
          this.y_speed = -this.y_speed;
          beep(300, 0.2, 'square');
        } else if (this.y + 5 > height) {
          this.y = height - 5;
          this.y_speed = -this.y_speed;
          beep(300, 0.2, 'square');
        }

        if (this.x < 0 || this.x > width) {
          if (this.x < 0) {
            player.paddle.score++;
          } else {
            computer.paddle.score++;
          }
          this.x_speed = (this.x < 0) ? 7 : -7;
          this.y_speed = 0;
          this.x = width / 2;
          this.y = height / 2;
          beep(600, 0.4, 'triangle')
        }

        // Paddle collision
        const top_x = this.x - 5;
        const bottom_x = this.x + 5;
        const top_y = this.y - 5;
        const bottom_y = this.y + 5;

        if (top_x > width / 2) {
          if (top_x < (paddle1.x + paddle1.width) && bottom_x > paddle1.x && top_y < (paddle1.y + paddle1.height) && bottom_y > paddle1.y) {
            this.x_speed = -7;
            this.y_speed += paddle1.y_speed / 2;
            this.x += this.x_speed;
            beep(200, 0.2, 'square')
          }
        } else {
          if (top_x < (paddle2.x + paddle2.width) && bottom_x > paddle2.x && top_y < (paddle2.y + paddle2.height) && bottom_y > paddle2.y) {
            this.x_speed = 7;
            this.y_speed += paddle2.y_speed / 2;
            this.x += this.x_speed;
            beep(200, 0.2, 'square')
          }
        }
      }
    }

    // --- Game Setup ---
    const player = new Player();
    const computer = new Computer();
    const ball = new Ball(width / 2, height / 2);

    const render = () => {
      // Calculate a pulsing alpha value based on time
      const time = Date.now() / 700; // Adjust speed by changing 500
      const alpha = 0.75 + 0.25 * Math.sin(time); // Pulsates between 0 and 1
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, width, height);

      // Net
      ctx.beginPath();
      ctx.setLineDash([7, 15]);
      ctx.moveTo(width / 2, 0);
      ctx.lineTo(width / 2, height);
      ctx.lineWidth = 5;
      ctx.strokeStyle = "#ffffff";
      ctx.stroke();

      // Scores
      ctx.font = "40px 'Press Start 2P', monospace";
      ctx.fillStyle = "white";
      ctx.textAlign = "center";
      ctx.fillText(player.paddle.score || 0, width / 4, 50);
      ctx.fillText(computer.paddle.score || 0, width * 3 / 4, 50);

      player.render();
      computer.render();
      ball.render();

      if (!gameStartedRef.current) { 
        ctx.font = "50px 'Press Start 2P', monospace";
        ctx.textAlign = "center";

        if(gameOverRef.current){ 
          ctx.fillStyle = `rgba(255, 255, 255, ${alpha.toFixed(2)})`;
          if (player.paddle.score >= 10) {
            ctx.fillText("PLAYER WINS!", width / 2, height / 2);
          } else if (computer.paddle.score >= 10) {
            ctx.fillText("COMPUTER WINS!", width / 2, height / 2);
          }
        } else {
          // Draw "Press Space to Start" if game not started
          ctx.fillStyle = `rgba(255, 255, 255, ${alpha.toFixed(2)})`;
          ctx.fillText("Press SPACE to Start", width / 2, height / 2);
        }      
      }

      // --- Subtle CRT Scanlines ---
      const scanlineAlpha = 0.03 + 0.01 * Math.sin(Date.now() / 500);
      ctx.fillStyle = `rgba(255, 255, 255, ${scanlineAlpha.toFixed(3)})`;
      for (let y = 0; y < height; y += 4) {
        ctx.fillRect(0, y, width, 1);
      }

    }

    const update = () => {
      player.update();
      computer.update(ball);
      ball.update(player.paddle, computer.paddle);

      // Check if someone reached 10 points
      if (player.paddle.score >= 10 || computer.paddle.score >= 10) {        
        gameStartedRef.current = false; // stop updating the game
        gameOverRef.current = true
        allowRestart = false;
        beep(1000, 0.5, 'triangle'); // victory sound!

        // After 3 seconds, reset the scores
        setTimeout(() => {
          player.paddle.score = 0;
          computer.paddle.score = 0;
          gameOverRef.current = false;
          allowRestart = true;
        }, 3000);
      }
    }

    const step = () => {
      render();
      if (gameStartedRef.current) {
        update();
      };
      animationRef.current = requestAnimationFrame(step);
    }

    // Start the game
    animationRef.current = requestAnimationFrame(step);

    // --- Clean up ---
    const handleKeyDown = (e) => {
      if (e.code === 'Space') {
        e.preventDefault(); // prevent scrolling or triggering focused buttons
      }

      if (!gameStartedRef.current && !gameOverRef.current && allowRestart && e.code === 'Space') {
        gameStartedRef.current = true;
        player.paddle.score = 0;
        computer.paddle.score = 0;
        ball.x = width / 2;
        ball.y = height / 2;
        ball.x_speed = -7;
        ball.y_speed = 0;
        beep(800, 0.5, 'triangle');
      }
      keysDownRef.current[e.code] = true;
    }

    const handleKeyUp = (e) => { delete keysDownRef.current[e.code]; }

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      canvas.removeEventListener("click", handleCanvasClick);
      cancelAnimationFrame(animationRef.current);
    }
  }, []);

  return (
    <div className="relative min-h-screen bg-black overflow-hidden flex flex-col items-center justify-center">

      {/* Background stars */}
      <div className="absolute inset-0 z-0 animate-stars pointer-events-none" />

      {/* Foreground Pong */}
      <h1 className="text-4xl font-bold text-pink-400 mb-6 neon-text z-10">Pong</h1>
      <canvas
        ref={canvasRef}
        tabIndex={0} // <- this ensures focus for keyup and keydown on the canvas
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

  )
}

export default Pong