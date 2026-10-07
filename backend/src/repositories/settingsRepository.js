/**
 * repositories/settingsRepository.js
 * Supabase queries for the system_settings key/value store.
 */

import supabase from '../config/database.js'

// In-memory fallback store
const inMemorySettings = {}

function isSimulationOrTest() {
  return (
    process.env.DNS_X_SIMULATION === 'true' ||
    process.env.NODE_ENV === 'test' ||
    !process.env.SUPABASE_URL ||
    process.env.SUPABASE_URL.includes('placeholder')
  )
}

/**
 * Return all settings as a plain object { key: value, … }.
 * @returns {Promise<object>}
 */
export async function getAllSettings() {
  if (isSimulationOrTest()) {
    return { ...inMemorySettings }
  }

  try {
    const { data, error } = await supabase
      .from('system_settings')
      .select('key, value')
    if (error) {
      return { ...inMemorySettings }
    }
    const fromDb = Object.fromEntries((data ?? []).map((r) => [r.key, r.value]))
    return { ...inMemorySettings, ...fromDb }
  } catch (_err) {
    return { ...inMemorySettings }
  }
}

/**
 * Upsert a single setting.
 * @param {string} key
 * @param {*} value  — stored as JSONB
 */
export async function upsertSetting(key, value) {
  inMemorySettings[key] = value

  if (isSimulationOrTest()) return

  try {
    const { error } = await supabase
      .from('system_settings')
      .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' })
    if (error && error.code !== 'PGRST205' && !error.message?.includes('schema cache')) {
      // non-fatal
    }
  } catch (_err) {
    // non-fatal fallback
  }
}

/**
 * Upsert multiple settings in a single call.
 * @param {object} patch  — { key: value, … }
 */
export async function upsertSettings(patch) {
  Object.assign(inMemorySettings, patch)

  if (isSimulationOrTest()) return

  try {
    const rows = Object.entries(patch).map(([key, value]) => ({
      key,
      value,
      updated_at: new Date().toISOString(),
    }))
    const { error } = await supabase
      .from('system_settings')
      .upsert(rows, { onConflict: 'key' })
    if (error && error.code !== 'PGRST205' && !error.message?.includes('schema cache')) {
      // non-fatal
    }
  } catch (_err) {
    // non-fatal
  }
}


