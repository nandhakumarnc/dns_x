import { Routes, Route } from 'react-router-dom'

import NOC from '../pages/NOC'
import Settings from '../pages/Settings'
import NotFound from '../pages/NotFound'

function AppRoutes() {
  return (
    <Routes>
      {/* Unified Network Operations Center */}
      <Route path="/" element={<NOC />} />
      <Route path="/noc/*" element={<NOC />} />

      {/* System Settings */}
      <Route path="/settings" element={<Settings />} />

      {/* 404 Not Found fallback */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default AppRoutes