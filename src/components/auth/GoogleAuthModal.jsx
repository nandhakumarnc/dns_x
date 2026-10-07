import { useState } from 'react'
import { X, CheckCircle2, ChevronRight, AlertCircle, ShieldCheck } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

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

function GoogleAuthModal({ isOpen, onClose, onAuthenticated }) {
  const { signInWithGoogle, isAuthenticating, authError } = useAuth()
  const [loginHint, setLoginHint] = useState('')
  const [clientError, setClientError] = useState(null)
  const [isSuccess, setIsSuccess] = useState(false)

  if (!isOpen) return null

  const handleOAuthSubmit = async (e) => {
    e?.preventDefault()
    setClientError(null)

    const trimmedHint = loginHint.trim()
    if (trimmedHint && !trimmedHint.includes('@')) {
      setClientError('Please enter a valid Google email format (e.g. operator@gmail.com).')
      return
    }

    try {
      const res = await signInWithGoogle({ email: trimmedHint })
      setIsSuccess(true)
      setTimeout(() => {
        if (onAuthenticated) onAuthenticated(res)
        onClose()
      }, 500)
    } catch (err) {
      setClientError(err.message || 'Google OAuth authentication failed.')
    }
  }

  const activeError = clientError || authError

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-md transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      <div
        className="relative z-10 w-full max-w-[460px] overflow-hidden rounded-[28px] border border-white/12 bg-gradient-to-b from-white/[0.07] to-white/[0.02] p-7 text-[#e6f1f5] shadow-[0_24px_80px_rgba(0,0,0,0.85),inset_0_1px_1px_rgba(255,255,255,0.18)] backdrop-blur-3xl animate-in zoom-in-95 duration-200"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 rounded-full p-1 text-white/50 hover:bg-white/10 hover:text-white transition-colors"
        >
          <X size={18} />
        </button>

        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/15 bg-white/[0.06] p-2.5 shadow-lg backdrop-blur-xl">
            <GoogleLogo className="h-8 w-8" />
          </div>
          <h2 className="mt-3 text-xl font-bold tracking-tight text-white">Google Identity Verification</h2>
          <p className="mt-1.5 text-[12px] text-[#9cb1bc]">
            Access to <span className="text-white font-medium">NOC WORKSPACE GATED</span> requires verified Google OAuth authorization.
          </p>
        </div>

        {activeError && (
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-[11px] text-red-300 backdrop-blur-md">
            <AlertCircle size={15} className="shrink-0 mt-0.5 text-red-400" />
            <div>{activeError}</div>
          </div>
        )}

        <form onSubmit={handleOAuthSubmit} className="mt-5 space-y-4">
          <div>
            <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-[#8fa6b0] mb-1.5">
              <span>Google Account (Optional Hint)</span>
              <span className="flex items-center gap-1 text-emerald-400 text-[9px]">
                <ShieldCheck size={11} />
                OAUTH 2.0
              </span>
            </div>
            <input
              type="email"
              value={loginHint}
              onChange={(e) => {
                setLoginHint(e.target.value)
                if (clientError) setClientError(null)
              }}
              placeholder="e.g. operator@gmail.com (optional)"
              disabled={isAuthenticating || isSuccess}
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-[13px] text-white placeholder-white/25 focus:border-cyan-400/50 focus:outline-none focus:ring-1 focus:ring-cyan-400/20"
            />
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-2.5 text-[11px] font-mono text-[#8fa6b0]">
            DNS_X connects via official Google OAuth. Zero credentials are ever requested or stored.
          </div>

          <button
            type="submit"
            disabled={isAuthenticating || isSuccess}
            className="flex h-12 w-full items-center justify-center gap-2.5 rounded-xl border border-white/30 bg-white text-gray-950 font-medium text-[14px] shadow-lg transition-all hover:bg-[#f8faff] active:scale-[0.99] disabled:opacity-75 cursor-pointer"
          >
            {isSuccess ? (
              <div className="flex items-center gap-2 text-emerald-700 font-semibold">
                <CheckCircle2 size={16} className="text-emerald-600" />
                <span>Verified · Entering NOC...</span>
              </div>
            ) : isAuthenticating ? (
              <div className="flex items-center gap-2 text-gray-800">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" />
                <span>Connecting to Google...</span>
              </div>
            ) : (
              <>
                <GoogleLogo className="h-4 w-4" />
                <span>Continue with Google</span>
                <ChevronRight size={15} className="text-gray-400" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}

export default GoogleAuthModal
