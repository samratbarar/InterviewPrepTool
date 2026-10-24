const { DatabaseSync } = require('node:sqlite');
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new DatabaseSync(dbPath);

db.exec('PRAGMA foreign_keys = ON;');

// Initialize Tables matching GL Bajaj MP-1 Specification
db.exec(`
  CREATE TABLE IF NOT EXISTS resumes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT,
    candidate_name TEXT,
    inferred_role TEXT,
    skills TEXT,
    projects TEXT,
    raw_content TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS interview_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    resume_id INTEGER,
    target_company TEXT DEFAULT 'General Tech',
    role TEXT,
    level TEXT,
    interview_type TEXT,
    job_description TEXT,
    time_limit_seconds INTEGER DEFAULT 120,
    total_questions INTEGER DEFAULT 0,
    overall_score REAL DEFAULT 0,
    answer_strength REAL DEFAULT 0,
    status TEXT DEFAULT 'in_progress',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(resume_id) REFERENCES resumes(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS session_questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER,
    question_order INTEGER,
    question TEXT,
    category TEXT, -- 'Technical' | 'Behavioral' | 'Resume-Gap'
    difficulty TEXT,
    resume_source TEXT,
    expected_points TEXT,
    hint TEXT,
    user_answer TEXT,
    is_skipped INTEGER DEFAULT 0,
    time_spent_seconds INTEGER DEFAULT 0,
    score REAL DEFAULT 0,
    answer_strength REAL DEFAULT 0,
    feedback TEXT,
    missing_points TEXT,
    model_answer TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(session_id) REFERENCES interview_sessions(id) ON DELETE CASCADE
  );
`);

// Safe migrations if tables were previously created without newer columns
const safeAlter = (sql) => {
  try {
    db.exec(sql);
  } catch (err) {
    // Ignore error if column already exists
  }
};

safeAlter("ALTER TABLE interview_sessions ADD COLUMN target_company TEXT DEFAULT 'General Tech';");
safeAlter("ALTER TABLE interview_sessions ADD COLUMN job_description TEXT;");
safeAlter("ALTER TABLE interview_sessions ADD COLUMN time_limit_seconds INTEGER DEFAULT 120;");
safeAlter("ALTER TABLE interview_sessions ADD COLUMN answer_strength REAL DEFAULT 0;");
safeAlter("ALTER TABLE session_questions ADD COLUMN category TEXT;");
safeAlter("ALTER TABLE session_questions ADD COLUMN is_skipped INTEGER DEFAULT 0;");
safeAlter("ALTER TABLE session_questions ADD COLUMN time_spent_seconds INTEGER DEFAULT 0;");
safeAlter("ALTER TABLE session_questions ADD COLUMN answer_strength REAL DEFAULT 0;");
safeAlter("ALTER TABLE session_questions ADD COLUMN missing_points TEXT;");
safeAlter("ALTER TABLE session_questions ADD COLUMN model_answer TEXT;");

console.log('✓ SQLite Database aligned with GL Bajaj BCC351 spec at:', dbPath);

