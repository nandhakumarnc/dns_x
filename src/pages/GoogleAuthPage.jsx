import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ShieldCheck, Lock, CheckCircle2, ChevronRight, ArrowLeft, AlertCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import DotField from '../components/ui/DotField'

function GoogleLogo({ className = 'h-5 w-5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
        fill="#EA4335"
      />
    </svg>
  )
}

function GoogleAuthPage() {
  const { user, signInWithGoogle, isAuthenticating, authError, isLoading } = useAuth()
  const [loginHint, setLoginHint] = useState('')
  const [clientError, setClientError] = useState(null)
  const isSuccess = Boolean(user)
  const navigate = useNavigate()

  // Automatically navigate to gated NOC workspace when user is authenticated
  useEffect(() => {
    if (user) {
      const timer = setTimeout(() => {
        navigate('/noc', { replace: true })
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [user, navigate])

  const handleOAuthSignIn = async (e) => {
    e?.preventDefault()
    setClientError(null)

    const trimmedHint = loginHint.trim()

    // Validate email syntax if user voluntarily provided a login hint
    if (trimmedHint && !trimmedHint.includes('@')) {
      setClientError('Please enter a valid Google email format (e.g. username@gmail.com).')
      return
    }

    try {
      await signInWithGoogle({ email: trimmedHint })
    } catch (err) {
      setClientError(err.message || 'Google OAuth authentication failed. Please try again.')
    }
  }

  const activeError = clientError || authError

  return (
    <div className="relative min-h-screen w-screen overflow-x-hidden bg-[#05080c] flex items-center justify-center p-4 sm:p-6">
      {/* 1. Ambient background depth orbs & iridescent mesh for genuine glassmorphism */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0 bg-[#080d16]" />
        <div className="absolute -top-[10%] left-[10%] h-[550px] w-[550px] rounded-full bg-violet-600/06 blur-[150px]" />
        <div className="absolute -top-[5%] right-[10%] h-[500px] w-[500px] rounded-full bg-sky-500/06 blur-[150px]" />
        <div className="absolute top-[35%] left-[25%] h-[600px] w-[600px] rounded-full bg-indigo-500/04 blur-[160px]" />
        <div className="absolute bottom-[5%] right-[15%] h-[600px] w-[600px] rounded-full bg-cyan-500/05 blur-[170px]" />

        {/* React Bits DotField Interactive Background */}
        <div className="absolute inset-0">
          <DotField
            dotRadius={1.5}
            dotSpacing={14}
            bulgeStrength={67}
            glowRadius={160}
            sparkle={false}
            waveAmplitude={0}
            gradientFrom="rgba(168, 85, 247, 0.25)"
            gradientTo="rgba(180, 151, 207, 0.18)"
            glowColor="#09101d"
          />
        </div>
      </div>

      {/* 2. Glassmorphism Card */}
      <div
        className="relative z-10 w-full max-w-[500px] overflow-hidden rounded-[32px] border border-white/12 bg-gradient-to-b from-white/[0.07] to-white/[0.02] p-7 sm:p-10 text-[#e6f1f5] shadow-[0_24px_80px_rgba(0,0,0,0.85),inset_0_1px_1px_rgba(255,255,255,0.18),inset_0_-1px_1px_rgba(255,255,255,0.04)] backdrop-blur-3xl animate-in fade-in zoom-in-95 duration-300"
        style={{
          boxShadow: '0 25px 80px -10px rgba(0, 0, 0, 0.85), inset 0 1px 1px 0 rgba(255, 255, 255, 0.18), inset 0 -1px 1px 0 rgba(255, 255, 255, 0.04)',
        }}
      >
        {/* Top Back Link */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-[11px] font-mono text-[#8fa6b0] hover:text-white transition-colors"
          >
            <ArrowLeft size={13} />
            <span>BACK TO LANDING PAGE</span>
          </Link>

          <span className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-0.5 text-[10px] font-mono text-[#9bb8c7]">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400/70 shadow-[0_0_4px_rgba(34,211,238,0.3)]" />
            NOC GATEWAY
          </span>
        </div>

        {/* Header: DNS_X & Google Co-Branding */}
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-white/15 bg-white/[0.06] p-3 shadow-[0_8px_20px_rgba(0,0,0,0.3),inset_0_1px_1px_rgba(255,255,255,0.2)] backdrop-blur-xl">
            <GoogleLogo className="h-9 w-9 drop-shadow" />
          </div>

          <div className="mt-4 flex items-center justify-center gap-2">
            <img src="/logo.png" alt="DNS_X" className="h-5 w-5 object-contain drop-shadow-[0_0_5px_rgba(34,211,238,0.25)]" />
            <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#9bb8c7] font-semibold">
              DNS_X PLATFORM
            </span>
          </div>

          <h1 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-white font-sans">
            Google Identity Verification
          </h1>

          <p className="mt-2 text-[13px] leading-relaxed text-[#9cb1bc]">
            Access to <span className="text-white font-medium">NOC WORKSPACE GATED</span> requires verified Google identity authorization.
          </p>
        </div>

        {/* Auth Error Banner */}
        {activeError && (
          <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-[12px] text-red-300 backdrop-blur-md animate-in fade-in slide-in-from-top-1">
            <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-400" />
            <div className="leading-snug">{activeError}</div>
          </div>
        )}

        {/* Official Google OAuth Form */}
        <form onSubmit={handleOAuthSignIn} className="mt-6 space-y-4">
          {/* Optional Login Hint Field */}
          <div>
            <div className="flex items-center justify-between px-1 text-[10px] font-mono uppercase tracking-[0.16em] text-[#7d95a2] mb-1.5">
              <span>GOOGLE ACCOUNT (OPTIONAL)</span>
              <span className="flex items-center gap-1 text-emerald-400">
                <ShieldCheck size={11} />
                SECURE OAUTH 2.0
              </span>
            </div>

            <div className="relative">
              <input
                type="email"
                value={loginHint}
                onChange={(e) => {
                  setLoginHint(e.target.value)
                  if (clientError) setClientError(null)
                }}
                placeholder="operator@gmail.com (or leave blank to choose on Google)"
                disabled={isAuthenticating || isLoading || isSuccess}
                className={`w-full rounded-2xl border bg-black/40 px-4 py-3 text-[14px] text-white placeholder-white/25 transition-all focus:outline-none focus:ring-1 ${
                  activeError && clientError?.includes('email')
                    ? 'border-red-500/50 focus:border-red-400 focus:ring-red-400/30'
                    : 'border-white/10 focus:border-cyan-400/50 focus:ring-cyan-400/20'
                }`}
              />
            </div>
            <p className="mt-1.5 px-1 text-[11px] text-[#718a96]">
              Optional login hint. You can also select or switch accounts directly on the Google consent page.
            </p>
          </div>

          {/* Security Protocol Note */}
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 text-[11px] font-mono text-[#8fa6b0] leading-relaxed">
            <span className="text-white/90 font-semibold">Security Notice:</span> Authentication is handled directly via official Google OAuth. DNS_X never accesses, requests, or stores user credentials.
          </div>

          {/* Primary Action Button: Continue with Google */}
          <div className="pt-2 space-y-3.5">
            <button
              type="submit"
              disabled={isAuthenticating || isLoading || isSuccess}
              className="group relative flex h-13 w-full items-center justify-center gap-3 rounded-2xl border border-white/20 bg-white text-gray-950 font-medium text-[14.5px] shadow-[0_4px_20px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.6)] transition-all duration-200 hover:bg-[#f8faff] active:scale-[0.99] disabled:opacity-75 cursor-pointer"
            >
              {isSuccess ? (
                <div className="flex items-center gap-2.5 text-emerald-700 font-semibold">
                  <CheckCircle2 size={18} className="text-emerald-600 animate-in zoom-in" />
                  <span>Verified {user?.email || 'Google Account'} · Entering NOC...</span>
                </div>
              ) : isAuthenticating || isLoading ? (
                <div className="flex items-center gap-2.5 text-gray-800">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" />
                  <span>{isLoading ? 'Verifying Google Identity...' : 'Connecting to Google OAuth...'}</span>
                </div>
              ) : (
                <>
                  <GoogleLogo className="h-5 w-5" />
                  <span>Continue with Google</span>
                  <ChevronRight size={17} className="text-gray-400 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>

            {/* Direct Gated Target Note */}
            <div className="flex items-center justify-center gap-2 text-[11px] text-[#7d95a2] font-mono">
              <Lock size={12} className="text-amber-400/80" />
              <span>Target on authorization:</span>
              <span className="text-[#9bb8c7] font-semibold uppercase">NOC WORKSPACE GATED</span>
            </div>
          </div>
        </form>

        {/* Security certification badge footer */}
        <div className="mt-8 border-t border-white/[0.08] pt-4 text-center">
          <div className="flex items-center justify-center gap-4 text-[10px] font-mono text-[#6d8491]">
            <span className="flex items-center gap-1">
              <span className="h-1 w-1 rounded-full bg-emerald-400" />
              TLS 1.3 SECURE
            </span>
            <span>·</span>
            <span>GOOGLE OAUTH 2.0</span>
            <span>·</span>
            <span>ZERO CREDENTIAL STORAGE</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default GoogleAuthPage
