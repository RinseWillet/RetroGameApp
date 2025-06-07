const dist = (x1, y1, x2, y2) => {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
  };
  
  const wrapAround = (obj, canvas) => {
    if (obj.x < 0 - obj.r) obj.x = canvas.width + obj.r;
    else if (obj.x > canvas.width + obj.r) obj.x = 0 - obj.r;
    if (obj.y < 0 - obj.r) obj.y = canvas.height + obj.r;
    else if (obj.y > canvas.height + obj.r) obj.y = 0 - obj.r;
  };
  
  export { dist, wrapAround };
  