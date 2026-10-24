import React, { useState } from 'react';
import {
  FileText, Upload, Sparkles, ArrowRight, Building, Briefcase,
  Clock, Zap, CheckCircle2, ShieldAlert
} from 'lucide-react';

const SAMPLE_RESUMES = {
  fullstack: {
    title: 'Full Stack MERN Developer',
    company: 'Amazon / Tech Startup',
    role: 'Full Stack Developer',
    jd: `Required Qualifications:
- 0-2 years experience with React.js, Node.js, Express, and MongoDB.
- Experience with real-time systems (WebSockets / Socket.io) and Redis caching.
- Familiarity with Docker containerization and Microservices is a strong plus.`,
    text: `AMIT SHARMA
B.Tech Computer Science & Engineering | CGPA: 8.4/10

TECHNICAL SKILLS:
- Languages: JavaScript (ES6+), TypeScript, Java, HTML5, CSS3
- Frontend: React.js, Redux Toolkit, Next.js, Tailwind CSS
- Backend: Node.js, Express.js, RESTful APIs, JWT Authentication
- Databases: MongoDB, PostgreSQL, Redis Caching
- Tools: Git, Docker, Postman

PROJECTS:
1. DevConnect - Developer Social Network & Code Collaboration Platform
- Built full-stack platform with real-time chat using Socket.io and stored chat histories in MongoDB with indexing.
- Implemented secure JWT authentication and password hashing with bcrypt.
- Reduced API response times by 35% through Redis caching on popular developer feeds.

2. ShopEasy - E-Commerce Web Application
- Developed responsive shopping application with product catalogs, shopping cart, and order management.
- Integrated Stripe Payment Gateway in test mode for secure credit card checkout.
- Implemented Redux Toolkit for centralized client-side state management across product filters and carts.`
  },

  datascience: {
    title: 'Data Science & Python Engineer',
    company: 'Google / AI Analytics Firm',
    role: 'Data Scientist / ML Engineer',
    jd: `Required Qualifications:
- Proficiency in Python, Pandas, NumPy, Scikit-learn, and SQL.
- Strong practical knowledge of classification algorithms, hyperparameter tuning, and class imbalance (SMOTE).
- Experience deploying predictive machine learning APIs using FastAPI and Docker.`,
    text: `PRIYA VERMA
B.Tech Data Science & AI | CGPA: 8.7/10

TECHNICAL SKILLS:
- Languages: Python, SQL, R
- ML/AI: Scikit-learn, TensorFlow, Keras, NumPy, Pandas, Matplotlib
- Databases: PostgreSQL, BigQuery, MySQL
- Tools: Jupyter Notebook, Tableau, Docker, FastAPI

PROJECTS:
1. Customer Churn Prediction Engine
- Developed classification pipeline using Scikit-Learn to predict telecom subscriber churn with 88% accuracy.
- Handled class imbalance using SMOTE and tuned hyperparameters via GridSearchCV across Random Forest and XGBoost.
- Deployed prediction API using FastAPI with Docker containerization.

2. Real Estate Price Estimator
- Collected and preprocessed 20,000+ housing records using Pandas and BeautifulSoup.
- Engineered custom features and built Gradient Boosting regression model for accurate price estimation.`
  }
};

