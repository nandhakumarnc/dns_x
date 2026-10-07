/**
 * src/services/authService.js
 * Google OAuth 2.0 and Supabase Authentication Service.
 * Provides secure OAuth authentication for DNS_X NOC Workspace.
 * Zero credentials or sensitive data are ever handled, requested, or stored.
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase.js'

/**
 * Returns the dynamically resolved OAuth redirect URL for local development or production (Vercel).
 * Automatically adapts between localhost:5173/auth, Vercel production, or custom preview origins.
 */
export function getAuthRedirectUrl() {
  const isLocalhost =
    typeof window !== 'undefined' &&
    (window.location?.hostname === 'localhost' ||
      window.location?.hostname === '127.0.0.1' ||
      window.location?.origin?.includes('localhost') ||
      window.location?.origin?.includes('127.0.0.1'))

  // 1. Explicit override via VITE_AUTH_REDIRECT_URL (reject localhost in production)
  const envRedirect = import.meta.env?.VITE_AUTH_REDIRECT_URL
  if (envRedirect) {
    if (isLocalhost) return envRedirect
    if (!envRedirect.includes('localhost') && !envRedirect.includes('127.0.0.1')) {
      return envRedirect
    }
  }

  // 2. Base site URL if specified (reject localhost in production)
  const siteUrl = import.meta.env?.VITE_SITE_URL
  if (siteUrl) {
    const cleaned = siteUrl.replace(/\/$/, '')
    if (isLocalhost) return `${cleaned}/auth`
    if (!cleaned.includes('localhost') && !cleaned.includes('127.0.0.1')) {
      return `${cleaned}/auth`
    }
  }

  // 3. Browser runtime origin detection
  if (typeof window !== 'undefined' && window.location?.origin) {
    const origin = window.location.origin
    // Local development: localhost or 127.0.0.1
    if (isLocalhost) {
      return `${origin}/auth`
    }
    // Production (Vercel deployment or custom domain)
    return `${origin}/auth`
  }

  // 4. Guaranteed production fallback (strictly for production / build)
  return 'https://dns-x002.vercel.app/auth'
}

/**
 * Initiates the Google OAuth 2.0 flow via Supabase.
 * Redirects the user to Google's official identity authorization screen.
 *
 * @param {Object} [options]
 * @param {string} [options.loginHint] - Optional email to pre-fill on Google's consent screen
 * @returns {Promise<{ provider: string, url: string }>}
 */
export async function signInWithGoogleOAuth(options = {}) {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase authentication is not configured. Please check environment variables.')
  }

  const redirectTo = getAuthRedirectUrl()

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      queryParams: {
        access_type: 'offline',
        prompt: 'select_account',
        ...(options.loginHint ? { login_hint: options.loginHint } : {}),
      },
    },
  })

  if (error) {
    if (
      error.message?.includes('provider is not enabled') ||
      error.msg?.includes('provider is not enabled') ||
      error.error === 'unsupported_provider' ||
      error.code === 'unsupported_provider'
    ) {
      throw new Error(
        'Google OAuth provider is not yet enabled in Supabase. Please enable Google in Supabase Dashboard (Authentication -> Providers -> Google) and configure your Google Client ID & Secret.'
      )
    }
    throw error
  }

  return data
}

/**
 * Retrieves the currently active Supabase session.
 */
export async function getActiveSession() {
  if (!isSupabaseConfigured) return null
  const { data: { session }, error } = await supabase.auth.getSession()
  if (error) {
    console.error('Failed to retrieve Supabase session:', error)
    return null
  }
  return session
}

/**
 * Signs the user out of the current session across Supabase.
 */
export async function signOutOAuth() {
  if (isSupabaseConfigured) {
    await supabase.auth.signOut().catch(() => {})
  }
}
