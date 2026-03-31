'use client'

import { useState, useEffect } from 'react'
import { Github, Zap, ArrowRight } from 'lucide-react'

interface HeroProps {
  onAnalyze: (url: string) => void
  isLoading: boolean
}

const EXAMPLE_REPOS = [
  'https://github.com/vercel/next.js',
  'https://github.com/facebook/react',
  'https://github.com/expressjs/express',
  'https://github.com/fastify/fastify',
]

export default function Hero({ onAnalyze, isLoading }: HeroProps) {
  const [url, setUrl] = useState('')
  const [placeholder, setPlaceholder] = useState('')
  const [repoIndex, setRepoIndex] = useState(0)
  const [charIndex, setCharIndex] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)

  // Typewriter effect for placeholder
  useEffect(() => {
    if (url) return
    const target = EXAMPLE_REPOS[repoIndex]
    const speed = isDeleting ? 18 : 38

    const timer = setTimeout(() => {
      if (!isDeleting && charIndex < target.length) {
        setPlaceholder(target.slice(0, charIndex + 1))
        setCharIndex(c => c + 1)
      } else if (!isDeleting && charIndex === target.length) {
        setTimeout(() => setIsDeleting(true), 1800)
      } else if (isDeleting && charIndex > 0) {
        setPlaceholder(target.slice(0, charIndex - 1))
        setCharIndex(c => c - 1)
      } else if (isDeleting && charIndex === 0) {
        setIsDeleting(false)
        setRepoIndex(i => (i + 1) % EXAMPLE_REPOS.length)
      }
    }, speed)

    return () => clearTimeout(timer)
  }, [charIndex, isDeleting, repoIndex, url])

  const handleSubmit = () => {
    const target = url.trim() || EXAMPLE_REPOS[repoIndex]
    if (target) onAnalyze(target)
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit()
  }

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-6 grid-bg overflow-hidden">
      
      {/* Radial gradient spotlight */}
      <div style={{
        position: 'absolute',
        top: '30%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '800px',
        height: '600px',
        background: 'radial-gradient(ellipse, rgba(0,229,255,0.06) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Top nav */}
      <nav style={{
        position: 'fixed',
        top: 0, left: 0, right: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '20px 40px',
        borderBottom: '1px solid var(--border)',
        background: 'rgba(8,11,15,0.85)',
        backdropFilter: 'blur(12px)',
        zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '28px', height: '28px',
            background: 'var(--accent)',
            clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
          }} />
          <span className="font-display" style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '-0.02em' }}>
            StackProbe
          </span>
        </div>
        <div style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
          {['Docs', 'API', 'Blog'].map(item => (
            <a key={item} href="#" style={{
              color: 'var(--text-muted)',
              textDecoration: 'none',
              fontSize: '12px',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              transition: 'color 0.2s',
            }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
            >{item}</a>
          ))}
          <a href="#" style={{
            padding: '8px 18px',
            border: '1px solid var(--border-bright)',
            borderRadius: '2px',
            fontSize: '12px',
            letterSpacing: '0.06em',
            color: 'var(--text)',
            textDecoration: 'none',
            textTransform: 'uppercase',
            transition: 'all 0.2s',
          }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'var(--accent)'
              e.currentTarget.style.color = 'var(--accent)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--border-bright)'
              e.currentTarget.style.color = 'var(--text)'
            }}
          >Sign In</a>
        </div>
      </nav>

      {/* Hero content */}
      <div style={{ maxWidth: '760px', width: '100%', textAlign: 'center', position: 'relative', zIndex: 1 }}>

        {/* Headline */}
        <h1 className="font-display" style={{
          fontSize: 'clamp(40px, 7vw, 72px)',
          fontWeight: 800,
          lineHeight: 1.05,
          letterSpacing: '-0.04em',
          marginBottom: '24px',
          animation: 'fade-in-up 0.5s ease 0.1s both forwards',
        }}>
          X-Ray your repo.
          <br />
          <span style={{
            background: 'linear-gradient(135deg, var(--accent) 0%, #7B61FF 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>Fix it in 60 seconds.</span>
        </h1>

        <p style={{
          fontSize: '16px',
          color: 'var(--text-dim)',
          lineHeight: 1.7,
          maxWidth: '520px',
          margin: '0 auto 48px',
          animation: 'fade-in-up 0.5s ease 0.2s both forwards',
        }}>
          Paste a GitHub URL. StackProbe clones it server-side, scans for performance
          bottlenecks, benchmarks every API endpoint, and delivers AI-powered fixes.
        </p>

        {/* URL Input */}
        <div style={{
          position: 'relative',
          animation: 'fade-in-up 0.5s ease 0.3s both forwards',
          marginBottom: '20px',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: 'var(--surface)',
            border: '1px solid var(--border-bright)',
            borderRadius: '4px',
            padding: '0 0 0 20px',
            transition: 'border-color 0.2s, box-shadow 0.2s',
          }}
            onFocus={() => {}}
          >
            <Github size={18} color="var(--text-muted)" style={{ flexShrink: 0 }} />
            <input
              type="text"
              value={url}
              onChange={e => setUrl(e.target.value)}
              onKeyDown={handleKey}
              placeholder={placeholder}
              disabled={isLoading}
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                padding: '18px 16px',
                fontSize: '14px',
                color: 'var(--text)',
                fontFamily: 'var(--font-mono), monospace',
                letterSpacing: '0.02em',
              }}
            />
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '14px 28px',
                background: isLoading ? 'var(--border)' : 'var(--accent)',
                border: 'none',
                borderRadius: '2px',
                margin: '4px',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                color: isLoading ? 'var(--text-muted)' : '#000',
                fontSize: '13px',
                fontWeight: 700,
                fontFamily: 'var(--font-display), sans-serif',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap',
              }}
            >
              {isLoading ? (
                <>
                  <span style={{ animation: 'blink 1s step-end infinite' }}>◆</span>
                  Scanning...
                </>
              ) : (
                <>
                  <Zap size={14} />
                  Probe It
                </>
              )}
            </button>
          </div>
        </div>

        {/* Example links */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          flexWrap: 'wrap',
          animation: 'fade-in-up 0.5s ease 0.4s both forwards',
        }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.06em' }}>TRY:</span>
          {[
            { label: 'express', url: 'https://github.com/expressjs/express' },
            { label: 'fastify', url: 'https://github.com/fastify/fastify' },
            { label: 'react', url: 'https://github.com/facebook/react' },
          ].map(repo => (
            <button
              key={repo.label}
              onClick={() => setUrl(repo.url)}
              style={{
                padding: '4px 10px',
                background: 'transparent',
                border: '1px solid var(--border)',
                borderRadius: '2px',
                color: 'var(--text-muted)',
                fontSize: '11px',
                cursor: 'pointer',
                fontFamily: 'var(--font-mono)',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'var(--accent)'
                e.currentTarget.style.color = 'var(--accent)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--border)'
                e.currentTarget.style.color = 'var(--text-muted)'
              }}
            >
              {repo.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
