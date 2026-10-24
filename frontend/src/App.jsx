import React, { useState, useEffect } from 'react';
import Header from './components/Header.jsx';
import InterviewSetup from './components/InterviewSetup.jsx';
import InterviewSession from './components/InterviewSession.jsx';
import FeedbackReport from './components/FeedbackReport.jsx';
import SessionHistory from './components/SessionHistory.jsx';
import ApiKeyModal from './components/ApiKeyModal.jsx';

export default function App() {
  const [currentView, setCurrentView] = useState('setup'); // 'setup' | 'session' | 'report' | 'history'
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('gemini_api_key') || '');
  const [hasBackendKey, setHasBackendKey] = useState(false);
  const [dbStatus, setDbStatus] = useState('Checking...');
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Active session state
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [targetCompany, setTargetCompany] = useState('Amazon');
  const [currentRole, setCurrentRole] = useState('Full Stack Developer');
  const [timeLimitSeconds, setTimeLimitSeconds] = useState(90);
  const [questions, setQuestions] = useState([]);
  const [sessionResults, setSessionResults] = useState([]);

  // Database Sessions History
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const checkHealth = () => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        setHasBackendKey(data.hasApiKey);
        setDbStatus(data.database || 'Active');
      })
      .catch((err) => {
        console.warn('Backend connection notice:', err.message);
        setDbStatus('Offline (Using Local Mode)');
      });
  };

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch('/api/interview/history');
      const data = await res.json();
      if (data.success && data.sessions) {
        setHistory(data.sessions);
      }
    } catch (err) {
      console.warn('Could not fetch SQLite history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    checkHealth();
    fetchHistory();
  }, []);

  const handleSaveApiKey = (key) => {
    setApiKey(key);
    if (key) {
      localStorage.setItem('gemini_api_key', key);
    } else {
      localStorage.removeItem('gemini_api_key');
    }
  };

  // Start interview session via Backend & SQLite Database
  const handleStartInterview = async ({ resumeText, targetCompany: company, role, jobDescription, timeLimitSeconds: timeLimit, numQuestions }) => {
    setIsLoading(true);
    setTargetCompany(company);
    setCurrentRole(role);
    setTimeLimitSeconds(timeLimit);

    try {
      // 1. Upload resume to SQLite database
      const uploadRes = await fetch('/api/resume/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey ? { 'x-gemini-api-key': apiKey } : {})
        },
        body: JSON.stringify({ resumeText })
      });
      const uploadData = await uploadRes.json();
      const resumeId = uploadData.resumeId || null;

      // 2. Start session and generate questions in SQLite database
      const startRes = await fetch('/api/interview/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey ? { 'x-gemini-api-key': apiKey } : {})
        },
        body: JSON.stringify({
          resumeId,
          resumeText,
          targetCompany: company,
          role,
          jobDescription,
          timeLimitSeconds: timeLimit,
          numQuestions
        })
      });

      const startData = await startRes.json();
      if (startData.success && startData.questions && startData.questions.length > 0) {
        setCurrentSessionId(startData.sessionId);
        setQuestions(startData.questions);
        setSessionResults([]);
        setCurrentView('session');
      } else {
        alert(startData.error || 'Could not generate interview questions.');
      }
    } catch (err) {
      console.error('Error starting interview:', err);
      alert('Failed to connect to backend server. Make sure the backend server is running on http://localhost:5000.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinishInterview = async (results) => {
    setSessionResults(results);

    const total = results.length;
    const avgScore = total > 0 ? (results.reduce((acc, c) => acc + (c.evaluation?.overallScore || c.evaluation?.score || 0), 0) / total).toFixed(1) : 0;
    const avgStrength = total > 0 ? Math.round(results.reduce((acc, c) => acc + (c.evaluation?.answerStrength || (c.evaluation?.score * 10) || 0), 0) / total) : 0;

    if (currentSessionId) {
      try {
        await fetch('/api/interview/finish', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: currentSessionId,
            overallScore: avgScore,
            answerStrength: avgStrength
          })
        });
      } catch (e) {
        console.warn('Notice saving to database:', e);
      }
    }

    fetchHistory();
    setCurrentView('report');
  };

  const handleDeleteSession = async (sessionId) => {
    if (window.confirm(`Delete interview session #${sessionId} from SQLite database?`)) {
      try {
        await fetch(`/api/interview/session/${sessionId}`, { method: 'DELETE' });
        fetchHistory();
      } catch (err) {
        console.error('Failed to delete session:', err);
      }
    }
  };

  const handleClearHistory = async () => {
    if (window.confirm('Clear all interview sessions from the SQLite database?')) {
      try {
        await fetch('/api/interview/history', { method: 'DELETE' });
        setHistory([]);
      } catch (err) {
        console.error('Failed to clear database:', err);
      }
    }
  };

  const handleViewHistoricalSession = async (sessionRecord) => {
    try {
      const res = await fetch(`/api/interview/session/${sessionRecord.id}`);
      const data = await res.json();
      if (data.success && data.session) {
        setTargetCompany(data.session.target_company || 'Tech Company');
        setCurrentRole(data.session.role);

        const reconstructedResults = (data.session.questions || []).map(q => ({
          question: q.question,
          category: q.category,
          resumeSource: q.resume_source,
          userAnswer: q.user_answer,
          evaluation: {
            overallScore: q.score,
            answerStrength: q.answer_strength || (q.score * 10),
            feedback: q.feedback,
            missingPoints: q.missing_points,
            modelAnswer: q.model_answer
          }
        }));

        setSessionResults(reconstructedResults);
        setCurrentView('report');
      }
    } catch (err) {
      console.error('Error fetching session details:', err);
    }
  };

  const isLive = Boolean(apiKey || hasBackendKey);

  return (
    <div className="app-container">
      <Header
        currentView={currentView}
        setCurrentView={(view) => {
          if (view === 'history') fetchHistory();
          setCurrentView(view);
        }}
        hasApiKey={isLive}
        dbStatus={dbStatus}
        onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
      />

      <main style={{ flex: 1 }}>
        {currentView === 'setup' && (
          <InterviewSetup
            onStartInterview={handleStartInterview}
            isLoading={isLoading}
          />
        )}

        {currentView === 'session' && (
          <InterviewSession
            questions={questions}
            currentRole={currentRole}
            targetCompany={targetCompany}
            timeLimitSeconds={timeLimitSeconds}
            apiKey={apiKey}
            onFinishInterview={handleFinishInterview}
            onCancelInterview={() => setCurrentView('setup')}
          />
        )}

        {currentView === 'report' && (
          <FeedbackReport
            sessionResults={sessionResults}
            role={currentRole}
            targetCompany={targetCompany}
            onRestart={() => setCurrentView('setup')}
            onSaveToHistory={() => {
              fetchHistory();
              alert('Session is already permanently recorded in backend/database.sqlite!');
            }}
          />
        )}

        {currentView === 'history' && (
          <SessionHistory
            history={history}
            loading={loadingHistory}
            onViewSession={handleViewHistoricalSession}
            onDeleteSession={handleDeleteSession}
            onClearHistory={handleClearHistory}
            onRefresh={fetchHistory}
            onStartNew={() => setCurrentView('setup')}
          />
        )}
      </main>

      <footer style={{
        marginTop: 48,
        textAlign: 'center',
        fontSize: '0.82rem',
        color: 'var(--text-dim)',
        borderTop: '1px solid var(--border)',
        paddingTop: 24
      }}>
        BCC351 Mini Project-I · GL Bajaj Institute of Technology & Management · CSE (Data Science)
      </footer>

      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        apiKey={apiKey}
        onSaveApiKey={handleSaveApiKey}
      />
    </div>
  );
}
