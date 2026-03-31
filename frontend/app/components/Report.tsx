'use client'

import { useState } from 'react'
import { AlertTriangle, CheckCircle, XCircle, ChevronDown, ChevronUp, Copy, ExternalLink, RefreshCw } from 'lucide-react'
import ScoreRing from './ScoreRing'

interface ReportProps {
  repoUrl: string
  onReset: () => void
}

const MOCK_REPORT = {
  overallScore: 42,
  scores: {
    performance: 42,
    security: 71,
    maintainability: 58,
    dependencies: 84,
  },
  summary: {
    critical: 3,
    warnings: 14,
    passed: 89,
    totalFiles: 284,
    linesScanned: 47821,
  },
  endpoints: [
    { path: '/api/products', method: 'GET', avg: 2847, p99: 8200, status: 'critical', issue: 'Missing database index on products.category_id' },
    { path: '/api/users', method: 'GET', avg: 142, p99: 891, status: 'warning', issue: 'N+1 query in user.getOrders()' },
    { path: '/api/search', method: 'GET', avg: 421, p99: 2100, status: 'warning', issue: 'Unbounded pagination, no limit enforced' },
    { path: '/api/checkout', method: 'POST', avg: 892, p99: 3400, status: 'warning', issue: 'Synchronous payment processing blocking response' },
    { path: '/api/auth/login', method: 'POST', avg: 38, p99: 112, status: 'good', issue: null },
    { path: '/api/auth/refresh', method: 'POST', avg: 12, p99: 44, status: 'good', issue: null },
    { path: '/api/health', method: 'GET', avg: 2, p99: 8, status: 'good', issue: null },
  ],
  fixes: [
    {
      id: 'fix-1',
      title: 'Add index on products.category_id',
      impact: 'critical',
      file: 'migrations/20240115_add_indexes.sql',
      estimatedImprovement: '94% faster',
      before: `-- No index exists
SELECT * FROM products 
WHERE category_id = $1 
ORDER BY created_at DESC;`,
      after: `-- Add composite index
CREATE INDEX CONCURRENTLY idx_products_category_created
  ON products(category_id, created_at DESC);

SELECT * FROM products 
WHERE category_id = $1 
ORDER BY created_at DESC;`,
    },
    {
      id: 'fix-2',
      title: 'Fix N+1 query in user orders',
      impact: 'critical',
      file: 'src/models/user.ts',
      estimatedImprovement: '78% faster',
      before: `async getUsers() {
  const users = await db.query('SELECT * FROM users');
  // N+1: one query per user!
  for (const user of users) {
    user.orders = await db.query(
      'SELECT * FROM orders WHERE user_id = $1',
      [user.id]
    );
  }
  return users;
}`,
      after: `async getUsers() {
  // Single JOIN query instead of N+1
  const users = await db.query(\`
    SELECT u.*, 
      json_agg(o.*) as orders
    FROM users u
    LEFT JOIN orders o ON o.user_id = u.id
    GROUP BY u.id
  \`);
  return users;
}`,
    },
    {
      id: 'fix-3',
      title: 'Add pagination limits to /api/search',
      impact: 'warning',
      file: 'src/routes/search.ts',
      estimatedImprovement: '60% faster',
      before: `router.get('/search', async (req, res) => {
  const { q } = req.query;
  // No limit — could return millions of rows!
  const results = await db.query(
    'SELECT * FROM products WHERE name ILIKE $1',
    [\`%\${q}%\`]
  );
  res.json(results);
});`,
      after: `router.get('/search', async (req, res) => {
  const { q, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * Math.min(limit, 100);
  
  const results = await db.query(
    'SELECT * FROM products WHERE name ILIKE $1 LIMIT $2 OFFSET $3',
    [\`%\${q}%\`, limit, offset]
  );
  res.json({ results, page, limit });
});`,
    },
  ],
}

const StatusIcon = ({ status }: { status: string }) => {
  if (status === 'critical') return <XCircle size={14} color="var(--red)" />
  if (status === 'warning') return <AlertTriangle size={14} color="var(--yellow)" />
  return <CheckCircle size={14} color="var(--green)" />
}

const StatusBadge = ({ status }: { status: string }) => {
  const colors: Record<string, string> = {
    critical: 'var(--red)',
    warning: 'var(--yellow)',
    good: 'var(--green)',
  }
  return (
    <span style={{
      padding: '2px 8px',
      borderRadius: '2px',
      border: `1px solid ${colors[status]}`,
      color: colors[status],
      fontSize: '10px',
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
      fontFamily: 'var(--font-mono)',
    }}>
      {status}
    </span>
  )
}