const dbOps = {
  saveResume: ({ filename = 'resume.txt', candidateName = 'Candidate', inferredRole = 'Software Engineer', skills = [], projects = [], rawContent = '' }) => {
    const stmt = db.prepare(`
      INSERT INTO resumes (filename, candidate_name, inferred_role, skills, projects, raw_content)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(
      filename,
      candidateName,
      inferredRole,
      JSON.stringify(skills),
      JSON.stringify(projects),
      rawContent
    );
    return Number(info.lastInsertRowid);
  },

  createSession: ({ resumeId = null, targetCompany = 'Tech Company', role = 'Software Developer', level = 'Fresher', interviewType = 'Company & Role-Aware', jobDescription = '', timeLimitSeconds = 120, totalQuestions = 3 }) => {
    const stmt = db.prepare(`
      INSERT INTO interview_sessions (resume_id, target_company, role, level, interview_type, job_description, time_limit_seconds, total_questions, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'in_progress')
    `);
    const info = stmt.run(resumeId, targetCompany, role, level, interviewType, jobDescription, timeLimitSeconds, totalQuestions);
    return Number(info.lastInsertRowid);
  },

  addQuestionsToSession: (sessionId, questions) => {
    const stmt = db.prepare(`
      INSERT INTO session_questions (session_id, question_order, question, category, difficulty, resume_source, expected_points, hint)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertedIds = [];
    questions.forEach((q, idx) => {
      const info = stmt.run(
        sessionId,
        idx + 1,
        q.question,
        q.category || 'Technical',
        q.difficulty || 'Medium',
        q.resumeSource || q.category || 'Resume',
        JSON.stringify(q.expectedPoints || []),
        q.hint || ''
      );
      insertedIds.push(Number(info.lastInsertRowid));
    });

    return insertedIds;
  },

  recordAnswer: (questionId, { answer, isSkipped = 0, timeSpent = 0, overallScore = 0, answerStrength = 0, feedback = '', missingPoints = '', modelAnswer = '' }) => {
    const stmt = db.prepare(`
      UPDATE session_questions
      SET user_answer = ?, is_skipped = ?, time_spent_seconds = ?, score = ?, answer_strength = ?, feedback = ?, missing_points = ?, model_answer = ?
      WHERE id = ?
    `);
    stmt.run(answer, isSkipped ? 1 : 0, timeSpent, overallScore, answerStrength, feedback, missingPoints, modelAnswer, questionId);
  },

  completeSession: (sessionId, { overallScore, answerStrength }) => {
    const stmt = db.prepare(`
      UPDATE interview_sessions
      SET overall_score = ?, answer_strength = ?, status = 'completed'
      WHERE id = ?
    `);
    stmt.run(overallScore, answerStrength, sessionId);
  },

  getAllSessions: () => {
    const stmt = db.prepare(`
      SELECT s.*, r.filename as resume_filename, r.candidate_name
      FROM interview_sessions s
      LEFT JOIN resumes r ON s.resume_id = r.id
      ORDER BY s.created_at DESC
    `);
    return stmt.all();
  },

  getSessionDetails: (sessionId) => {
    const sessionStmt = db.prepare(`
      SELECT s.*, r.filename as resume_filename, r.candidate_name, r.skills as resume_skills, r.projects as resume_projects
      FROM interview_sessions s
      LEFT JOIN resumes r ON s.resume_id = r.id
      WHERE s.id = ?
    `);
    const session = sessionStmt.get(sessionId);
    if (!session) return null;

    const qStmt = db.prepare(`
      SELECT * FROM session_questions
      WHERE session_id = ?
      ORDER BY question_order ASC
    `);
    const questions = qStmt.all(Number(sessionId)).map(q => ({
      ...q,
      expected_points: JSON.parse(q.expected_points || '[]')
    }));

    return {
      ...session,
      resume_skills: JSON.parse(session.resume_skills || '[]'),
      resume_projects: JSON.parse(session.resume_projects || '[]'),
      questions
    };
  },

  // Highlight recurring weak topics across multiple practice attempts
  getWeakAreaAnalytics: () => {
    // Retrieve questions with scores below 7 or marked skipped
    const stmt = db.prepare(`
      SELECT category, question, score, answer_strength, feedback, missing_points, is_skipped
      FROM session_questions
      WHERE score < 7 OR is_skipped = 1
      ORDER BY score ASC
      LIMIT 20
    `);
    const rows = stmt.all();

    // Aggregate by category to return {topic, count, avgStrength}
    const map = {};
    rows.forEach(r => {
      const key = r.category || 'Technical';
      if (!map[key]) map[key] = { topic: key, count: 0, totalStrength: 0, questions: [] };
      map[key].count += 1;
      map[key].totalStrength += (r.answer_strength || 0);
      if (r.question) map[key].questions.push(r.question.slice(0, 80));
    });

    return Object.values(map)
      .sort((a, b) => b.count - a.count)
      .map(m => ({
        topic: m.topic,
        count: m.count,
        avgStrength: m.count > 0 ? Math.round(m.totalStrength / m.count) : 0,
        sampleQuestion: m.questions[0] || ''
      }));
  },

  deleteSession: (sessionId) => {
    const stmt = db.prepare('DELETE FROM interview_sessions WHERE id = ?');
    stmt.run(sessionId);
  },

  clearAllSessions: () => {
    db.exec('DELETE FROM session_questions;');
    db.exec('DELETE FROM interview_sessions;');
  }
};

module.exports = dbOps;
