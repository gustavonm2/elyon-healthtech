/**
 * Gaussian / Normal distribution random generator using Box-Muller transform
 */
export function getGaussianRandom(mean = 0, stdDev = 1): number {
    const u1 = Math.max(Number.EPSILON, Math.random());
    const u2 = Math.random();
    const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    return z0 * stdDev + mean;
}

/**
 * Calculates a organic fluctuated patient arrival count for the day
 * @param baseRate - average expected arrival rate (e.g., 100)
 * @param variance - fluctuation variance percentage (e.g., 0.15 for 15% variance)
 */
export function getRandomInflow(baseRate: number, variance: number = 0.15): number {
    const stdDev = Math.max(1, baseRate * variance);
    const result = getGaussianRandom(baseRate, stdDev);
    return Math.max(0, Math.round(result));
}
