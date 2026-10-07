import { useRef, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

function LandingPage() {
  const iframeRef = useRef(null)
  const navigate = useNavigate()

  const handleGetStarted = useCallback(() => {
    // Navigate directly to NOC Workspace without login
    navigate('/noc')
  }, [navigate])

  // Listen for message events from iframe
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data?.type === 'DNS_X_AUTH_REQUEST') {
        handleGetStarted()
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [handleGetStarted])

  // Attach direct same-origin click listener as an additional safeguard
  const handleIframeLoad = () => {
    try {
      const iframeDoc = iframeRef.current?.contentDocument || iframeRef.current?.contentWindow?.document
      if (!iframeDoc) return

      iframeDoc.addEventListener(
        'click',
        (e) => {
          const target = e.target.closest('a, button')
          if (!target) return
          const href = (target.getAttribute('href') || '').toLowerCase()
          const text = (target.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase()

          if (
            href.includes('auth') ||
            href.includes('login') ||
            href.includes('get-started') ||
            href.includes('sign-in') ||
            text.includes('get started') ||
            text.includes('sign in') ||
            text.includes('start for free') ||
            text.includes('start free trial') ||
            text.includes('analyze a domain') ||
            text.includes('open noc') ||
            text.includes('launch dns_x noc')
          ) {
            e.preventDefault()
            e.stopPropagation()
            handleGetStarted()
          }
        },
        true
      )
    } catch (err) {
      console.warn('Iframe load intercept warning:', err)
    }
  }

  return (
    <div className="fixed inset-0 h-screen w-screen overflow-hidden bg-[#0a0a0a]">
      {/* 1. Full-screen isolated Landing Page identical to the security template */}
      <iframe
        ref={iframeRef}
        src="/landing.html"
        title="Sentinel Security Template Landing Page"
        onLoad={handleIframeLoad}
        className="h-full w-full border-0"
        allow="autoplay; fullscreen"
      />
    </div>
  )
}

export default LandingPage
