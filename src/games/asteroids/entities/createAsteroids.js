const createAsteroids = (canvas, asteroidsRef, waveRef, count = 5) => {
    const ASTEROID_RADIUS = 100;
    const ASTEROID_SPEED = 50 / 60;
    const newAsteroids = [];
    const speedMultiplier = 1 + 0.1 * (waveRef.current - 1);
  
    for (let i = 0; i < count; i++) {
      const sides = Math.floor(Math.random() * 9) + 8; // 8-16 sides
      const vertices = Array.from({ length: sides }, () => 0.5 + Math.random());
  
      newAsteroids.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: ASTEROID_RADIUS,
        xVel: (Math.random() - 0.5) * ASTEROID_SPEED * speedMultiplier,
        yVel: (Math.random() - 0.5) * ASTEROID_SPEED * speedMultiplier,
        angle: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.01,
        sides,
        vertices
      });
    }
  
    asteroidsRef.current = newAsteroids;
  };
  
  export default createAsteroids;
  