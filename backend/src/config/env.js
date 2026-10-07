/**
 * config/env.js
 * Loads, validates, and exports all environment variables.
 * Import this module first in server.js so the rest of the app
 * can rely on validated values from process.env.
 */

import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

// Resolve directory to load .env reliably whether started from backend/ or project root
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 1. Try backend/.env
dotenv.config({ path: path.resolve(__dirname, '../../.env') })
// 2. Try root dns_x/.env
dotenv.config({ path: path.resolve(__dirname, '../../../.env') })
// 3. Fallback to process.cwd() .env
dotenv.config()

function required(key, fallback = undefined) {
  const value = process.env[key] ?? fallback
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`)
  }
  return value
}

function optional(key, defaultValue) {
  return process.env[key] ?? defaultValue
}

function optionalInt(key, defaultValue) {
  const raw = process.env[key]
  if (raw === undefined || raw === '') return defaultValue
  const parsed = parseInt(raw, 10)
  if (Number.isNaN(parsed)) {
    throw new Error(`Environment variable ${key} must be an integer, got: "${raw}"`)
  }
  return parsed
}

function optionalFloat(key, defaultValue) {
  const raw = process.env[key]
  if (raw === undefined || raw === '') return defaultValue
  const parsed = parseFloat(raw)
  if (Number.isNaN(parsed)) {
    throw new Error(`Environment variable ${key} must be a float, got: "${raw}"`)
  }
  return parsed
}

function optionalBool(key, defaultValue) {
  const raw = process.env[key]
  if (raw === undefined || raw === '') return defaultValue
  return raw.toLowerCase() === 'true'
}

// ── Server ────────────────────────────────────────────────────────────────────
export const NODE_ENV      = optional('NODE_ENV', 'development')
export const PORT          = optionalInt('PORT', 3001)
export const API_BASE_PATH = optional('API_BASE_PATH', '/api/v1')
export const IS_PRODUCTION = NODE_ENV === 'production'
export const IS_DEVELOPMENT = NODE_ENV === 'development'

// ── Security ──────────────────────────────────────────────────────────────────
export const API_KEY      = optional('API_KEY', '')
export const CORS_ORIGINS = optional(
  'CORS_ORIGINS',
  'http://localhost:5173,http://127.0.0.1:5173,https://dns-x002.vercel.app,https://dns-x-002.vercel.app'
)
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean)

// ── Supabase ──────────────────────────────────────────────────────────────────
export const SUPABASE_URL = optional(
  'SUPABASE_URL',
  optional('VITE_SUPABASE_URL', 'https://megstikozgcqazmopkcz.supabase.co')
)
export const SUPABASE_SERVICE_ROLE_KEY = optional(
  'SUPABASE_SERVICE_ROLE_KEY',
  optional(
    'SUPABASE_ANON_KEY',
    optional('VITE_SUPABASE_ANON_KEY', 'sb_publishable_j6HzTMVfNgPXKK-MLLiV_Q_WV0HR_hA')
  )
)

// ── Telemetry ─────────────────────────────────────────────────────────────────
export const DNS_X_SIMULATION             = optionalBool('DNS_X_SIMULATION', true)
export const TELEMETRY_FLUSH_INTERVAL_MS  = optionalInt('TELEMETRY_FLUSH_INTERVAL_MS', 5000)
export const METRIC_WINDOWS               = optional('METRIC_WINDOWS', '1m,5m,1h')
  .split(',')
  .map((w) => w.trim())
  .filter(Boolean)

// ── Baseline & Signal Detection ───────────────────────────────
export const BASELINE_WINDOW_COUNT    = optionalInt('BASELINE_WINDOW_COUNT', 60)
export const SIGNAL_ZSCORE_THRESHOLD  = optionalFloat('SIGNAL_ZSCORE_THRESHOLD', 2.5)
export const SIGNAL_MIN_CONFIDENCE    = optionalFloat('SIGNAL_MIN_CONFIDENCE', 0.6)

// ── Correlation Engine ────────────────────────────────────────
export const CORRELATION_WINDOW_MS   = optionalInt('CORRELATION_WINDOW_MS', 120_000)
export const CORRELATION_MIN_SIGNALS = optionalInt('CORRELATION_MIN_SIGNALS', 2)

// ── Python ML Bridge ──────────────────────────────────────────
export const PYTHON_BIN      = optional('PYTHON_BIN', 'python')
export const ML_SCRIPT_PATH  = optional('ML_SCRIPT_PATH', './ml/main.py')
export const ML_TIMEOUT_MS   = optionalInt('ML_TIMEOUT_MS', 8000)

// ── WebSocket / Real-time ─────────────────────────────────────
export const REALTIME_BROADCAST_INTERVAL_MS = optionalInt('REALTIME_BROADCAST_INTERVAL_MS', 2000)

// ── Logging ───────────────────────────────────────────────────
export const LOG_LEVEL = optional('LOG_LEVEL', 'info')
