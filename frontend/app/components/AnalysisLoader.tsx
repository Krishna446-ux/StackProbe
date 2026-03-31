'use client'

import { useState, useEffect, useRef } from 'react'

interface AnalysisLoaderProps {
  repoUrl: string
  onComplete: () => void
}

const STAGES = [
  { id: 'clone', label: 'Cloning repository', duration: 4000, lines: [
    '$ git clone --depth=1 {repo}',
    'Cloning into temp workspace...',
    'remote: Enumerating objects: 2847, done.',
    'remote: Counting objects: 100% (2847/2847), done.',
    'Receiving objects: 100% (2847/2847), 18.4 MiB | 38.2 MiB/s',
    '✓ Repository cloned in 3.2s',
  ]},
  { id: 'scan', label: 'Scanning code structure', duration: 5000, lines: [
    '$ stackprobe scan --deep --include=*.ts,*.js,*.py',
    'Indexing 1,284 source files...',
    'Detecting frameworks: Express 4.18, Fastify',
    'Analyzing dependency graph...',
    'Found 847 functions, 143 API routes',
    '⚠ 23 potential performance issues flagged',
    '⚠ 6 N+1 query patterns detected',
    '✓ Code scan complete',
  ]},
  { id: 'benchmark', label: 'Benchmarking API endpoints', duration: 8000, lines: [
    '$ stackprobe bench --endpoints=auto --requests=500',
    'Spinning up sandboxed environment...',
    'Testing 143 endpoints × 500 requests each...',
    'GET  /api/users          avg: 142ms  p99: 891ms  ⚠',
    'POST /api/auth/login     avg: 38ms   p99: 112ms  ✓',
    'GET  /api/products       avg: 2,847ms p99: 8,200ms ✗',
    'GET  /api/search         avg: 421ms  p99: 2,100ms ⚠',
    'POST /api/checkout       avg: 892ms  p99: 3,400ms ⚠',
    '+ 138 more endpoints...',
    '✓ Benchmarks complete: 71,500 requests sent',
  ]},
  { id: 'ai', label: 'Generating AI recommendations', duration: 6000, lines: [
    '$ stackprobe ai --model=claude-3 --context=full',
    'Sending codebase context to AI engine...',
    'Analyzing bottleneck patterns...',
    'Generating fix for: /api/products (missing index)',
    'Generating fix for: N+1 in user.getOrders()',
    'Generating fix for: unbounded pagination',
    'Cross-referencing with performance database...',
    '✓ 18 actionable fixes generated',
  ]},
  { id: 'report', label: 'Compiling performance report', duration: 3000, lines: [
    '$ stackprobe compile --format=interactive',
    'Building performance score matrix...',
    'Generating diff patches for each fix...',
    'Calculating before/after projections...',
    '✓ Report ready',
  ]},
]

