import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import {
  Award, CheckCircle2, AlertCircle, RotateCcw,
  Printer, Lightbulb, ChevronDown, ChevronUp, Cpu, MessageSquare, Target, Check
} from 'lucide-react';

export default function FeedbackReport({ sessionResults, role, targetCompany, onRestart, onSaveToHistory }) {
  const [expandedIndex, setExpandedIndex] = useState(null);

  const totalQuestions = sessionResults.length;
  const totalScore = sessionResults.reduce((acc, curr) => acc + (curr?.evaluation?.overallScore || curr?.evaluation?.score || 0), 0);
  const avgScore = totalQuestions > 0 ? (totalScore / totalQuestions).toFixed(1) : 0;

  const totalStrength = sessionResults.reduce((acc, curr) => acc + (curr?.evaluation?.answerStrength || (curr?.evaluation?.score * 10) || 0), 0);
  const avgStrength = totalQuestions > 0 ? Math.round(totalStrength / totalQuestions) : 0;

  useEffect(() => {
    if (avgStrength >= 70) {
      try {
        confetti({
          particleCount: 110,
          spread: 75,
          origin: { y: 0.6 }
        });
      } catch (e) {}
    }
  }, [avgStrength]);

  const handlePrint = () => {
    window.print();
  };

  const getStatusText = (strength) => {
    if (strength >= 80) return { text: 'Outstanding! Placement Ready 🎉', color: '#10b981' };
    if (strength >= 65) return { text: 'Good Technical Detail — Strengthen Outcomes & Metrics 👍', color: '#06b6d4' };
    return { text: 'Needs Focused Revision on Missing/Vague Points 📚', color: '#ef4444' };
  };

  const status = getStatusText(avgStrength);

  return (
    <div className="glass-card" style={{ maxWidth: 940, margin: '0 auto' }}>
      {/* College Project Header */}
      <div style={{
        background: 'rgba(99, 102, 241, 0.08)',
        border: '1px solid rgba(99, 102, 241, 0.25)',
        borderRadius: 8,
        padding: '10px 16px',
        marginBottom: 24,
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '0.8rem',
        color: 'var(--text-muted)'
      }}>
        <span>GL Bajaj Institute of Technology & Management · CSE (Data Science)</span>
        <span>Course: BCC351 Mini Project-I</span>
      </div>

      {/* Hero Scorecard */}
      <div className="summary-hero">
        <span style={{
          background: 'var(--primary-glow)',
          color: '#a5b4fc',
          fontSize: '0.8rem',
          fontWeight: 700,
          padding: '6px 16px',
          borderRadius: 20,
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          Mock Interview Assessment Complete
        </span>

        <h1 style={{ fontSize: '2.4rem', fontWeight: 800, marginTop: 12, marginBottom: 6 }}>
          Interview Performance Scorecard
        </h1>

        <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', marginBottom: 20 }}>
          Target: <strong style={{ color: '#fff' }}>{targetCompany || 'Tech Company'}</strong> · Role: <strong style={{ color: '#fff' }}>{role}</strong>
        </p>

        {/* Answer Strength % */}
        <div className="big-score">
          {avgStrength}%
        </div>

        <div style={{
          fontSize: '1.15rem',
          fontWeight: 700,
          color: status.color,
          marginTop: 6
        }}>
          {status.text}
        </div>
      </div>

      {/* Metrics Row */}
      <div className="pillar-grid" style={{ marginBottom: 32 }}>
        <div className="pillar-card">
          <div className="pillar-title">Average Score</div>
          <div className="pillar-score" style={{ color: '#38bdf8' }}>
            {avgScore} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>/ 10</span>
          </div>
        </div>

        <div className="pillar-card">
          <div className="pillar-title">Questions Evaluated</div>
          <div className="pillar-score" style={{ color: '#a78bfa' }}>
            {totalQuestions}
          </div>
        </div>

        <div className="pillar-card">
          <div className="pillar-title">Storage Status</div>
          <div className="pillar-score" style={{ color: '#34d399', fontSize: '1.1rem', marginTop: 4 }}>
            ✓ Saved in SQLite DB
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 36, flexWrap: 'wrap' }}>
        <button
          className="btn-secondary"
          onClick={handlePrint}
          style={{ padding: '12px 24px' }}
        >
          <Printer size={18} /> Print / Export PDF Report
        </button>

        <button
          className="btn-secondary"
          onClick={onRestart}
          style={{ padding: '12px 24px' }}
        >
          <RotateCcw size={18} /> Start Another Mock Interview
        </button>
      </div>

      {/* Question by Question Detailed Breakdown */}
      <div>
        <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: 16 }}>
          Categorized Question-by-Question Deep Review
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {sessionResults.map((item, idx) => {
            const isExpanded = expandedIndex === idx;
            const evalData = item.evaluation || {};
            const strength = evalData.answerStrength || (evalData.score * 10) || 0;

            return (
              <div
                key={idx}
                style={{
                  background: '#111420',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  padding: 20
                }}
              >
                <div
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                  onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{
                      fontWeight: 800,
                      fontSize: '0.9rem',
                      color: 'var(--text-dim)',
                      minWidth: 24
                    }}>
                      Q{idx + 1}
                    </span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#fff' }}>
                        {item.question}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Category: <strong style={{ color: '#a5b4fc' }}>{item.category || 'Technical'}</strong> {item.resumeSource ? `· Context: ${item.resumeSource}` : ''}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span className={`score-badge ${strength >= 75 ? 'score-high' : 'score-mid'}`} style={{ margin: 0, padding: '4px 12px', fontSize: '0.85rem' }}>
                      Strength: {strength}%
                    </span>
                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </div>
                </div>

                {isExpanded && (
                  <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                    {/* User Answer */}
                    <div style={{ marginBottom: 16 }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                        Your Answer:
                      </span>
                      <p style={{
                        marginTop: 4,
                        padding: 12,
                        background: '#0c0e17',
                        borderRadius: 6,
                        fontSize: '0.92rem',
                        color: '#cbd5e1'
                      }}>
                        {item.userAnswer || 'No answer submitted (Timed Out / Skipped).'}
                      </p>
                    </div>

                    {/* AI Feedback */}
                    <div style={{ marginBottom: 16 }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase' }}>
                        Feedback:
                      </span>
                      <p style={{ marginTop: 4, fontSize: '0.95rem', color: '#e2e8f0', lineHeight: 1.6 }}>
                        {evalData.feedback}
                      </p>
                    </div>

                    {/* Missing Points */}
                    {evalData.missingPoints && (
                      <div style={{ background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.25)', borderRadius: 6, padding: 12, marginBottom: 16 }}>
                        <span style={{ fontSize: '0.8rem', color: '#fbbf24', fontWeight: 700 }}>What was missing or vague:</span>
                        <p style={{ fontSize: '0.88rem', color: '#fde68a', marginTop: 4 }}>
                          {evalData.missingPoints}
                        </p>
                      </div>
                    )}

                    {/* Model Answer */}
                    {evalData.modelAnswer && (
                      <div style={{ background: '#0e1726', border: '1px solid rgba(6, 182, 212, 0.3)', padding: 14, borderRadius: 6 }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--accent)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Lightbulb size={14} /> Recommended Model Answer:
                        </span>
                        <p style={{ marginTop: 6, fontSize: '0.88rem', color: '#cbd5e1', lineHeight: 1.6 }}>
                          {evalData.modelAnswer}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
