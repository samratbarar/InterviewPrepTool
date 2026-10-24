import React from 'react';
import { Bot, Key, History, PlayCircle, Database, CheckCircle2 } from 'lucide-react';

export default function Header({ currentView, setCurrentView, hasApiKey, dbStatus, onOpenApiKeyModal }) {
  return (
    <header className="navbar">
      <div className="brand" role="button" onClick={() => setCurrentView('setup')} style={{ cursor: 'pointer' }}>
        <div className="brand-icon">
          <Bot size={24} />
        </div>
        <div>
          <span className="brand-title">ResumeAI Interviewer</span>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            AI-Powered Resume Defense & SQLite Database
          </div>
        </div>
      </div>

      <div className="nav-links">
        <button
          className={`nav-btn ${currentView === 'setup' || currentView === 'session' || currentView === 'report' ? 'active' : ''}`}
          onClick={() => setCurrentView('setup')}
        >
          <PlayCircle size={16} />
          <span>Interview</span>
        </button>

        <button
          className={`nav-btn ${currentView === 'history' ? 'active' : ''}`}
          onClick={() => setCurrentView('history')}
        >
          <History size={16} />
          <span>DB History</span>
        </button>

        <div
          style={{
            fontSize: '0.75rem',
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.35)',
            color: '#34d399',
            padding: '4px 10px',
            borderRadius: 20,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontWeight: 700
          }}
          title="SQLite Database active at backend/database.sqlite"
        >
          <Database size={13} />
          <span>SQLite DB Active</span>
        </div>

        <button
          className={`api-pill ${hasApiKey ? 'live' : 'demo'}`}
          onClick={onOpenApiKeyModal}
          title="Click to configure Gemini API Key"
        >
          <span className="dot"></span>
          <span>{hasApiKey ? 'Gemini AI Active' : 'Demo Mode (Add Key)'}</span>
          <Key size={12} style={{ marginLeft: 4 }} />
        </button>
      </div>
    </header>
  );
}
