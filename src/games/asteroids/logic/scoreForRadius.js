export const scoreForRadius = (r) => {
    if (r > 50) return 20;
    if (r > 25) return 50;
    return 100;
  };