/**
 * src/components/noc/NocErrorBoundary.jsx
 * Error Boundary for NOC components. Catches runtime render errors and renders
 * a dedicated operational recovery console rather than a blank screen.
 */

import React from 'react'
import { AlertOctagon, RotateCcw, Search } from 'lucide-react'

class NocErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('[NocErrorBoundary] Uncaught render exception in NOC component:', error, errorInfo)
    this.setState({ errorInfo })
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
    if (this.props.onReset) {
      this.props.onReset()
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="border border-red-500/40 bg-[#0c0608] p-6 text-center sm:p-10">
          <div className="mx-auto flex h-12 w-12 items-center justify-center border border-red-500/40 bg-red-500/10 text-red-400 shadow-[0_0_18px_rgba(239,68,68,0.25)]">
            <AlertOctagon size={24} strokeWidth={1.5} />
          </div>

          <div className="mt-3 flex items-center justify-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse shadow-[0_0_8px_#ef4444]" />
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-red-400">
              CONSOLE RENDER INTEGRITY RECOVERY
            </span>
          </div>

          <h3 className="mt-2 text-[17px] font-semibold text-[#f1e6e6]">
            NOC Render Interruption
          </h3>

          <p className="mx-auto mt-2 max-w-lg font-mono text-[11px] leading-5 text-[#cda3a3]">
            {this.state.error?.message || 'A component encountered an unhandled rendering error.'}
          </p>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={this.handleReset}
              className="flex items-center gap-1.5 border border-red-500/40 bg-red-500/10 px-4 py-2 font-mono text-[10px] font-semibold uppercase tracking-wider text-red-400 transition hover:bg-red-500/20 shadow-[0_0_12px_rgba(239,68,68,0.15)]"
            >
              <RotateCcw size={12} />
              <span>RECOVER CONSOLE</span>
            </button>

            {this.props.onChangeTarget && (
              <button
                type="button"
                onClick={this.props.onChangeTarget}
                className="flex items-center gap-1.5 border border-[#17313b] bg-[#0a1218] px-4 py-2 font-mono text-[10px] font-semibold uppercase tracking-wider text-[#9cb1bd] transition hover:border-cyan-400/40 hover:text-cyan-400"
              >
                <Search size={12} />
                <span>CHANGE TARGET</span>
              </button>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default NocErrorBoundary
