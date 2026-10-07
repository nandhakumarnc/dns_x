/**
 * services/alertService.js
 * Outbound alert integration management with resilient in-memory fallback.
 */

import crypto from 'node:crypto'
import supabase from '../config/database.js'

const inMemoryIntegrations = new Map()

function isMissingTableError(error) {
  return error?.code === 'PGRST205' || error?.message?.includes('schema cache')
}

export async function listIntegrations() {
  try {
    const { data, error } = await supabase
      .from('alert_integrations')
      .select('id, type, enabled, created_at, updated_at')
      .order('created_at', { ascending: false })
    if (error) {
      if (isMissingTableError(error)) {
        return Array.from(inMemoryIntegrations.values())
      }
      throw error
    }
    return data ?? []
  } catch (err) {
    if (isMissingTableError(err)) {
      return Array.from(inMemoryIntegrations.values())
    }
    throw err
  }
}

export async function createIntegration({ type, config, enabled = true }) {
  const row = {
    id: crypto.randomUUID(),
    type,
    config,
    enabled,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  try {
    const { data, error } = await supabase
      .from('alert_integrations')
      .insert({ type, config, enabled })
      .select()
      .single()
    if (error) {
      if (isMissingTableError(error)) {
        inMemoryIntegrations.set(row.id, row)
        return row
      }
      throw error
    }
    return data
  } catch (err) {
    if (isMissingTableError(err)) {
      inMemoryIntegrations.set(row.id, row)
      return row
    }
    throw err
  }
}

export async function updateIntegration(id, patch) {
  try {
    const { data, error } = await supabase
      .from('alert_integrations')
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .maybeSingle()
    if (error) {
      if (isMissingTableError(error)) {
        const existing = inMemoryIntegrations.get(id)
        if (!existing) return null
        const updated = { ...existing, ...patch, updated_at: new Date().toISOString() }
        inMemoryIntegrations.set(id, updated)
        return updated
      }
      throw error
    }
    return data
  } catch (err) {
    if (isMissingTableError(err)) {
      const existing = inMemoryIntegrations.get(id)
      if (!existing) return null
      const updated = { ...existing, ...patch, updated_at: new Date().toISOString() }
      inMemoryIntegrations.set(id, updated)
      return updated
    }
    throw err
  }
}

export async function deleteIntegration(id) {
  try {
    const { error } = await supabase
      .from('alert_integrations')
      .delete()
      .eq('id', id)
    if (error && !isMissingTableError(error)) throw error
  } catch (err) {
    if (!isMissingTableError(err)) throw err
  } finally {
    inMemoryIntegrations.delete(id)
  }
}
