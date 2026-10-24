const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const db = require('./database');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '20mb' }));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

function getApiKey(req) {
  return (
    req.headers['x-gemini-api-key'] ||
    process.env.GEMINI_API_KEY ||
    ''
  ).trim();
}

// Course Project Metadata (GL Bajaj Institute of Technology & Management)
const PROJECT_META = {
  courseCode: "BCC351",
  courseTitle: "Mini Project-I (MP-1)",
  institution: "GL Bajaj Institute of Technology & Management, Greater Noida",
  department: "Department of Computer Science & Engineering (Data Science)",
  submittedBy: [
    { name: "Samrat Barar" },
    { name: "Rishabh Thakur" },
    { name: "Samir Kumar" },
    { name: "Samriddhi Sarva" }
  ],
  submittedTo: "Shameem Khan"
};

const SAMPLE_RESUMES = {
  fullstack: {
    title: 'Full Stack MERN Developer',
    role: 'Full Stack Developer',
    targetCompany: 'Amazon / Tech Startup',
    jd: `Required Qualifications:
- 0-2 years experience with React.js, Node.js, Express, and MongoDB.
- Experience with real-time systems (WebSockets / Socket.io) and Redis caching.
- Familiarity with CI/CD, Docker, and Microservices is a strong plus.`,
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
    role: 'Data Scientist / ML Engineer',
    targetCompany: 'Google / Data Analytics Firm',
    jd: `Required Qualifications:
- Proficiency in Python, Pandas, NumPy, Scikit-learn, and SQL.
- Strong practical knowledge of classification algorithms, hyperparameter tuning, and class imbalance (SMOTE).
- Experience building predictive APIs with FastAPI / Docker.`,
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

// Call Gemini API
async function callGemini(apiKey, prompt, systemInstruction = '') {
  const models = ['gemini-2.5-flash', 'gemini-1.5-flash'];
  let lastError = null;

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const payload = {
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.65
        }
      };

      if (systemInstruction) {
        payload.systemInstruction = { parts: [{ text: systemInstruction }] };
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Gemini API [${model}] status ${response.status}: ${errorBody}`);
      }

      const data = await response.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) throw new Error('Empty response from Gemini API');

      return JSON.parse(rawText);
    } catch (err) {
      lastError = err;
      console.warn(`Attempt with ${model} failed:`, err.message);
    }
  }
  throw lastError;
}

// 1. Health & Meta
app.get('/api/health', (req, res) => {
  const apiKey = getApiKey(req);
  res.json({
    status: 'online',
    database: 'SQLite (database.sqlite active)',
    project: PROJECT_META,
    hasApiKey: Boolean(apiKey),
    mode: apiKey ? 'AI (Gemini 2.5 Flash Resume Engine)' : 'Demo Simulation Mode (Add Key for Live AI)'
  });
});

app.get('/api/sample-resumes', (req, res) => {
  res.json({ success: true, samples: SAMPLE_RESUMES });
});

app.get('/api/project-info', (req, res) => {
  res.json({ success: true, meta: PROJECT_META });
});

// 2. Upload & Parse Resume
app.post('/api/resume/upload', upload.single('resumeFile'), async (req, res) => {
  try {
    let resumeText = req.body.resumeText || '';
    let filename = 'pasted_resume.txt';

    if (req.file) {
      filename = req.file.originalname;
      if (req.file.mimetype === 'application/pdf' || filename.toLowerCase().endsWith('.pdf')) {
        const parsed = await pdfParse(req.file.buffer);
        resumeText = parsed.text;
      } else {
        resumeText = req.file.buffer.toString('utf8');
      }
    }

    if (!resumeText || resumeText.trim().length < 20) {
      return res.status(400).json({ success: false, error: 'Resume content is empty or invalid.' });
    }

    const apiKey = getApiKey(req);
    let analysis = null;

    if (apiKey) {
      const systemPrompt = `You are a Technical Recruiter analyzing a candidate's resume for BCC351 Mini Project placement prep.
Extract the candidate name, inferred role, technical skills, projects, and key technical gaps.
Return pure valid JSON:
{
  "candidateName": "string",
  "inferredRole": "string",
  "experienceLevel": "Fresher" | "Junior (1-2 yrs)" | "Mid-Level",
  "skills": ["string", "string"],
  "projects": ["string", "string"],
  "summary": "string"
}`;
      analysis = await callGemini(apiKey, `Resume:\n${resumeText.slice(0, 5000)}`, systemPrompt);
    } else {
      const text = resumeText.toLowerCase();
      const detectedSkills = [];
      ['React', 'Node.js', 'Express', 'JavaScript', 'TypeScript', 'Python', 'Java', 'Spring Boot', 'MongoDB', 'PostgreSQL', 'SQL', 'Docker', 'Redis', 'Kafka'].forEach(s => {
        if (text.includes(s.toLowerCase())) detectedSkills.push(s);
      });

      const lines = resumeText.split('\n');
      const detectedProjects = [];
      lines.forEach(l => {
        if (l.match(/^\d+\.|\bproject\b/i) && l.length > 5 && l.length < 80) {
          detectedProjects.push(l.replace(/^\d+\.\s*/, '').trim());
        }
      });
      if (detectedProjects.length === 0) detectedProjects.push('Full Stack Implementation Project');

      analysis = {
        candidateName: lines[0]?.slice(0, 40) || 'Candidate',
        inferredRole: detectedSkills.includes('Python') ? 'Data Scientist / Python Engineer' : 'Full Stack Web Developer',
        experienceLevel: 'Fresher (B.Tech Final/3rd Year)',
        skills: detectedSkills.slice(0, 8),
        projects: detectedProjects.slice(0, 3),
        summary: 'Resume parsed and stored in database. Ready for company-fit and resume-gap question generation.'
      };
    }

    const resumeId = db.saveResume({
      filename,
      candidateName: analysis.candidateName || 'Candidate',
      inferredRole: analysis.inferredRole || 'Software Engineer',
      skills: analysis.skills || [],
      projects: analysis.projects || [],
      rawContent: resumeText
    });

    res.json({
      success: true,
      resumeId,
      filename,
      analysis,
      rawText: resumeText
    });
  } catch (err) {
    console.error('Error uploading/parsing resume:', err);
    res.status(500).json({ success: false, error: err.message || 'Failed to parse resume' });
  }
});

// 3. Start Timed Mock Interview & Generate Categorized Questions (Technical, Behavioral, Resume-Gap)
app.post('/api/interview/start', async (req, res) => {
  try {
    const {
      resumeId = null,
      resumeText = '',
      targetCompany = 'Tech Company',
      role = 'Software Developer',
      level = 'Fresher',
      jobDescription = '',
      timeLimitSeconds = 120, // default 2 minutes per question
      numQuestions = 3
    } = req.body;

    const apiKey = getApiKey(req);
    let questions = [];

    if (apiKey && resumeText) {
      const systemPrompt = `You are a Senior Engineering Hiring Manager at ${targetCompany}.
Generate calibrated interview questions based on the candidate's resume and target job description.
Group questions into exactly these 3 categories:
1. 'Technical': Testing skills/tools listed on their resume required for the role.
2. 'Behavioral': STAR method probing past team conflict, ownership, or deadlines in their listed projects.
3. 'Resume-Gap': Probing requirements from the Job Description that appear missing, weak, or untested on their resume!

Return pure valid JSON matching this schema:
{
  "questions": [
    {
      "question": "string",
      "category": "Technical" | "Behavioral" | "Resume-Gap",
      "difficulty": "Easy" | "Medium" | "Hard",
      "resumeSource": "string (the specific project or claimed skill)",
      "expectedPoints": ["string", "string"],
      "hint": "string (encouraging tip)"
    }
  ]
}`;
      const userPrompt = `Target Company: ${targetCompany}
Target Role: ${role}
Candidate Level: ${level}
Job Description Requirements:
${jobDescription || 'Standard software engineering requirements'}

Candidate Resume:
${resumeText.slice(0, 4500)}

Generate exactly ${numQuestions} questions covering Technical, Behavioral, and Resume-Gap!`;

      const result = await callGemini(apiKey, userPrompt, systemPrompt);
      questions = result.questions || [];
    } else {
      // High-quality categorized fallback questions according to GL Bajaj spec
      questions = [
        {
          question: "You listed React on your resume — walk me through how you managed state in your last project and how you minimized unnecessary re-renders.",
          category: "Technical",
          difficulty: "Medium",
          resumeSource: "Resume Skill: React.js & Redux Toolkit",
          expectedPoints: ["Centralized store vs component state", "Using memoized selectors (reselect) to avoid re-renders", "Immutability principles"],
          hint: "Contrast local state with Redux / Context and mention React.memo or useMemo."
        },
        {
          question: "Describe a situation in your DevConnect project where a critical feature broke or team members disagreed on technical direction. How did you resolve it?",
          category: "Behavioral",
          difficulty: "Medium",
          resumeSource: "Resume Project: DevConnect Platform",
          expectedPoints: ["STAR method framework (Situation, Task, Action, Result)", "Constructive discussion based on trade-offs", "Concrete measurable outcome"],
          hint: "Structure your response as: Situation -> Task -> Action you took -> Measurable Result."
        },
        {
          question: `The job description for ${targetCompany} emphasizes Docker and Microservices, but your resume highlights monolithic full-stack projects. How would you containerize your current application for production deployment?`,
          category: "Resume-Gap",
          difficulty: "Hard",
          resumeSource: "Resume Gap: Docker & Production Deployment",
          expectedPoints: ["Writing multi-stage Dockerfiles to minimize image size", "Configuring docker-compose for service orchestration", "Environment variable separation and volume persistence"],
          hint: "Explain how multi-stage Docker builds reduce image bloat and keep credentials secure."
        }
      ];
    }

    const selectedQuestions = questions.slice(0, Number(numQuestions) || 3);

    // Save to SQLite Database
    const sessionId = db.createSession({
      resumeId,
      targetCompany,
      role,
      level,
      interviewType: 'Company & Role-Aware Mock',
      jobDescription,
      timeLimitSeconds: Number(timeLimitSeconds) || 120,
      totalQuestions: selectedQuestions.length
    });

    const questionIds = db.addQuestionsToSession(sessionId, selectedQuestions);

    const formattedQuestions = selectedQuestions.map((q, idx) => ({
      ...q,
      dbId: questionIds[idx],
      id: idx + 1
    }));

    res.json({
      success: true,
      sessionId,
      targetCompany,
      timeLimitSeconds: Number(timeLimitSeconds) || 120,
      questions: formattedQuestions
    });
  } catch (err) {
    console.error('Error starting interview session:', err);
    res.status(500).json({ success: false, error: err.message || 'Failed to start interview' });
  }
});

// 4. Submit Answer & Grade with Answer Strength % (Slide 03 spec)
app.post('/api/interview/evaluate', async (req, res) => {
  try {
    const { questionId, sessionId, question, category = 'Technical', resumeSource = '', answer = '', isSkipped = false, timeSpent = 0 } = req.body;
    const apiKey = getApiKey(req);
    let evaluation = null;

    if (isSkipped || !answer || answer.trim().length === 0) {
      evaluation = {
        overallScore: 0,
        answerStrength: 0,
        score: 0,
        feedback: "Question was timed out or skipped. In a live interview, not attempting a question scores 0.",
        missingPoints: "Candidate did not provide an answer before the timer expired.",
        modelAnswer: "A solid answer begins with a concise definition, explains the underlying mechanism, and concludes with a quantifiable project outcome."
      };
    } else if (apiKey) {
      const systemPrompt = `You are an Interview Evaluator for BCC351 Mini Project placement prep.
Evaluate the candidate's typed answer honestly and constructively.
Return pure valid JSON matching this schema:
{
  "overallScore": number, // integer 1-10
  "answerStrength": number, // integer 0 to 100 percentage
  "feedback": "string (e.g. 'Good technical detail — add a specific outcome or metric to strengthen this answer.')",
  "missingPoints": "string detailing what was missing or vague",
  "modelAnswer": "string presenting a high-scoring, concise, well-structured answer"
}`;
      const userPrompt = `Question: "${question}"
Category: "${category}"
Resume Context Tested: "${resumeSource}"
Candidate Answer: "${answer}"`;

      evaluation = await callGemini(apiKey, userPrompt, systemPrompt);
      evaluation.score = evaluation.overallScore || 7;
    } else {
      const wordCount = answer.trim().split(/\s+/).length;
      let strength = 74;
      let score = 7;

      if (wordCount > 70) { strength = 88; score = 9; }
      else if (wordCount > 40) { strength = 78; score = 8; }
      else if (wordCount > 20) { strength = 68; score = 6; }
      else { strength = 45; score = 4; }

      evaluation = {
        overallScore: score,
        answerStrength: strength,
        score,
        feedback: "Good technical detail — add a specific outcome or metric to strengthen this answer.",
        missingPoints: wordCount < 35 ? "Answer was somewhat brief; missing specific architectural trade-offs or production metrics." : "Mention edge cases and failure modes in high-traffic production.",
        modelAnswer: `For '${question}', an ideal answer directly defines the concept, details your exact project implementation, and mentions measurable metrics or trade-offs.`
      };
    }

    if (questionId) {
      db.recordAnswer(questionId, {
        answer,
        isSkipped: isSkipped ? 1 : 0,
        timeSpent,
        overallScore: evaluation.overallScore || evaluation.score,
        answerStrength: evaluation.answerStrength || (evaluation.score * 10),
        feedback: evaluation.feedback,
        missingPoints: evaluation.missingPoints || '',
        modelAnswer: evaluation.modelAnswer
      });
    }

    res.json({ success: true, evaluation });
  } catch (err) {
    console.error('Error evaluating answer:', err);
    res.status(500).json({ success: false, error: err.message || 'Failed to evaluate answer' });
  }
});

// 5. Complete Session & Finalize Scores in SQLite
app.post('/api/interview/finish', (req, res) => {
  try {
    const { sessionId, overallScore, answerStrength } = req.body;
    if (sessionId) {
      db.completeSession(sessionId, {
        overallScore: Number(overallScore) || 0,
        answerStrength: Number(answerStrength) || 0
      });
    }
    res.json({ success: true, message: 'Session completed and stored in SQLite database.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. History & Weak Area Analytics
app.get('/api/interview/history', (req, res) => {
  try {
    const sessions = db.getAllSessions();
    res.json({ success: true, sessions });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/interview/session/:id', (req, res) => {
  try {
    const details = db.getSessionDetails(req.params.id);
    if (!details) return res.status(404).json({ success: false, error: 'Session not found' });
    res.json({ success: true, session: details });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/interview/analytics/weak-areas', (req, res) => {
  try {
    const weakAreas = db.getWeakAreaAnalytics();
    res.json({ success: true, weakAreas });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/interview/session/:id', (req, res) => {
  try {
    db.deleteSession(req.params.id);
    res.json({ success: true, message: 'Session deleted from SQLite database.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/interview/history', (req, res) => {
  try {
    db.clearAllSessions();
    res.json({ success: true, message: 'Database history cleared.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`GL Bajaj BCC351 AI Interview Backend running on http://localhost:${PORT}`);
  });
}

module.exports = app;
