/**
 * repositories/infrastructureRepository.js
 * Supabase queries for the resolvers table with resilient offline/simulation fallback.
 */

import supabase from '../config/database.js'

const DEFAULT_RESOLVERS = [
  { id: 'resolver-01', name: 'Resolver-01', ip: '192.168.1.10', port: 53, status: 'healthy' },
  { id: 'resolver-02', name: 'Resolver-02', ip: '192.168.1.11', port: 53, status: 'healthy' },
  { id: 'resolver-03', name: 'Resolver-03', ip: '192.168.1.12', port: 53, status: 'healthy' },
]

/**
 * Return all known resolvers.
 * @returns {Promise<object[]>}
 */
export async function getAllResolvers() {
  if (
    process.env.DNS_X_SIMULATION === 'true' ||
    !process.env.SUPABASE_URL ||
    process.env.SUPABASE_URL.includes('placeholder')
  ) {
    return DEFAULT_RESOLVERS
  }

  try {
    const { data, error } = await supabase
      .from('resolvers')
      .select('*')
      .order('name', { ascending: true })
    if (error) throw error
    if (data && data.length > 0) return data
    return DEFAULT_RESOLVERS
  } catch {
    return DEFAULT_RESOLVERS
  }
}

/**
 * Return a single resolver by id.
 * @param {string} id
 * @returns {Promise<object|null>}
 */
export async function getResolverById(id) {
  try {
    const { data, error } = await supabase
      .from('resolvers')
      .select('*')
      .eq('id', id)
      .maybeSingle()
    if (error) throw error
    if (data) return data
    return DEFAULT_RESOLVERS.find((r) => r.id === id) ?? null
  } catch {
    return DEFAULT_RESOLVERS.find((r) => r.id === id) ?? null
  }
}

/**
 * Upsert resolver status / last_seen metadata.
 * @param {string} id
 * @param {object} patch  — partial resolver fields
 * @returns {Promise<object>}
 */
export async function updateResolverStatus(id, patch) {
  try {
    const { data, error } = await supabase
      .from('resolvers')
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .maybeSingle()
    if (error) throw error
    return data
  } catch {
    return { id, ...patch }
  }
}
