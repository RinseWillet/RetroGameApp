const pointInPolygon = (point, polygon) => {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].x, yi = polygon[i].y;
      const xj = polygon[j].x, yj = polygon[j].y;
  
      const intersect = ((yi > point.y) !== (yj > point.y)) &&
        (point.x < ((xj - xi) * (point.y - yi)) / ((yj - yi) + 0.000001) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  };
  
  const polygonsIntersect = (poly1, poly2) => {
    const polys = [poly1, poly2];
    for (let i = 0; i < polys.length; i++) {
      const polygon = polys[i];
      for (let j = 0; j < polygon.length; j++) {
        const k = (j + 1) % polygon.length;
        const p1 = polygon[j];
        const p2 = polygon[k];
        const normal = { x: p2.y - p1.y, y: p1.x - p2.x };
  
        let [minA, maxA] = [Infinity, -Infinity];
        for (const p of poly1) {
          const proj = normal.x * p.x + normal.y * p.y;
          minA = Math.min(minA, proj);
          maxA = Math.max(maxA, proj);
        }
  
        let [minB, maxB] = [Infinity, -Infinity];
        for (const p of poly2) {
          const proj = normal.x * p.x + normal.y * p.y;
          minB = Math.min(minB, proj);
          maxB = Math.max(maxB, proj);
        }
  
        if (maxA < minB || maxB < minA) return false;
      }
    }
    return true;
  };
  
  export { pointInPolygon, polygonsIntersect };
  