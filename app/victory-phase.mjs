export function evaluateVictoryRecord({ score, time, bestScore, bestTime }) {
  return {
    score: score > bestScore,
    time: bestTime === 0 || time < bestTime,
  };
}
