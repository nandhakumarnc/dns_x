/**
 * services/targetValidationService.js
 *
 * Strict Backend-side Real Website Validation Engine for DNS_X.
 * Validates domain syntax, real DNS resolution (A/AAAA), authoritative DNS (NS),
 * HTTP/HTTPS reachability, and filters out parked/for-sale lander domains before unlocking NOC analysis.
 */

import { promises as dnsPromises } from 'node:dns'
import logger from '../config/logger.js'

const DOMAIN_FORMAT_REGEX = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/

/**
 * Safely normalize input URL/domain to a clean hostname.
 * Handles https://..., http://..., ports, query parameters, hashes, and trailing slashes.
 *
 * @param {string} raw
 * @returns {string}
 */
export function normalizeTargetInput(raw) {
  if (!raw || typeof raw !== 'string') return ''
  let cleaned = raw.trim().toLowerCase()
  cleaned = cleaned.replace(/^https?:\/\//i, '').replace(/^\/\//, '')
  if (cleaned.includes('@')) {
    cleaned = cleaned.split('@').pop()
  }
  cleaned = cleaned.split('/')[0]
  cleaned = cleaned.split('?')[0]
  cleaned = cleaned.split('#')[0]
  cleaned = cleaned.split(':')[0]
  return cleaned.replace(/\.+$/, '')
}

/**
 * Perform real DNS lookup for A, AAAA, and NS (authoritative) records.
 */
async function checkDnsResolution(domain) {
  let addresses = []
  let nsRecords = []
  let primaryErrorCode = null

  // 1. Resolve A records
  try {
    const a = await dnsPromises.resolve4(domain)
    if (a && a.length > 0) addresses.push(...a)
  } catch (err4) {
    primaryErrorCode = err4.code
  }

  // 2. Resolve AAAA records
  try {
    const aaaa = await dnsPromises.resolve6(domain)
    if (aaaa && aaaa.length > 0) addresses.push(...aaaa)
  } catch (err6) {
    if (!primaryErrorCode) primaryErrorCode = err6.code
  }

  // 3. Authoritative DNS Verification (Resolve NS records)
  try {
    const ns = await dnsPromises.resolveNs(domain)
    if (ns && ns.length > 0) nsRecords.push(...ns)
  } catch (errNs) {
    if (!primaryErrorCode) primaryErrorCode = errNs.code
  }

  // If A/AAAA or NS records exist, DNS resolution succeeded
  if (addresses.length > 0 || nsRecords.length > 0) {
    return {
      ok: true,
      addresses,
      nsRecords,
    }
  }

  // Determine error classification
  const code = primaryErrorCode || 'ENOTFOUND'
  let reason = 'NXDOMAIN'
  let status = 'DOMAIN_NOT_FOUND'

  if (code === 'ENOTFOUND' || code === 'NXDOMAIN' || code === 'ENODATA') {
    reason = 'NXDOMAIN'
    status = 'DOMAIN_NOT_FOUND'
  } else if (code === 'ETIMEOUT' || code === 'TIMEOUT') {
    reason = 'DNS_TIMEOUT'
    status = 'DNS_TIMEOUT'
  } else {
    reason = 'DNS_FAILURE'
    status = 'DNS_FAILURE'
  }

  return { ok: false, status, reason, code }
}

/**
 * Perform HTTP or HTTPS reachability probe following safe redirects.
 * Detects and rejects parked/for-sale domain lander pages (e.g. GoDaddy /lander, Sedo, Bodis, Dan).
 */
async function checkProtocolReachability(protocol, domain, timeoutMs = 9000) {
  const url = `${protocol}://${domain}`
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      redirect: 'follow',
      signal: controller.signal,
    })
    clearTimeout(timeoutId)

    const responseUrl = response.url || url
    let bodyText = ''
    try {
      bodyText = await response.text()
    } catch {
      // ignore body read failure
    }

    const lowerBody = bodyText.toLowerCase()
    const lowerUrl = responseUrl.toLowerCase()

    // 1. Detect Parked Domain Lander URL or Script Redirects
    const isParkedUrl = lowerUrl.includes('/lander') || lowerUrl.includes('parking') || lowerUrl.includes('parked')
    
    // 2. Detect Parked Domain Body Signatures (GoDaddy, Sedo, Bodis, Dan, DomainControl, HugeDomains, etc.)
    const isParkedBody =
      lowerBody.includes('/lander') ||
      lowerBody.includes('parking-lander') ||
      lowerBody.includes('ap:"parking"') ||
      lowerBody.includes('is parked free') ||
      lowerBody.includes('courtesy of godaddy') ||
      lowerBody.includes('get this domain') ||
      lowerBody.includes('buy this domain') ||
      lowerBody.includes('this domain is for sale') ||
      lowerBody.includes('domain is parked') ||
      lowerBody.includes('parked domain') ||
      lowerBody.includes('sedoparking') ||
      lowerBody.includes('bodis.com') ||
      lowerBody.includes('hugedomains') ||
      lowerBody.includes('dan.com') ||
      lowerBody.includes('parklogic') ||
      lowerBody.includes('afternic')

    if (isParkedUrl || isParkedBody) {
      return {
        reachable: false,
        errorType: 'PARKED_DOMAIN',
        status: 'DOMAIN_NOT_FOUND',
        details: `Target "${domain}" is a parked domain lander page (${responseUrl}). DNS_X only analyzes active, operational websites.`,
      }
    }

    // If initial page contains JS redirect to /lander (e.g., window.location.href="/lander"), fetch /lander to check
    if (lowerBody.includes('location.href') && lowerBody.includes('lander')) {
      return {
        reachable: false,
        errorType: 'PARKED_DOMAIN',
        status: 'DOMAIN_NOT_FOUND',
        details: `Target "${domain}" redirects to a parked domain lander page. DNS_X only analyzes active, operational websites.`,
      }
    }

    // Any HTTP status response (200, 301, 302, 400, 401, 403, 404, 500, 502, 503, etc.) means a real web server responded!
    return {
      reachable: true,
      status: response.status,
      statusText: response.statusText,
      protocol,
      url: responseUrl,
    }
  } catch (err) {
    const errMsg = err.message || ''
    const errCode = err.code || err.cause?.code || ''
    const name = err.name || ''

    if (name === 'AbortError' || errCode === 'ETIMEOUT' || errMsg.includes('timeout')) {
      return { reachable: false, errorType: 'TIMEOUT', status: 'WEBSITE_UNREACHABLE', details: 'HTTP connection timed out' }
    }
    if (errCode === 'ECONNREFUSED' || errCode === 'ECONNRESET' || errCode === 'EHOSTUNREACH') {
      return { reachable: false, errorType: 'CONNECTION_FAILURE', status: 'NETWORK_UNREACHABLE', details: `Connection refused (${errCode})` }
    }
    if (errCode === 'ENOTFOUND') {
      return { reachable: false, errorType: 'NXDOMAIN', status: 'DOMAIN_NOT_FOUND', details: 'Hostname could not be resolved by DNS' }
    }
    if (errCode.startsWith('ERR_TLS_') || errCode.startsWith('DEPTH_ZERO') || errMsg.includes('certificate')) {
      // TLS certificate issue means the remote web server answered the TLS handshake!
      return { reachable: true, status: 495, statusText: 'TLS Certificate Issue', protocol, url }
    }

    return { reachable: false, errorType: 'CONNECTION_FAILURE', status: 'WEBSITE_UNREACHABLE', details: errMsg || errCode || 'Connection failed' }
  }
}

