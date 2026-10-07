/**
 * utils/metrics.js
 * Rolling window math utilities used by the baseline and signal services.
 * All functions are pure and side-effect free.
 */

/**
 * Compute mean of a number array.
 * Returns 0 for empty arrays.
 * @param {number[]} values
 * @returns {number}
 */
export function mean(values) {
  if (values.length === 0) return 0
  return values.reduce((sum, v) => sum + v, 0) / values.length
}

/**
 * Compute population standard deviation of a number array.
 * Returns 0 for arrays with fewer than 2 elements.
 * @param {number[]} values
 * @param {number} [precomputedMean] — pass if already computed to avoid double pass
 * @returns {number}
 */
export function stddev(values, precomputedMean) {
  if (values.length < 2) return 0
  const mu = precomputedMean !== undefined ? precomputedMean : mean(values)
  const variance = values.reduce((sum, v) => sum + (v - mu) ** 2, 0) / values.length
  return Math.sqrt(variance)
}

/**
 * Compute the Z-score of a single observed value against a distribution.
 * Returns 0 if std dev is 0 (no spread in baseline).
 *
 * @param {number} observed
 * @param {number} baselineMean
 * @param {number} baselineStddev
 * @returns {number}
 */
export function zscore(observed, baselineMean, baselineStddev) {
  if (baselineStddev === 0) return 0
  return (observed - baselineMean) / baselineStddev
}

/**
 * Clamp a value between min and max.
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

/**
 * Convert a Z-score to a confidence score in [0, 1].
 * Uses a logistic-style mapping so that:
 *   z=2.5 → ~0.82, z=3 → ~0.88, z=4 → ~0.95
 * @param {number} z — absolute Z-score
 * @returns {number} confidence in [0, 1]
 */
export function zscoreToConfidence(z) {
  return clamp(1 - Math.exp(-0.4 * Math.abs(z)), 0, 1)
}

/**
 * Compute a rolling mean using exponential smoothing (EMA).
 * alpha=0.1 gives slow adaptation; alpha=0.3 reacts faster.
 *
 * @param {number} previous — previous EMA value
 * @param {number} current  — new observation
 * @param {number} [alpha]  — smoothing factor (0 < alpha < 1)
 * @returns {number}
 */
export function ema(previous, current, alpha = 0.1) {
  return alpha * current + (1 - alpha) * previous
}

/**
 * Round a number to N decimal places.
 * @param {number} value
 * @param {number} [places]
 * @returns {number}
 */
export function round(value, places = 2) {
  const factor = 10 ** places
  return Math.round(value * factor) / factor
}

/**
 * Compute a percentile from a sorted (ascending) array.
 * @param {number[]} sortedValues
 * @param {number} p — percentile 0–100
 * @returns {number}
 */
export function percentile(sortedValues, p) {
  if (sortedValues.length === 0) return 0
  const index = clamp(Math.ceil((p / 100) * sortedValues.length) - 1, 0, sortedValues.length - 1)
  return sortedValues[index]
}
