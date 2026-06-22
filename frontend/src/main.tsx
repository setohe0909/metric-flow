import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'
import App from './App.tsx'

// Limpieza de keys obsoletas de la versión anterior (querylens_* → metricflow_*)
// Esto migra sesiones antiguas que usaran el nombre viejo del proyecto.
;['querylens_token', 'querylens_active_org_id'].forEach((key) =>
  localStorage.removeItem(key)
)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
