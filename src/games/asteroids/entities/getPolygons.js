const getShipPolygon = (ship) => {
    return [
      { x: ship.x + (4 / 3) * ship.r * Math.cos(ship.a), y: ship.y - (4 / 3) * ship.r * Math.sin(ship.a) },
      { x: ship.x - ship.r * (Math.cos(ship.a) + 0.6 * Math.sin(ship.a)), y: ship.y + ship.r * (Math.sin(ship.a) - 0.6 * Math.cos(ship.a)) },
      { x: ship.x - 0.5 * ship.r * (Math.cos(ship.a) + Math.sin(ship.a)), y: ship.y + 0.5 * ship.r * (Math.sin(ship.a) - Math.cos(ship.a)) },
      { x: ship.x - 0.5 * ship.r * (Math.cos(ship.a) - Math.sin(ship.a)), y: ship.y + 0.5 * ship.r * (Math.sin(ship.a) + Math.cos(ship.a)) },
      { x: ship.x - ship.r * (Math.cos(ship.a) - 0.6 * Math.sin(ship.a)), y: ship.y + ship.r * (Math.sin(ship.a) + 0.6 * Math.cos(ship.a)) },
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
  
  export { getShipPolygon, getAsteroidPolygon };