import React, { useState, useEffect, useRef } from 'react';
import {
  Mic, MicOff, Volume2, Send, CheckCircle2, AlertCircle,
  Clock, ArrowRight, Award, Lightbulb, ChevronDown, ChevronUp,
  FileText, ShieldAlert, Zap
} from 'lucide-react';

export default function InterviewSession({
  questions,
  currentRole,
  targetCompany,
  timeLimitSeconds = 90,
  onFinishInterview,
  onCancelInterview,
  apiKey
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [timeLeft, setTimeLeft] = useState(timeLimitSeconds);
  const [evaluating, setEvaluating] = useState(false);
  const [currentEvaluation, setCurrentEvaluation] = useState(null);
  const [completedSessions, setCompletedSessions] = useState([]);
  const [timedOut, setTimedOut] = useState(false);
  const [showModelAnswer, setShowModelAnswer] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);

  const recognitionRef = useRef(null);
  const timerRef = useRef(null);

  const currentQ = questions[currentIndex] || {};
  const progressPercent = ((currentIndex + 1) / questions.length) * 100;

  // Countdown Timer per question with Auto-Skip on Timeout
  useEffect(() => {
    setTimeLeft(timeLimitSeconds);
    setTimedOut(false);
    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setTimedOut(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentIndex, timeLimitSeconds]);

  // React to timeout event (outside timer to avoid stale closure)
  useEffect(() => {
    if (timedOut && !currentEvaluation) {
      handleTimeOutAutoSkip();
    }
  }, [timedOut]);

  // Handle timeout auto-skip
  const handleTimeOutAutoSkip = async () => {
    if (isRecording && recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
      setIsRecording(false);
    }

    setEvaluating(true);
    const timeoutAnswer = "[Question timed out before answer was submitted - Auto-skipped]";

    try {
      const res = await fetch('/api/interview/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: currentQ.dbId,
          question: currentQ.question,
          category: currentQ.category,
          resumeSource: currentQ.resumeSource,
          answer: timeoutAnswer,
          isSkipped: true,
          timeSpent: timeLimitSeconds
        })
      });
      const data = await res.json();
      if (data.success && data.evaluation) {
        setCurrentEvaluation({ ...data.evaluation, wasSkipped: true });
      }
    } catch (err) {
      console.warn('Timeout eval notice:', err);
      setCurrentEvaluation({
        score: 0,
        answerStrength: 0,
        feedback: "⏱ Time limit reached. Question auto-skipped. In placements, pacing your answer within the time limit is critical.",
        missingPoints: "No answer was provided before the timer expired.",
        modelAnswer: currentQ.hint || "Structure your answer: State the concept → your project implementation → measurable outcome.",
        wasSkipped: true
      });
    } finally {
      setEvaluating(false);
    }
  };

  // Manual skip by user
  const handleSkipQuestion = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (isRecording && recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
      setIsRecording(false);
    }

    const skippedItem = {
      questionId: currentQ.dbId || currentIndex + 1,
      question: currentQ.question,
      category: currentQ.category,
      resumeSource: currentQ.resumeSource,
      difficulty: currentQ.difficulty || 'Medium',
      userAnswer: '[Skipped by candidate]',
      evaluation: {
        score: 0,
        answerStrength: 0,
        feedback: "Question skipped. Each skip reduces your overall answer strength score.",
        missingPoints: "No answer was submitted.",
        modelAnswer: currentQ.hint || "A complete answer begins with the concept, your project usage, and closes with a specific metric or trade-off.",
        wasSkipped: true
      }
    };

    const updated = [...completedSessions, skippedItem];
    setCompletedSessions(updated);

    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
      setAnswer('');
      setCurrentEvaluation(null);
      setShowModelAnswer(false);
      setShowHint(false);
      setTimedOut(false);
    } else {
      onFinishInterview(updated);
    }
  };

  // Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript + ' ';
        }
        setAnswer((prev) => (prev ? prev.trim() + ' ' + transcript.trim() : transcript.trim()));
      };

      recognition.onerror = () => setIsRecording(false);
      recognition.onend = () => setIsRecording(false);
      recognitionRef.current = recognition;
    } else {
      setSpeechSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
    };
  }, []);

  const toggleRecording = () => {
    if (!speechSupported) {
      alert('Microphone speech recognition is supported in Google Chrome & Edge browsers. You can also type your answer!');
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (err) {
        console.warn('Speech error:', err);
      }
    }
  };

  const handleSpeakQuestion = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(currentQ.question);
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!answer.trim()) return;

    if (timerRef.current) clearInterval(timerRef.current);
    if (isRecording) toggleRecording();

    setEvaluating(true);
    setCurrentEvaluation(null);

    const timeSpent = timeLimitSeconds - timeLeft;

    try {
      const headers = { 'Content-Type': 'application/json' };
      if (apiKey) headers['x-gemini-api-key'] = apiKey;

      const res = await fetch('/api/interview/evaluate', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          questionId: currentQ.dbId,
          question: currentQ.question,
          category: currentQ.category,
          resumeSource: currentQ.resumeSource,
          answer: answer.trim(),
          isSkipped: false,
          timeSpent
        })
      });

      const data = await res.json();
      if (data.success && data.evaluation) {
        setCurrentEvaluation(data.evaluation);
        setShowModelAnswer(false);
      } else {
        alert(data.error || 'Failed to evaluate answer. Please try again.');
      }
    } catch (err) {
      console.error(err);
      alert('Network error while evaluating answer.');
    } finally {
      setEvaluating(false);
    }
  };

  const handleNext = () => {
    const sessionItem = {
      questionId: currentQ.dbId || currentIndex + 1,
      question: currentQ.question,
      category: currentQ.category,
      resumeSource: currentQ.resumeSource,
      difficulty: currentQ.difficulty || 'Medium',
      userAnswer: answer,
      evaluation: currentEvaluation
    };

    const updated = [...completedSessions, sessionItem];
    setCompletedSessions(updated);

    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
      setAnswer('');
      setCurrentEvaluation(null);
      setShowModelAnswer(false);
      setShowHint(false);
      setTimedOut(false);
    } else {
      onFinishInterview(updated);
    }
  };

  const formatCountdown = (secs) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${rem < 10 ? '0' : ''}${rem}`;
  };

  const wordCount = answer.trim() ? answer.trim().split(/\s+/).length : 0;
  const isTimeCritical = timeLeft <= 20;

  // Category badge styling
  const getCategoryBadge = (cat) => {
    if (cat === 'Behavioral') {
      return { label: '🤝 Behavioral (STAR)', style: { background: 'rgba(167, 139, 250, 0.15)', color: '#c4b5fd', border: '1px solid rgba(167, 139, 250, 0.3)' } };
    }
    if (cat === 'Resume-Gap') {
      return { label: '⚠️ Resume-Gap Question', style: { background: 'rgba(245, 158, 11, 0.15)', color: '#fde68a', border: '1px solid rgba(245, 158, 11, 0.35)' } };
    }
    return { label: '🛠️ Technical Deep-Dive', style: { background: 'rgba(56, 189, 248, 0.15)', color: '#7dd3fc', border: '1px solid rgba(56, 189, 248, 0.3)' } };
  };

  const catMeta = getCategoryBadge(currentQ.category);

  return (
    <div className="glass-card" style={{ maxWidth: 900, margin: '0 auto' }}>
      {/* Session Header */}
      <div className="session-header">
        <div>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            Question {currentIndex + 1} of {questions.length}
          </span>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>
            {targetCompany} · {currentRole} Mock Interview
          </h2>
        </div>

        {/* Timed Mock Countdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: isTimeCritical ? 'rgba(239, 68, 68, 0.2)' : '#111420',
            border: `1px solid ${isTimeCritical ? '#ef4444' : 'var(--border)'}`,
            padding: '6px 14px',
            borderRadius: 8,
            fontSize: '0.9rem',
            fontWeight: 700,
            color: isTimeCritical ? '#f87171' : 'var(--accent)',
            transition: 'all 0.3s'
          }}>
            <Clock size={16} />
            <span>Time Left: {formatCountdown(timeLeft)}</span>
            {isTimeCritical && <span style={{ fontSize: '0.72rem', color: '#fca5a5' }}>(Auto-skip)</span>}
          </div>

          <button
            className="btn-secondary"
            onClick={onCancelInterview}
            style={{ fontSize: '0.82rem', padding: '6px 12px' }}
          >
            Exit
          </button>
        </div>
      </div>

      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${progressPercent}%` }}></div>
      </div>

      {/* Question Card */}
      <div className="question-box">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
          <span style={{ ...catMeta.style, padding: '4px 12px', borderRadius: 6, fontSize: '0.8rem', fontWeight: 700 }}>
            {catMeta.label}
          </span>

          <button className="btn-secondary" onClick={handleSpeakQuestion} style={{ padding: '4px 10px', fontSize: '0.78rem' }}>
            <Volume2 size={14} /> Listen Question
          </button>
        </div>

        <div className="question-text">
          {currentQ.question}
        </div>

        {currentQ.resumeSource && (
          <div style={{ fontSize: '0.8rem', color: '#38bdf8', fontWeight: 600, marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <FileText size={13} /> Context from Resume / JD: {currentQ.resumeSource}
          </div>
        )}

        {currentQ.hint && (
          <div style={{ marginTop: 10 }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setShowHint(!showHint)}
              style={{ fontSize: '0.75rem', padding: '3px 8px', color: 'var(--warning)', borderColor: 'rgba(245, 158, 11, 0.3)' }}
            >
              <Lightbulb size={12} /> {showHint ? 'Hide Hint' : 'Need a Hint?'}
            </button>
            {showHint && (
              <div style={{
                background: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                borderRadius: 6,
                padding: '8px 12px',
                marginTop: 8,
                fontSize: '0.82rem',
                color: '#fde68a'
              }}>
                <strong>Hint:</strong> {currentQ.hint}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Answer Input Controls */}
      <div style={{ marginBottom: 20 }}>
        <div className="audio-controls">
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <button
              type="button"
              className={`record-btn ${isRecording ? 'recording' : ''}`}
              onClick={toggleRecording}
            >
              {isRecording ? <MicOff size={16} /> : <Mic size={16} />}
              {isRecording ? 'Listening (Click to Stop)' : 'Speak Your Answer (Mic)'}
            </button>

            {isRecording && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div className="equalizer">
                  <span className="equalizer-bar"></span>
                  <span className="equalizer-bar"></span>
                  <span className="equalizer-bar"></span>
                  <span className="equalizer-bar"></span>
                </div>
                <span style={{ fontSize: '0.82rem', color: '#f87171', fontWeight: 600 }}>
                  Audio Input Active
                </span>
              </div>
            )}
          </div>

          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Word Count: <strong>{wordCount}</strong>
          </div>
        </div>

        <textarea
          className="form-control answer-textarea"
          placeholder="Type or speak your answer here. If the countdown reaches 0:00, it will be auto-marked 'Skipped' and advance..."
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          disabled={evaluating}
        ></textarea>
      </div>

      {/* Action Row */}
      {!currentEvaluation ? (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={handleSkipQuestion}
            style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}
          >
            ⏭ Skip Question
          </button>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setAnswer('')}
              disabled={!answer || evaluating}
            >
              Clear Text
            </button>

            <button
              type="button"
              className="btn-primary"
              onClick={handleSubmitAnswer}
              disabled={!answer.trim() || evaluating}
              style={{ width: 'auto', padding: '12px 28px' }}
            >
              {evaluating ? 'Grading Answer...' : 'Submit & Grade Answer'}
            </button>
          </div>
        </div>
      ) : (
        /* Instant Feedback Card Matching Slide 03 Spec */
        <div style={{
          marginTop: 24,
          padding: 24,
          borderRadius: 'var(--radius-md)',
          background: '#0f121d',
          border: '1px solid var(--border)',
          animation: 'slideDown 0.3s ease'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
            {/* Answer strength % matching Slide 03 exact design */}
            <div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4 }}>
                Answer Strength: <strong style={{ color: '#fff', fontSize: '1.1rem' }}>{currentEvaluation.answerStrength || (currentEvaluation.score * 10)}%</strong>
              </div>
              <div style={{ width: 180, height: 6, background: '#1e2235', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{
                  width: `${currentEvaluation.answerStrength || (currentEvaluation.score * 10)}%`,
                  height: '100%',
                  background: (currentEvaluation.answerStrength || (currentEvaluation.score * 10)) >= 70 ? '#10b981' : '#f59e0b'
                }}></div>
              </div>
            </div>

            <button
              className="btn-primary"
              onClick={handleNext}
              style={{ width: 'auto', padding: '10px 24px' }}
            >
              {currentIndex + 1 < questions.length ? (
                <>Next Question <ArrowRight size={16} /></>
              ) : (
                <>Complete Interview & View Scorecard <CheckCircle2 size={16} /></>
              )}
            </button>
          </div>

          {/* Feedback & Notes on what was missing or vague */}
          <div style={{ background: '#111420', padding: 16, borderRadius: 8, marginBottom: 16, borderLeft: '4px solid var(--primary)' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', marginBottom: 4 }}>
              Feedback:
            </div>
            <p style={{ color: '#e2e8f0', fontSize: '0.95rem', lineHeight: 1.6 }}>
              {currentEvaluation.feedback}
            </p>
          </div>

          {currentEvaluation.missingPoints && (
            <div style={{ background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.25)', borderRadius: 8, padding: 14, marginBottom: 16 }}>
              <div style={{ color: '#fbbf24', fontSize: '0.82rem', fontWeight: 700, marginBottom: 4 }}>
                What was missing or vague:
              </div>
              <p style={{ fontSize: '0.88rem', color: '#fde68a' }}>
                {currentEvaluation.missingPoints}
              </p>
            </div>
          )}

          {/* Model Answer */}
          {currentEvaluation.modelAnswer && (
            <div>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowModelAnswer(!showModelAnswer)}
                style={{ width: '100%', justifyContent: 'space-between', padding: '10px 16px' }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--accent)' }}>
                  <Lightbulb size={16} /> View Recommended Model Answer
                </span>
                {showModelAnswer ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              {showModelAnswer && (
                <div style={{
                  background: '#131726',
                  padding: 16,
                  borderRadius: 8,
                  marginTop: 8,
                  fontSize: '0.9rem',
                  lineHeight: 1.6,
                  color: '#cbd5e1'
                }}>
                  {currentEvaluation.modelAnswer}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
