/**
 * services/settingsService.js
 * Application settings CRUD (backed by system_settings table).
 */

import * as settingsRepo from '../repositories/settingsRepository.js'

export async function getAllSettings() {
  return settingsRepo.getAllSettings()
}

export async function updateSettings(patch) {
  await settingsRepo.upsertSettings(patch)
  return settingsRepo.getAllSettings()
}