export default function Report({ repoUrl, onReset }: ReportProps) {
  const [expandedFix, setExpandedFix] = useState<string | null>('fix-1')
  const [activeTab, setActiveTab] = useState<'overview' | 'endpoints' | 'fixes'>('overview')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const repoName = repoUrl.replace('https://github.com/', '')
  const report = MOCK_REPORT

  const copyCode = (id: string, text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div style={{ minHeight: '100vh', padding: '24px', maxWidth: '1100px', margin: '0 auto' }}>

      {/* Top bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '32px',
        paddingBottom: '20px',
        borderBottom: '1px solid var(--border)',
        animation: 'fade-in-up 0.4s ease',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <div style={{
              width: '6px', height: '6px',
              borderRadius: '50%',
              background: 'var(--green)',
              boxShadow: '0 0 8px var(--green)',
            }} />
            <span style={{ fontSize: '11px', color: 'var(--green)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Report Ready · Generated in 47s
            </span>
          </div>
          <h1 className="font-display" style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '-0.02em' }}>
            {repoName}
          </h1>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <a href={repoUrl} target="_blank" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            border: '1px solid var(--border)',
            borderRadius: '2px',
            color: 'var(--text-muted)',
            textDecoration: 'none',
            fontSize: '12px',
            transition: 'all 0.2s',
          }}>
            <ExternalLink size={12} />
            View Repo
          </a>
          <button onClick={onReset} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '2px',
            color: 'var(--text)',
            cursor: 'pointer',
            fontSize: '12px',
            fontFamily: 'var(--font-mono)',
            transition: 'all 0.2s',
          }}>
            <RefreshCw size={12} />
            New Scan
          </button>
        </div>
      </div>

      {/* Score cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '32px',
        animation: 'fade-in-up 0.4s ease 0.1s both',
      }}>
        {/* Overall score */}
        <div style={{
          gridColumn: '1',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '4px',
          padding: '28px',
          display: 'flex',
          alignItems: 'center',
          gap: '24px',
        }}>
          <ScoreRing score={report.overallScore} size={120} />
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>
              Overall Score
            </div>
            <div className="font-display" style={{ fontSize: '14px', color: 'var(--red)', fontWeight: 600 }}>
              Needs Work
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
              {report.summary.critical} critical issues
            </div>
          </div>
        </div>

        {/* Sub-scores */}
        {Object.entries(report.scores).filter(([k]) => k !== 'overall').map(([key, val]) => (
          <div key={key} style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '4px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
          }}>
            <ScoreRing score={val as number} size={80} />
            <div style={{
              fontSize: '11px',
              color: 'var(--text-muted)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              textAlign: 'center',
            }}>
              {key}
            </div>
          </div>
        ))}

        {/* Stats */}
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '4px',
          padding: '24px',
        }}>
          {[
            { label: 'Files Scanned', value: report.summary.totalFiles.toLocaleString() },
            { label: 'Lines Analyzed', value: report.summary.linesScanned.toLocaleString() },
            { label: 'Tests Passed', value: report.summary.passed },
            { label: 'Warnings', value: report.summary.warnings },
          ].map(stat => (
            <div key={stat.label} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '8px 0',
              borderBottom: '1px solid var(--border)',
            }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                {stat.label}
              </span>
              <span style={{ fontSize: '14px', fontFamily: 'var(--font-mono)', color: 'var(--text)' }}>
                {stat.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '0',
        borderBottom: '1px solid var(--border)',
        marginBottom: '28px',
        animation: 'fade-in-up 0.4s ease 0.2s both',
      }}>
        {(['overview', 'endpoints', 'fixes'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '12px 24px',
              background: 'transparent',
              border: 'none',
              borderBottom: `2px solid ${activeTab === tab ? 'var(--accent)' : 'transparent'}`,
              color: activeTab === tab ? 'var(--accent)' : 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: '12px',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              fontFamily: 'var(--font-mono)',
              transition: 'all 0.2s',
              marginBottom: '-1px',
            }}
          >
            {tab}
            {tab === 'fixes' && (
              <span style={{
                marginLeft: '8px',
                padding: '1px 6px',
                background: 'var(--red)',
                borderRadius: '2px',
                fontSize: '10px',
                color: '#000',
                fontWeight: 700,
              }}>
                {report.fixes.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ animation: 'fade-in-up 0.3s ease' }}>

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div>
            <div style={{ marginBottom: '24px' }}>
              <h2 className="font-display" style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', letterSpacing: '-0.01em' }}>
                Performance Bottlenecks
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  { label: 'Database Query Efficiency', score: 18, max: 100 },
                  { label: 'API Response Times', score: 34, max: 100 },
                  { label: 'Caching Strategy', score: 22, max: 100 },
                  { label: 'Bundle Size', score: 67, max: 100 },
                  { label: 'Memory Usage', score: 71, max: 100 },
                  { label: 'Error Handling', score: 58, max: 100 },
                ].map(item => (
                  <div key={item.label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>{item.label}</span>
                      <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: item.score < 40 ? 'var(--red)' : item.score < 70 ? 'var(--yellow)' : 'var(--green)' }}>
                        {item.score}/100
                      </span>
                    </div>
                    <div style={{ height: '4px', background: 'var(--surface-2)', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${item.score}%`,
                        background: item.score < 40 ? 'var(--red)' : item.score < 70 ? 'var(--yellow)' : 'var(--green)',
                        borderRadius: '2px',
                        transition: 'width 1s cubic-bezier(0.22, 1, 0.36, 1)',
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ENDPOINTS TAB */}
        {activeTab === 'endpoints' && (
          <div>
            <div style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '4px',
              overflow: 'hidden',
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface-2)' }}>
                    {['Status', 'Method', 'Endpoint', 'Avg (ms)', 'P99 (ms)', 'Issue'].map(h => (
                      <th key={h} style={{
                        padding: '10px 16px',
                        textAlign: 'left',
                        fontSize: '10px',
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        color: 'var(--text-muted)',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 400,
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {report.endpoints.map((ep, i) => (
                    <tr key={i} style={{
                      borderBottom: '1px solid var(--border)',
                      transition: 'background 0.15s',
                    }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td style={{ padding: '12px 16px' }}>
                        <StatusIcon status={ep.status} />
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          padding: '2px 6px',
                          borderRadius: '2px',
                          background: ep.method === 'GET' ? 'rgba(0,229,255,0.1)' : 'rgba(0,255,135,0.1)',
                          color: ep.method === 'GET' ? 'var(--accent)' : 'var(--green)',
                          fontSize: '11px',
                          fontFamily: 'var(--font-mono)',
                        }}>
                          {ep.method}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--text)' }}>
                        {ep.path}
                      </td>
                      <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: '13px',
                        color: ep.avg > 1000 ? 'var(--red)' : ep.avg > 200 ? 'var(--yellow)' : 'var(--green)' }}>
                        {ep.avg.toLocaleString()}
                      </td>
                      <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: '13px',
                        color: ep.p99 > 3000 ? 'var(--red)' : ep.p99 > 500 ? 'var(--yellow)' : 'var(--green)' }}>
                        {ep.p99.toLocaleString()}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--text-muted)', maxWidth: '240px' }}>
                        {ep.issue || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* FIXES TAB */}
        {activeTab === 'fixes' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {report.fixes.map(fix => (
              <div key={fix.id} style={{
                background: 'var(--surface)',
                border: `1px solid ${fix.impact === 'critical' ? 'rgba(255,59,92,0.3)' : 'var(--border)'}`,
                borderRadius: '4px',
                overflow: 'hidden',
              }}>
                {/* Fix header */}
                <div
                  onClick={() => setExpandedFix(expandedFix === fix.id ? null : fix.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px 20px',
                    cursor: 'pointer',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <StatusBadge status={fix.impact} />
                    <span className="font-display" style={{ fontSize: '15px', fontWeight: 600 }}>{fix.title}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <span style={{
                      fontSize: '12px',
                      color: 'var(--green)',
                      fontFamily: 'var(--font-mono)',
                      padding: '4px 10px',
                      border: '1px solid rgba(0,255,135,0.2)',
                      borderRadius: '2px',
                    }}>
                      ↑ {fix.estimatedImprovement}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {fix.file}
                    </span>
                    {expandedFix === fix.id ? <ChevronUp size={14} color="var(--text-muted)" /> : <ChevronDown size={14} color="var(--text-muted)" />}
                  </div>
                </div>

                {/* Expanded diff */}
                {expandedFix === fix.id && (
                  <div style={{ borderTop: '1px solid var(--border)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                      {/* Before */}
                      <div style={{ borderRight: '1px solid var(--border)' }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 16px',
                          background: 'rgba(255,59,92,0.05)',
                          borderBottom: '1px solid var(--border)',
                        }}>
                          <span style={{ fontSize: '11px', color: 'var(--red)', letterSpacing: '0.08em' }}>BEFORE</span>
                        </div>
                        <pre style={{
                          padding: '16px',
                          fontSize: '12px',
                          color: 'var(--text-dim)',
                          fontFamily: 'var(--font-mono)',
                          overflowX: 'auto',
                          lineHeight: 1.6,
                          background: 'rgba(255,59,92,0.02)',
                          margin: 0,
                        }}>
                          {fix.before}
                        </pre>
                      </div>

                      {/* After */}
                      <div>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 16px',
                          background: 'rgba(0,255,135,0.05)',
                          borderBottom: '1px solid var(--border)',
                        }}>
                          <span style={{ fontSize: '11px', color: 'var(--green)', letterSpacing: '0.08em' }}>AFTER</span>
                          <button
                            onClick={() => copyCode(fix.id, fix.after)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '4px 10px',
                              background: 'transparent',
                              border: '1px solid var(--border)',
                              borderRadius: '2px',
                              color: copiedId === fix.id ? 'var(--green)' : 'var(--text-muted)',
                              cursor: 'pointer',
                              fontSize: '10px',
                              fontFamily: 'var(--font-mono)',
                              letterSpacing: '0.06em',
                            }}
                          >
                            <Copy size={10} />
                            {copiedId === fix.id ? 'COPIED!' : 'COPY'}
                          </button>
                        </div>
                        <pre style={{
                          padding: '16px',
                          fontSize: '12px',
                          color: 'var(--text)',
                          fontFamily: 'var(--font-mono)',
                          overflowX: 'auto',
                          lineHeight: 1.6,
                          background: 'rgba(0,255,135,0.02)',
                          margin: 0,
                        }}>
                          {fix.after}
                        </pre>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
