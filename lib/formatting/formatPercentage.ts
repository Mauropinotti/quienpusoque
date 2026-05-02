export function formatPercentage(ratio: number, decimals = 0): string {
  return `${(ratio * 100).toFixed(decimals)}%`;
}
