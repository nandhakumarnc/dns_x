import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { DNSStateProvider } from './contexts/DNSStateContext'

ReactDOM.createRoot(document.getElementById('root')).render(
<React.StrictMode>
  <DNSStateProvider>
    <App />
  </DNSStateProvider>
</React.StrictMode>,
)