export default function InterviewSetup({ onStartInterview, isLoading }) {
  const [resumeText, setResumeText] = useState(SAMPLE_RESUMES.fullstack.text);
  const [targetCompany, setTargetCompany] = useState(SAMPLE_RESUMES.fullstack.company);
  const [role, setRole] = useState(SAMPLE_RESUMES.fullstack.role);
  const [jobDescription, setJobDescription] = useState(SAMPLE_RESUMES.fullstack.jd);
  const [timeLimitSeconds, setTimeLimitSeconds] = useState(90);
  const [numQuestions, setNumQuestions] = useState(3);
  const [activeSample, setActiveSample] = useState('fullstack');

  const handleSelectSample = (key) => {
    setActiveSample(key);
    const sample = SAMPLE_RESUMES[key];
    setResumeText(sample.text);
    setTargetCompany(sample.company);
    setRole(sample.role);
    setJobDescription(sample.jd);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === 'string') {
        setResumeText(content);
        setActiveSample('custom');
      }
    };
    reader.readAsText(file);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!resumeText.trim()) {
      alert('Please upload or paste your resume content.');
      return;
    }
    onStartInterview({
      resumeText: resumeText.trim(),
      targetCompany: targetCompany.trim() || 'General Tech',
      role: role.trim() || 'Software Engineer',
      jobDescription: jobDescription.trim(),
      timeLimitSeconds: Number(timeLimitSeconds) || 90,
      numQuestions: Number(numQuestions) || 3
    });
  };

  return (
    <div className="glass-card" style={{ maxWidth: 920, margin: '0 auto' }}>
      {/* College Project Header Tag */}
      <div style={{
        background: 'rgba(99, 102, 241, 0.1)',
        border: '1px solid rgba(99, 102, 241, 0.3)',
        borderRadius: 12,
        padding: '12px 18px',
        marginBottom: 24,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 10
      }}>
        <div>
          <span style={{ fontSize: '0.78rem', color: '#a5b4fc', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            BCC351 · MINI PROJECT-I (MP-1)
          </span>
          <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#fff' }}>
            GL Bajaj Institute of Technology & Management · CSE (Data Science)
          </div>
        </div>
        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'right' }}>
          Team: <strong>Samrat Barar, Rishabh Thakur, Samir Kumar, Samriddhi Sarva</strong><br />
          Guide: <strong>Shameem Khan</strong>
        </div>
      </div>

      <div className="setup-header" style={{ marginBottom: 28 }}>
        <h1>Upload Your Resume. Practice the Right Questions.</h1>
        <p>
          Blends your resume with your target company and job description. Generates <strong>Technical</strong>, <strong>Behavioral</strong>, and <strong>Resume-Gap</strong> questions with timed mock simulation and auto-timeout.
        </p>
      </div>

      {/* 1-Click Samples */}
      <div style={{ marginBottom: 24 }}>
        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Zap size={14} color="var(--warning)" /> Try a 1-Click Sample Profile:
        </span>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {Object.entries(SAMPLE_RESUMES).map(([key, sample]) => (
            <button
              key={key}
              type="button"
              className={`chip ${activeSample === key ? 'selected' : ''}`}
              onClick={() => handleSelectSample(key)}
              style={{ padding: '8px 16px', fontSize: '0.85rem' }}
            >
              📄 {sample.title} ({sample.company})
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Step 1: Resume Upload / Input */}
        <div className="form-group" style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <FileText size={16} color="var(--primary)" /> Step 1: Candidate Resume (Skills & Projects)
            </label>
            <label className="btn-secondary" style={{ padding: '4px 12px', fontSize: '0.8rem', cursor: 'pointer' }}>
              <Upload size={14} /> Upload Resume File (.txt/.md)
              <input type="file" accept=".txt,.md,.doc,.json" onChange={handleFileUpload} style={{ display: 'none' }} />
            </label>
          </div>
          <textarea
            className="form-control"
            rows="7"
            placeholder="Paste your complete resume text here..."
            value={resumeText}
            onChange={(e) => {
              setResumeText(e.target.value);
              setActiveSample('custom');
            }}
            style={{ fontFamily: 'var(--font-mono)', fontSize: '0.88rem' }}
            required
          ></textarea>
        </div>

        {/* Step 2: Target Company & Job Description */}
        <div className="form-grid" style={{ marginBottom: 20 }}>
          <div className="form-group">
            <label htmlFor="companyInput">
              <Building size={16} color="var(--accent)" /> Target Company
            </label>
            <input
              id="companyInput"
              type="text"
              className="form-control"
              placeholder="e.g. Amazon, Google, TCS, Infosys, Startup"
              value={targetCompany}
              onChange={(e) => setTargetCompany(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="roleInput">
              <Briefcase size={16} color="var(--primary)" /> Target Job Role
            </label>
            <input
              id="roleInput"
              type="text"
              className="form-control"
              placeholder="e.g. Full Stack Developer, Data Scientist"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="form-group" style={{ marginBottom: 20 }}>
          <label htmlFor="jdInput">
            Step 2: Target Job Description (Optional - For Resume-Gap Analysis)
          </label>
          <textarea
            id="jdInput"
            className="form-control"
            rows="3"
            placeholder="Paste the target job description to generate questions on missing or required skills..."
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            style={{ fontSize: '0.88rem' }}
          ></textarea>
        </div>

        {/* Step 3: Timed Mock Simulation Config */}
        <div className="form-grid" style={{ marginBottom: 28 }}>
          <div className="form-group">
            <label htmlFor="timeLimitSelect">
              <Clock size={16} color="var(--warning)" /> Time Limit per Question (Auto-skip on timeout)
            </label>
            <select
              id="timeLimitSelect"
              className="form-control"
              value={timeLimitSeconds}
              onChange={(e) => setTimeLimitSeconds(Number(e.target.value))}
            >
              <option value={60}>60 Seconds (Rapid Fire)</option>
              <option value={90}>90 Seconds (Standard Placement Pace)</option>
              <option value={120}>120 Seconds (2 Minutes - Relaxed)</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="numQuestionsSelect">
              Number of Questions
            </label>
            <select
              id="numQuestionsSelect"
              className="form-control"
              value={numQuestions}
              onChange={(e) => setNumQuestions(Number(e.target.value))}
            >
              <option value={3}>3 Questions (Technical, Behavioral, Resume-Gap)</option>
              <option value={5}>5 Questions (Comprehensive Mock)</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          className="btn-primary"
          disabled={isLoading || !resumeText.trim()}
          style={{ height: 56 }}
        >
          {isLoading ? (
            <>
              <div className="spinner" style={{
                width: 18,
                height: 18,
                border: '2px solid rgba(255,255,255,0.3)',
                borderTopColor: '#fff',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite'
              }}></div>
              Formulating Company-Fit & Resume-Gap Questions...
            </>
          ) : (
            <>
              Start Timed Mock Interview Session <ArrowRight size={18} />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
