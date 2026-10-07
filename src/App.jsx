import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import Sidebar from './components/layout/Sidebar'
import Navbar from './components/layout/Navbar'
import AppRoutes from './routes/AppRoutes'
import LandingPage from './components/landing/LandingPage'
import DotField from './components/ui/DotField'

function DashboardLayout() {
  return (
    <div className="relative min-h-screen bg-[#05080c] text-[#e6f1f5] overflow-x-hidden">
      {/* Ambient background depth orbs & iridescent mesh for genuine glassmorphism */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        {/* Soft base background */}
        <div className="absolute inset-0 bg-[#090d16]" />

        {/* Top-left violet / indigo aurora */}
        <div className="absolute -top-[10%] left-[5%] h-[550px] w-[550px] rounded-full bg-violet-600/06 blur-[140px]" />
        
        {/* Top-right cyan / sapphire glow */}
        <div className="absolute -top-[5%] right-[10%] h-[500px] w-[500px] rounded-full bg-sky-500/06 blur-[150px]" />

        {/* Center-left purple haze */}
        <div className="absolute top-[35%] left-[25%] h-[600px] w-[600px] rounded-full bg-indigo-500/04 blur-[160px]" />

        {/* Bottom-right cyan/teal ambient orb */}
        <div className="absolute bottom-[5%] right-[15%] h-[600px] w-[600px] rounded-full bg-cyan-500/05 blur-[170px]" />

        {/* Bottom-left violet glow */}
        <div className="absolute -bottom-[10%] left-[10%] h-[500px] w-[500px] rounded-full bg-purple-600/05 blur-[150px]" />

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
      <Sidebar />
      <div className="relative z-10 ml-[218px]">
        <Navbar />
        <main className="pt-[56px]">
          <AppRoutes />
        </main>
      </div>
    </div>
  )
}

function MainApp() {
  return (
    <Routes>
      {/* 1. Landing Page appears at / and /landing */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/landing" element={<LandingPage />} />

      {/* 2. Direct NOC Workspace & Settings Routes (No login required) */}
      <Route path="/noc/*" element={<DashboardLayout />} />
      <Route path="/settings" element={<DashboardLayout />} />

      {/* 3. Auth & Login redirects directly to NOC workspace */}
      <Route path="/auth" element={<Navigate to="/noc" replace />} />
      <Route path="/login" element={<Navigate to="/noc" replace />} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App