/**
 * Validate target domain backend-side.
 * Full Pipeline: Syntax -> DNS Resolution -> Authoritative DNS -> HTTP/HTTPS Reachability (Parked Domain Filtering).
 *
 * @param {string} rawTarget
 * @returns {Promise<object>}
 */
export async function validateTargetBackend(rawTarget) {
  const cleanDomain = normalizeTargetInput(rawTarget)
  const nonExistentDomainMsg = '"TARGET NOT AVAILABLE" — The domain could not be verified on the Internet.'
  const unreachableServiceMsg = '"TARGET FOUND" — DNS is valid, but the web service is currently unreachable.'

  // 1. Syntax Validation
  if (!cleanDomain || !DOMAIN_FORMAT_REGEX.test(cleanDomain) || cleanDomain.length > 253) {
    const details = `Invalid target format "${rawTarget || ''}". Please enter a valid fully qualified domain name or URL (e.g. https://example.com or google.com).`
    return {
      valid: false,
      target: rawTarget || '',
      domain: cleanDomain || rawTarget || '',
      status: 'DOMAIN_NOT_FOUND',
      reason: 'SYNTAX_INVALID',
      message: nonExistentDomainMsg,
      error: nonExistentDomainMsg,
      details,
    }
  }

  // 2 & 3. Real DNS Resolution & Authoritative DNS Verification
  const dnsResult = await checkDnsResolution(cleanDomain)
  if (!dnsResult.ok) {
    const status = dnsResult.status || 'DOMAIN_NOT_FOUND'
    const reason = dnsResult.reason || 'NXDOMAIN'
    const details = reason === 'NXDOMAIN'
      ? `DNS resolution failed (NXDOMAIN): Target domain "${cleanDomain}" does not exist on the Internet.`
      : status === 'DNS_TIMEOUT'
      ? `DNS resolution timed out for domain "${cleanDomain}".`
      : `DNS resolution failed (${dnsResult.code}): Domain "${cleanDomain}" has no address or authoritative records.`

    logger.warn({ domain: cleanDomain, dnsCode: dnsResult.code, status, reason }, 'Target validation failed: DNS resolution failure')
    return {
      valid: false,
      target: rawTarget,
      domain: cleanDomain,
      status,
      reason,
      message: nonExistentDomainMsg,
      error: nonExistentDomainMsg,
      details,
    }
  }

  // 4. HTTP / HTTPS Reachability & Parked Domain Check
  let httpResult = await checkProtocolReachability('https', cleanDomain, 9000)
  if (!httpResult.reachable) {
    // If it was rejected as a PARKED_DOMAIN on HTTPS, do not fall back to HTTP
    if (httpResult.errorType === 'PARKED_DOMAIN') {
      const details = httpResult.details || `Target "${cleanDomain}" is a parked domain lander page. DNS_X only analyzes active websites.`
      logger.warn({ domain: cleanDomain, reason: 'PARKED_DOMAIN' }, 'Target validation failed: Parked domain lander page')
      return {
        valid: false,
        target: rawTarget,
        domain: cleanDomain,
        status: 'DOMAIN_NOT_FOUND',
        reason: 'PARKED_DOMAIN',
        message: nonExistentDomainMsg,
        error: nonExistentDomainMsg,
        details,
      }
    }

    const httpFallback = await checkProtocolReachability('http', cleanDomain, 9000)
    if (httpFallback.reachable) {
      httpResult = httpFallback
    } else if (httpFallback.errorType === 'PARKED_DOMAIN') {
      httpResult = httpFallback
    }
  }

  if (!httpResult.reachable) {
    if (httpResult.errorType === 'PARKED_DOMAIN') {
      const details = httpResult.details || `Target "${cleanDomain}" is a parked domain lander page. DNS_X only analyzes active websites.`
      logger.warn({ domain: cleanDomain, reason: 'PARKED_DOMAIN' }, 'Target validation failed: Parked domain lander page')
      return {
        valid: false,
        target: rawTarget,
        domain: cleanDomain,
        status: 'DOMAIN_NOT_FOUND',
        reason: 'PARKED_DOMAIN',
        message: nonExistentDomainMsg,
        error: nonExistentDomainMsg,
        details,
      }
    }

    const status = httpResult.status || (httpResult.errorType === 'TIMEOUT' ? 'WEBSITE_UNREACHABLE' : 'NETWORK_UNREACHABLE')
    const reason = httpResult.errorType || 'CONNECTION_FAILURE'
    const details = status === 'WEBSITE_UNREACHABLE'
      ? `HTTP/HTTPS request timed out: Web server at "${cleanDomain}" failed to respond within 9 seconds.`
      : `Connection failed: Web server at "${cleanDomain}" is unreachable over HTTP/HTTPS (${httpResult.details}).`

    logger.warn({ domain: cleanDomain, status, reason, details: httpResult.details }, 'Target validation failed: Website unreachable')
    return {
      valid: false,
      target: rawTarget,
      domain: cleanDomain,
      status,
      reason,
      message: unreachableServiceMsg,
      error: unreachableServiceMsg,
      details,
    }
  }

  // Target successfully validated as a real, reachable website
  logger.info(
    { domain: cleanDomain, ips: dnsResult.addresses, ns: dnsResult.nsRecords, status: httpResult.status, protocol: httpResult.protocol },
    'Target backend validation passed'
  )

  return {
    valid: true,
    target: rawTarget,
    cleanDomain,
    domain: cleanDomain,
    status: 'WEBSITE_RESPONDING',
    reason: 'TARGET_VALIDATED',
    ips: dnsResult.addresses,
    nsRecords: dnsResult.nsRecords,
    httpStatus: httpResult.status,
    protocol: httpResult.protocol,
    message: `Website verified reachable via ${httpResult.protocol.toUpperCase()} (Status ${httpResult.status}).`,
    details: `Target "${cleanDomain}" resolved to ${dnsResult.addresses.length > 0 ? dnsResult.addresses.join(', ') : 'authoritative NS'} and responded to HTTP/HTTPS request with status ${httpResult.status}.`,
  }
}

export default {
  normalizeTargetInput,
  validateTargetBackend,
}