export default function AnalysisLoader({ repoUrl, onComplete }: AnalysisLoaderProps) {
  const [currentStage, setCurrentStage] = useState(0)
  const [displayedLines, setDisplayedLines] = useState<string[]>([])
  const [lineIndex, setLineIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const terminalRef = useRef<HTMLDivElement>(null)

  const repoName = repoUrl.replace('https://github.com/', '')
  const totalDuration = STAGES.reduce((sum, s) => sum + s.duration, 0)

  // Elapsed timer
  useEffect(() => {
    const timer = setInterval(() => setElapsed(e => e + 1), 1000)
    return () => clearInterval(timer)
  }, [])

  // Progress bar
  useEffect(() => {
    const start = Date.now()
    const timer = setInterval(() => {
      const elapsed = Date.now() - start
      const pct = Math.min((elapsed / totalDuration) * 100, 99)
      setProgress(pct)
    }, 100)
    return () => clearInterval(timer)
  }, [totalDuration])

  // Stage progression
  useEffect(() => {
    let stageTimer: ReturnType<typeof setTimeout>
    let linePrinter: ReturnType<typeof setInterval>

    const runStage = (idx: number) => {
      if (idx >= STAGES.length) {
        setProgress(100)
        setTimeout(onComplete, 500)
        return
      }

      const stage = STAGES[idx]
      setCurrentStage(idx)
      setLineIndex(0)

      let lIdx = 0
      linePrinter = setInterval(() => {
        const lines = stage.lines.map(l => l.replace('{repo}', repoName))
        if (lIdx < lines.length) {
                const currentLine = lines[lIdx]
                if (currentLine !== undefined) {
                  setDisplayedLines(prev => [...prev, currentLine])
                }
                lIdx++ // Increment safely moves forward regardless of string content
              }
      }, stage.duration / (stage.lines.length + 1))

      stageTimer = setTimeout(() => {
        clearInterval(linePrinter)
        runStage(idx + 1)
      }, stage.duration)
    }

    runStage(0)
    return () => {
      clearTimeout(stageTimer)
      clearInterval(linePrinter)
    }
  }, [repoName, onComplete])

  // Auto-scroll terminal
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }, [displayedLines])

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 24px',
      position: 'relative',
    }}>
      
      {/* Grid bg */}
      <div className="grid-bg" style={{ position: 'fixed', inset: 0, opacity: 0.5 }} />

      <div style={{ maxWidth: '860px', width: '100%', position: 'relative', zIndex: 1 }}>

        {/* Header */}
        <div style={{ marginBottom: '32px', animation: 'fade-in-up 0.4s ease' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '8px', height: '8px',
                borderRadius: '50%',
                background: 'var(--green)',
                boxShadow: '0 0 12px var(--green)',
                animation: 'pulse-glow 1.5s ease infinite',
              }} />
              <span className="font-display" style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.02em' }}>
                Analyzing {repoName}
              </span>
            </div>
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '13px',
              color: 'var(--accent)',
              padding: '4px 12px',
              border: '1px solid rgba(0,229,255,0.2)',
              borderRadius: '2px',
            }}>
              {elapsed}s elapsed
            </div>
          </div>

          {/* Progress bar */}
          <div style={{
            height: '2px',
            background: 'var(--surface-2)',
            borderRadius: '1px',
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              width: `${progress}%`,
              background: 'linear-gradient(90deg, var(--accent), var(--green))',
              transition: 'width 0.3s ease',
              boxShadow: '0 0 12px var(--accent)',
            }} />
          </div>
        </div>

        {/* Stage indicators */}
        <div style={{
          display: 'flex',
          gap: '0',
          marginBottom: '28px',
          animation: 'fade-in-up 0.4s ease 0.1s both',
        }}>
          {STAGES.map((stage, i) => (
            <div key={stage.id} style={{
              flex: 1,
              padding: '12px 16px',
              borderTop: `2px solid ${i < currentStage ? 'var(--green)' : i === currentStage ? 'var(--accent)' : 'var(--border)'}`,
              background: i === currentStage ? 'var(--surface)' : 'transparent',
              transition: 'all 0.3s',
            }}>
              <div style={{
                fontSize: '10px',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: i < currentStage ? 'var(--green)' : i === currentStage ? 'var(--accent)' : 'var(--text-muted)',
                marginBottom: '4px',
              }}>
                {i < currentStage ? '✓' : i === currentStage ? '◆' : `0${i + 1}`}
              </div>
              <div style={{
                fontSize: '12px',
                color: i === currentStage ? 'var(--text)' : 'var(--text-muted)',
                fontFamily: 'var(--font-display)',
                fontWeight: i === currentStage ? 600 : 400,
              }}>
                {stage.label}
              </div>
            </div>
          ))}
        </div>

        {/* Terminal */}
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '4px',
          overflow: 'hidden',
          animation: 'fade-in-up 0.4s ease 0.2s both',
        }}>
          {/* Terminal header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 16px',
            borderBottom: '1px solid var(--border)',
            background: 'var(--surface-2)',
          }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#FF5F56' }} />
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#FFBD2E' }} />
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#27C93F' }} />
            <span style={{ marginLeft: '12px', fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.06em' }}>
              stackprobe — bash — 120×30
            </span>
          </div>

          {/* Terminal body */}
          <div
            ref={terminalRef}
            style={{
              padding: '20px 24px',
              height: '320px',
              overflowY: 'auto',
              fontFamily: 'var(--font-mono), monospace',
              fontSize: '13px',
              lineHeight: '1.7',
            }}
          >
            {displayedLines.map((line, i) => (
              <div
                key={i}
                style={{
                  color: line.startsWith('✓') ? 'var(--green)' :
                         line.startsWith('⚠') ? 'var(--yellow)' :
                         line.startsWith('✗') ? 'var(--red)' :
                         line.startsWith('$') ? 'var(--accent)' :
                         'var(--text-dim)',
                  animation: 'slide-in-right 0.2s ease',
                }}
              >
                {line}
              </div>
            ))}
            {/* Blinking cursor */}
            <span style={{
              display: 'inline-block',
              width: '8px',
              height: '14px',
              background: 'var(--accent)',
              animation: 'blink 1s step-end infinite',
              verticalAlign: 'middle',
              marginTop: '4px',
            }} />
          </div>
        </div>
      </div>
    </div>
  )
}
