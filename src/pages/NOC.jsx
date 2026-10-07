import useDNSState from '../hooks/useDNSState'
import TargetBar from '../components/noc/TargetBar'
import TargetGatedPlaceholder from '../components/noc/TargetGatedPlaceholder'
import TargetAnalyzingView from '../components/noc/TargetAnalyzingView'
import TargetFailedView from '../components/noc/TargetFailedView'
import NocHeader from '../components/noc/NocHeader'
import NetworkHealthSection from '../components/noc/NetworkHealthSection'
import TrafficChartSection from '../components/noc/TrafficChartSection'
import AIAssessmentSection from '../components/noc/AIAssessmentSection'
import InfrastructureStatusSection from '../components/noc/InfrastructureStatusSection'
import ActiveIncidentsSection from '../components/noc/ActiveIncidentsSection'
import RecentEventsSection from '../components/noc/RecentEventsSection'
import NocErrorBoundary from '../components/noc/NocErrorBoundary'

function NOC() {
  const { target, retryTarget, changeTarget } = useDNSState()
  const targetState = target?.state || 'NO_TARGET'

  return (
    <div className="mx-auto max-w-[1720px] space-y-4 p-4 sm:p-6">
      {/* Persistent Target Bar */}
      <TargetBar />

      <NocErrorBoundary onReset={retryTarget} onChangeTarget={changeTarget}>
        {/* Target Lifecycle View Switcher */}
      {targetState === 'NO_TARGET' && (
        <TargetGatedPlaceholder />
      )}

      {targetState === 'ANALYZING' && (
        <TargetAnalyzingView />
      )}

      {targetState === 'FAILED' && (
        <TargetFailedView />
      )}

      {/* Unlocked Operational Workspace (Strictly Active Target Only) */}
      {targetState === 'ACTIVE' && (
        <div className="space-y-4 animate-in fade-in duration-300">
          {/* 1. Header & Target Context */}
          <NocHeader />

          {/* 2. Network Health Top Metrics */}
          <NetworkHealthSection />

          {/* 3 & 4. Primary Operations Grid: DNS Traffic & AI Assessment */}
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            {/* 3. DNS Traffic Section with [ QPS ] [ LATENCY ] [ ERRORS ] Selector */}
            <TrafficChartSection />

            {/* 4. AI Assessment Section: Contextual Risk, Confidence & Root Cause Candidates */}
            <AIAssessmentSection />
          </div>

          {/* 5. Infrastructure Status: Compact Resolver Status List (Connected vs Public Observers) */}
          <InfrastructureStatusSection />

          {/* 6. Active Signals & Incidents: Combined Triage + Slide-Over Drawer */}
          <ActiveIncidentsSection />

          {/* 7. Recent Events: Compact Chronological Event Stream */}
          <RecentEventsSection />
        </div>
      )}
      </NocErrorBoundary>
    </div>
  )
}

export default NOC
