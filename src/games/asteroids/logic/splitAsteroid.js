export const splitAsteroid = (asteroid) => {
    const { r } = asteroid;
    if (r <= 25) return [];
  
    const speed = 50 / 60;
    return [0, 1].map(() => ({
      ...asteroid,
      r: r / 2,
      xVel: (Math.random() - 0.5) * 2 * speed,
      yVel: (Math.random() - 0.5) * 2 * speed,
    }));
  };