import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { App } from './app/App.tsx'
import { preloadHandLandmarker } from './services/mediapipe/handTrackingService'

// Descargar el modelo de manos mientras la persona lee la página de inicio:
// al encender la cámara, la detección arranca casi de inmediato.
preloadHandLandmarker()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
