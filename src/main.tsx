import '@fontsource/space-grotesk/500.css'
import '@fontsource/space-grotesk/700.css'
import '@fontsource/dm-sans/400.css'
import '@fontsource/dm-sans/500.css'
import '@fontsource/dm-sans/700.css'
import './ui/theme/tokens.css'
import './ui/theme/global.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { toDayKey } from './domain/periods.ts'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <main style={{ padding: 24 }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>Séries</h1>
      <p>Chaque jour compte. {toDayKey(new Date())}</p>
    </main>
  </StrictMode>,
)
