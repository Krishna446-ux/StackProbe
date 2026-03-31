'use client'

import { useEffect, useRef, useState } from 'react'
import { GitBranch, Cpu, BarChart2, Sparkles } from 'lucide-react'

const STEPS = [
  {
    icon: GitBranch,
    number: '01',
    title: 'Clone & Index',
    description: 'StackProbe clones your repo server-side in a sandboxed environment. No access tokens needed — just the URL.',
    detail: 'Supports all public GitHub repos. Private repos available on Pro.',
    color: 'var(--accent)',
  },
  {
    icon: Cpu,
    number: '02',
    title: 'Deep Code Scan',
    description: 'Our scanner parses every file, detects frameworks, maps your API routes, and finds N+1 queries, missing indexes, and unbounded loops.',    detail: 'Supports Node.js, Python, Go, Ruby, and more — framework-agnostic.',
    color: '#7B61FF',
  },
  {
    icon: BarChart2,
    number: '03',
    title: 'Live Benchmarks',
    description: 'Every detected endpoint gets hit with 500 synthetic requests. We measure avg, p50, p95, and p99 latency.',
    detail: 'All benchmarks run in isolated containers. Zero impact on your production.',
    color: 'var(--green)',
  },
  {
    icon: Sparkles,
    number: '04',
    title: 'AI-Powered Fixes',
    description: 'Claude analyzes the bottlenecks in full context and generates diff patches you can apply with one click.',
    detail: 'Each fix includes before/after code and an estimated performance improvement.',
    color: 'var(--yellow)',
  },
]

export default function HowItWorks() {
  const [visible, setVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true) },
      { threshold: 0.1 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return (
    <section ref={ref} style={{
      padding: '120px 40px',
      maxWidth: '1100px',
      margin: '0 auto',
    }}>
      <div style={{
        marginBottom: '64px',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(20px)',
        transition: 'all 0.6s ease',
      }}>
        <div style={{
          fontSize: '11px',
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'var(--accent)',
          marginBottom: '16px',
        }}>How It Works</div>
        <h2 className="font-display" style={{
          fontSize: 'clamp(28px, 4vw, 44px)',
          fontWeight: 800,
          letterSpacing: '-0.03em',
          lineHeight: 1.1,
        }}>
          60 seconds from URL
          <br />
          to actionable report.
        </h2>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '2px',
        background: 'var(--border)',
        border: '1px solid var(--border)',
        borderRadius: '4px',
        overflow: 'hidden',
      }}>
        {STEPS.map((step, i) => {
          const Icon = step.icon
          return (
            <div
              key={step.number}
              style={{
                background: 'var(--surface)',
                padding: '36px 32px',
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0)' : 'translateY(20px)',
                transition: `all 0.5s ease ${i * 0.1}s`,
                position: 'relative',
                overflow: 'hidden',
              }}
              onMouseEnter={e => {
                const el = e.currentTarget
                el.style.background = 'var(--surface-2)'
              }}
              onMouseLeave={e => {
                const el = e.currentTarget
                el.style.background = 'var(--surface)'
              }}
            >
              {/* Number watermark */}
              <div className="font-display" style={{
                position: 'absolute',
                top: '-10px',
                right: '16px',
                fontSize: '80px',
                fontWeight: 800,
                color: step.color,
                opacity: 0.04,
                letterSpacing: '-0.04em',
                pointerEvents: 'none',
                userSelect: 'none',
              }}>
                {step.number}
              </div>

              <div style={{
                width: '40px',
                height: '40px',
                border: `1px solid ${step.color}`,
                borderRadius: '2px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '20px',
                background: `${step.color}12`,
              }}>
                <Icon size={18} color={step.color} />
              </div>

              <div style={{ fontSize: '10px', letterSpacing: '0.1em', color: step.color, marginBottom: '8px' }}>
                STEP {step.number}
              </div>

              <h3 className="font-display" style={{
                fontSize: '18px',
                fontWeight: 700,
                marginBottom: '12px',
                letterSpacing: '-0.02em',
              }}>
                {step.title}
              </h3>

              <p style={{
                fontSize: '13px',
                color: 'var(--text-dim)',
                lineHeight: 1.7,
                marginBottom: '16px',
              }}>
                {step.description}
              </p>

              <p style={{
                fontSize: '11px',
                color: 'var(--text-muted)',
                borderTop: `1px solid var(--border)`,
                paddingTop: '12px',
                lineHeight: 1.6,
              }}>
                {step.detail}
              </p>
            </div>
          )
        })}
      </div>
    </section>
  )
}
