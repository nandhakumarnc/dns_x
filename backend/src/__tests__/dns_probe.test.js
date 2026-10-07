/**
 * dns_probe.test.js
 * Verification test suite for Real DNS Measurement Pipeline
 */

import request from 'supertest'
import { createApp } from '../app.js'
import { clearActiveTargetDomain } from '../services/dnsMeasurementService.js'
import { API_KEY } from '../config/env.js'

describe('DNS_X Real DNS Probe Pipeline Tests', () => {
  let app

  beforeAll(() => {
    app = createApp()
  })

  afterAll(() => {
    clearActiveTargetDomain()
  })

  it('rejects invalid domain format with 422 VALIDATION_FAILED', async () => {
    const res = await request(app)
      .post('/api/v1/dns/probe')
      .set('X-Api-Key', API_KEY)
      .send({ target: 'invalid domain with spaces @@#' })

    expect(res.status).toBe(422)
    expect(res.body.ok).toBe(false)
    expect(res.body.error.reason).toBe('SYNTAX_INVALID')
    expect(res.body.error.message).toContain('TARGET NOT AVAILABLE')
    expect(res.body.error.details).toContain('Invalid target format')
  })

  it('performs real DNS probe on a valid reachable domain', async () => {
    const res = await request(app)
      .post('/api/v1/dns/probe')
      .set('X-Api-Key', API_KEY)
      .send({ target: 'https://cloudflare.com' })

    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
    expect(res.body.data.target).toHaveProperty('domain', 'cloudflare.com')
    expect(res.body.data.target).toHaveProperty('records')
    expect(res.body.data.target).toHaveProperty('vantagePoints')
    expect(res.body.data.target).toHaveProperty('authoritative')
    expect(res.body.data.errors).toHaveProperty('dominant')
    expect(res.body.data.performance).toHaveProperty('latency')
    expect(res.body.data.traffic).toHaveProperty('isPublicDomain', true)
    expect(res.body.data.traffic.qps).toBeNull()
  }, 30000)

  it('rejects non-existent NXDOMAIN domain with 422 VALIDATION_FAILED', async () => {
    const res = await request(app)
      .post('/api/v1/dns/probe')
      .set('X-Api-Key', API_KEY)
      .send({ target: 'non-existent-test-domain-dnsx-9999.xyz' })

    expect(res.status).toBe(422)
    expect(res.body.ok).toBe(false)
    expect(res.body.error.reason).toBe('NXDOMAIN')
    expect(res.body.error.message).toContain('TARGET NOT AVAILABLE')
    expect(res.body.error.details).toContain('DNS resolution failed (NXDOMAIN)')
  }, 30000)

  it('rejects unreachable domain with 422 VALIDATION_FAILED', async () => {
    const res = await request(app)
      .post('/api/v1/dns/probe')
      .set('X-Api-Key', API_KEY)
      .send({ target: 'ns1.google.com' })

    expect(res.status).toBe(422)
    expect(res.body.ok).toBe(false)
    expect(res.body.error.message).toContain('TARGET FOUND')
    expect(['TIMEOUT', 'CONNECTION_FAILURE']).toContain(res.body.error.reason)
  }, 30000)

  it('manages active target lifecycle via /dns/target', async () => {
    const setRes = await request(app)
      .post('/api/v1/dns/target')
      .set('X-Api-Key', API_KEY)
      .send({ target: 'google.com' })

    expect(setRes.status).toBe(200)
    expect(setRes.body.ok).toBe(true)
    expect(setRes.body.data.activeTarget).toBe('google.com')

    const clearRes = await request(app)
      .delete('/api/v1/dns/target')
      .set('X-Api-Key', API_KEY)

    expect(clearRes.status).toBe(200)
    expect(clearRes.body.ok).toBe(true)
    expect(clearRes.body.data.activeTarget).toBeNull()
  }, 30000)
})
