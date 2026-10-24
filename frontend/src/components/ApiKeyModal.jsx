import React, { useState } from 'react';
import { X, Key, ExternalLink, Check, ShieldAlert } from 'lucide-react';

export default function ApiKeyModal({ isOpen, onClose, apiKey, onSaveApiKey }) {
  const [inputVal, setInputVal] = useState(apiKey || '');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e) => {
    e.preventDefault();
    onSaveApiKey(inputVal.trim());
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              background: 'var(--primary-glow)',
              padding: 8,
              borderRadius: 8,
              color: 'var(--primary)'
            }}>
              <Key size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Google Gemini API Key</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Power real-time AI questions & dynamic answer grading
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: 4
            }}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSave}>
          <div className="form-group" style={{ marginBottom: 20 }}>
            <label htmlFor="apiKeyInput">Enter your Gemini API Key:</label>
            <input
              id="apiKeyInput"
              type="password"
              className="form-control"
              placeholder="AIzaSy..."
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              style={{ fontFamily: 'var(--font-mono)' }}
            />
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>
              Your key is saved locally in your browser and used only for your interview requests.
            </span>
          </div>

          <div style={{
            background: '#111420',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            padding: '14px 16px',
            marginBottom: 24,
            fontSize: '0.85rem'
          }}>
            <div style={{ fontWeight: 600, color: '#fff', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>How to get a Free Gemini API Key:</span>
            </div>
            <ol style={{ paddingLeft: 18, color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: 4 }}>
              <li>Visit Google AI Studio</li>
              <li>Sign in with your Google Account</li>
              <li>Click <strong>"Get API key"</strong> and copy it</li>
            </ol>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                color: 'var(--accent)',
                marginTop: 10,
                textDecoration: 'none',
                fontWeight: 600
              }}
            >
              Open Google AI Studio <ExternalLink size={14} />
            </a>
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            {inputVal && (
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setInputVal('');
                  onSaveApiKey('');
                }}
                style={{ fontSize: '0.85rem' }}
              >
                Clear Key (Use Demo)
              </button>
            )}
            <button type="submit" className="btn-primary" style={{ width: 'auto', padding: '10px 24px' }}>
              Save & Apply
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
