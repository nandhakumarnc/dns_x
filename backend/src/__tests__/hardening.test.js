/**
 * hardening.test.js
 * Comprehensive production hardening tests for DNS_X backend:
 *   - Security headers (Helmet)
 *   - Health endpoint
 *   - Input validation (Express-validator)
 *   - Structured error responses ({ ok: false, error: { code, message } })
 *   - Simulation data generator & pipeline schema verification
 */

import request from 'supertest'
import { createApp } from '../app.js'
import { API_KEY } from '../config/env.js'
import { getCurrentSnapshot, getInfrastructureState } from '../services/infrastructureService.js'

describe('DNS_X Production Hardening Tests', () => {
  let app

  beforeAll(() => {
    process.env.DNS_X_SIMULATION = 'true'
    app = createApp()
  })

  describe('Security & Health Endpoints', () => {
    it('sets standard security headers via Helmet', async () => {
      const res = await request(app).get('/api/v1/health')
      expect(res.headers).toHaveProperty('x-dns-prefetch-control')
      expect(res.headers).toHaveProperty('x-content-type-options', 'nosniff')
    })

    it('returns structured health response', async () => {
      const res = await request(app).get('/api/v1/health')
      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('ok', true)
      expect(res.body.data).toHaveProperty('status', 'ok')
    })
  })

  describe('Authentication Guard', () => {
    const originalApiKey = process.env.API_KEY

    beforeAll(() => {
      process.env.API_KEY = 'test_secret_key_123'
    })

    afterAll(() => {
      if (originalApiKey !== undefined) {
        process.env.API_KEY = originalApiKey
      } else {
        delete process.env.API_KEY
      }
    })

    it('rejects requests without API key with 401 UNAUTHORIZED', async () => {
      const res = await request(app).get('/api/v1/overview')
      expect(res.status).toBe(401)
      expect(res.body.ok).toBe(false)
      expect(res.body.error.code).toBe('UNAUTHORIZED')
    })

    it('rejects requests with invalid API key with 401 UNAUTHORIZED', async () => {
      const res = await request(app)
        .get('/api/v1/overview')
        .set('X-Api-Key', 'invalid_key_12345')
      expect(res.status).toBe(401)
      expect(res.body.ok).toBe(false)
      expect(res.body.error.code).toBe('UNAUTHORIZED')
    })

    it('allows requests with valid API key', async () => {
      const res = await request(app)
        .get('/api/v1/overview')
        .set('X-Api-Key', 'test_secret_key_123')
      expect(res.status).toBe(200)
      expect(res.body.ok).toBe(true)
    })
  })

  describe('Structured Error Handling & 404 Handler', () => {
    it('returns uniform JSON error envelope for 404 routes', async () => {
      const res = await request(app)
        .get('/api/v1/non-existent-endpoint')
        .set('X-Api-Key', API_KEY)
      expect(res.status).toBe(404)
      expect(res.body).toEqual({
        ok: false,
        error: expect.objectContaining({
          code: 'NOT_FOUND',
          message: expect.stringContaining('/api/v1/non-existent-endpoint'),
        }),
      })
    })
  })

  describe('Input Validation Middleware', () => {
    it('rejects invalid status filter on /incidents', async () => {
      const res = await request(app)
        .get('/api/v1/incidents?status=malicious_injection')
        .set('X-Api-Key', API_KEY)
      expect(res.status).toBe(400)
      expect(res.body.ok).toBe(false)
      expect(res.body.error.code).toBe('BAD_REQUEST')
    })

    it('rejects invalid UUID parameter on /incidents/:id', async () => {
      const res = await request(app)
        .get('/api/v1/incidents/invalid-uuid-1234')
        .set('X-Api-Key', API_KEY)
      expect(res.status).toBe(400)
      expect(res.body.ok).toBe(false)
      expect(res.body.error.code).toBe('BAD_REQUEST')
    })

    it('rejects invalid integration type on POST /alerts/integrations', async () => {
      const res = await request(app)
        .post('/api/v1/alerts/integrations')
        .set('X-Api-Key', API_KEY)
        .send({ type: 'invalid_type', config: {} })
      expect(res.status).toBe(400)
      expect(res.body.ok).toBe(false)
      expect(res.body.error.code).toBe('BAD_REQUEST')
    })
  })

  describe('Simulation Mode & Infrastructure State', () => {
    it('provides valid snapshot contract', async () => {
      const snapshot = await getCurrentSnapshot()
      expect(snapshot).toHaveProperty('system')
      expect(snapshot).toHaveProperty('traffic')
      expect(snapshot).toHaveProperty('performance')
      expect(snapshot).toHaveProperty('errors')
      expect(snapshot).toHaveProperty('infrastructure')
      expect(snapshot).toHaveProperty('ai')
      expect(Array.isArray(snapshot.infrastructure.resolvers)).toBe(true)
    })

    it('provides infrastructure state with resolver metrics', async () => {
      const infra = await getInfrastructureState()
      expect(infra).toHaveProperty('resolvers')
      expect(infra.resolvers.length).toBeGreaterThan(0)
      expect(infra.resolvers[0]).toHaveProperty('id')
      expect(infra.resolvers[0]).toHaveProperty('status')
    })
  })
})
