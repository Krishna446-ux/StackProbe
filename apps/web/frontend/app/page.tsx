'use client'

import { useState } from 'react'
import Hero from './components/Hero'
import AnalysisLoader from './components/AnalysisLoader'
import Report from './components/Report'
import HowItWorks from './components/HowItWorks'

type AppState = 'landing' | 'analyzing' | 'report'

export default function Home() {
  const [state, setState] = useState<AppState>('landing')
  const [repoUrl, setRepoUrl] = useState('')

  const handleAnalyze = (url: string) => {
    setRepoUrl(url)
    setState('analyzing')
  }

  const handleAnalysisComplete = () => {
    setState('report')
  }

  const handleReset = () => {
    setState('landing')
    setRepoUrl('')
  }

  if (state === 'analyzing') {
    return (
      <main>
        <AnalysisLoader repoUrl={repoUrl} onComplete={handleAnalysisComplete} />
      </main>
    )
  }

  if (state === 'report') {
    return (
      <main>
        <Report repoUrl={repoUrl} onReset={handleReset} />
      </main>
    )
  }

  return (
    <main>
      <Hero onAnalyze={handleAnalyze} isLoading={false} />
      <HowItWorks />

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--border)',
        padding: '40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        maxWidth: '1100px',
        margin: '0 auto',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '20px', height: '20px',
            background: 'var(--accent)',
            clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
          }} />
          <span className="font-display" style={{ fontSize: '14px', fontWeight: 700, letterSpacing: '-0.02em' }}>
            StackProbe
          </span>
        </div>
        <div style={{ display: 'flex', gap: '24px' }}>
          {['Privacy', 'Terms', 'Status', 'GitHub'].map(link => (
            <a key={link} href="#" style={{
              fontSize: '11px',
              color: 'var(--text-muted)',
              textDecoration: 'none',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}>
              {link}
            </a>
          ))}
        </div>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.06em' }}>
          © 2025 StackProbe
        </div>
      </footer>
    </main>
  )
}
