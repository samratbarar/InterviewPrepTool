import React, { useState, useEffect } from 'react';
import { History, Trash2, Award, Calendar, Database, RefreshCw, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function SessionHistory({ history, onViewSession, onClearHistory, onDeleteSession, onRefresh, onStartNew, loading }) {
  const [weakAreas, setWeakAreas] = useState([]);

  useEffect(() => {
    fetch('/api/interview/analytics/weak-areas')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.weakAreas) {
          setWeakAreas(data.weakAreas);
        }
      })
      .catch((e) => console.warn(e));
  }, [history]);

  if (loading) {
    return (
      <div className="glass-card" style={{ maxWidth: 740, margin: '0 auto', textAlign: 'center', padding: '60px 24px' }}>
        <div className="spinner" style={{
          width: 32,
          height: 32,
          border: '3px solid rgba(255,255,255,0.2)',
          borderTopColor: 'var(--primary)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
          margin: '0 auto 16px'
        }}></div>
        <p style={{ color: 'var(--text-muted)' }}>Querying SQLite Database (`database.sqlite`)...</p>
      </div>
    );
  }

  if (!history || history.length === 0) {
    return (
      <div className="glass-card" style={{ maxWidth: 740, margin: '0 auto', textAlign: 'center', padding: '60px 24px' }}>
        <div style={{
          width: 58,
          height: 58,
          borderRadius: '50%',
          background: 'var(--primary-glow)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px',
          color: 'var(--primary)'
        }}>
          <Database size={30} />
        </div>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: 8 }}>
          No Interview Records in SQLite DB
        </h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: 28, maxWidth: 460, margin: '0 auto 28px' }}>
          Complete a timed mock interview session. Your answers, scores, and recurring weak areas will be stored in your backend SQLite database (`database.sqlite`).
        </p>
        <button className="btn-primary" onClick={onStartNew} style={{ width: 'auto', padding: '12px 28px' }}>
          Start Mock Interview →
        </button>
      </div>
    );
  }

  return (
    <div className="glass-card" style={{ maxWidth: 940, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800 }}>Progress & Weak-Area Tracking</h2>
            <span style={{
              background: 'rgba(99, 102, 241, 0.15)',
              color: '#a5b4fc',
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: 12
            }}>
              backend/database.sqlite
            </span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
            Permanent interview records and multi-session recurring weak-area detection.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            className="btn-secondary"
            onClick={onRefresh}
            style={{ fontSize: '0.82rem', padding: '6px 12px' }}
          >
            <RefreshCw size={13} /> Refresh
          </button>
          <button
            className="btn-secondary"
            onClick={onClearHistory}
            style={{ fontSize: '0.82rem', color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.3)' }}
          >
            <Trash2 size={13} /> Clear DB
          </button>
        </div>
      </div>

      {/* Recurring Weak Areas Widget (Per Objective 5) */}
      {weakAreas.length > 0 && (
        <div style={{
          background: 'rgba(245, 158, 11, 0.08)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          borderRadius: 12,
          padding: '18px 20px',
          marginBottom: 28
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#fbbf24', fontWeight: 800, fontSize: '0.95rem', marginBottom: 6 }}>
            <AlertTriangle size={18} /> Recurring Weak Topics & Gaps Detected Across Practice Sessions:
          </div>
          <p style={{ fontSize: '0.85rem', color: '#fde68a', marginBottom: 12 }}>
            The system flagged these topics based on low scores (&lt; 7/10) or skipped questions. Focus your revision here:
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {weakAreas.map((w, idx) => (
              <div key={idx} style={{
                background: '#111420',
                padding: '10px 14px',
                borderRadius: 6,
                border: '1px solid rgba(255, 255, 255, 0.06)',
                fontSize: '0.85rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#fff', fontWeight: 600 }}>
                  <span>{w.question}</span>
                  <span style={{ color: w.is_skipped ? '#f87171' : '#fbbf24', fontSize: '0.78rem' }}>
                    {w.is_skipped ? 'Skipped / Timeout' : `Score: ${w.score}/10`}
                  </span>
                </div>
                {w.missing_points && (
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: 4 }}>
                    Note: {w.missing_points}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Past Sessions List */}
      <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 14 }}>Recorded Practice Sessions:</h3>
      <div className="history-grid">
        {history.map((item) => {
          const strength = Number(item.answer_strength) || Math.round((Number(item.overall_score) || 7) * 10);
          return (
            <div
              key={item.id}
              className="history-card"
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <div
                onClick={() => onViewSession(item)}
                style={{ flex: 1, cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 6 }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff' }}>
                    {item.target_company || 'Tech Company'} · {item.role}
                  </span>
                  <span style={{
                    fontSize: '0.72rem',
                    color: 'var(--accent)',
                    fontFamily: 'var(--font-mono)'
                  }}>
                    Session #{item.id}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: '0.82rem', color: 'var(--text-dim)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Calendar size={13} /> {item.created_at || item.date || 'Recent'}
                  </span>
                  <span>•</span>
                  <span>{item.total_questions || 3} Questions</span>
                  <span>•</span>
                  <span>Time Limit: {item.time_limit_seconds || 90}s</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <span className={`score-badge ${
                  strength >= 75 ? 'score-high' : 'score-mid'
                }`} style={{ margin: 0, padding: '6px 16px', fontSize: '1rem' }}>
                  Strength: {strength}%
                </span>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onDeleteSession) onDeleteSession(item.id);
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-dim)',
                    cursor: 'pointer',
                    padding: 6,
                    borderRadius: 6
                  }}
                  title="Delete from SQLite database"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
