/// <reference lib="webworker" />

addEventListener('message', ({ data }) => {
  const priceHistory = data.history;
  const id = data.id;

  if (priceHistory.length < 2) {
    postMessage({ id: id, movingAverage: priceHistory[0] || 0, volatility: 0 });
    return;
  }

// Cálculo de Promedio Móvil (Simple)
  const sum = priceHistory.reduce((a: number, b: number) => a + b, 0);
  const movingAverage = sum / priceHistory.length;

// Cálculo de Volatilidad (Desviación Estándar)
  const mean = movingAverage;
  const squareDiffs = priceHistory.map((value: number) => Math.pow(value - mean, 2));
  const avgSquareDiff = squareDiffs.reduce((a: number, b: number) => a + b, 0) / priceHistory.length;
  const volatility = Math.sqrt(avgSquareDiff);

  postMessage({ id: id, movingAverage, volatility });
});
