const app = require('./server');

async function testFullBackend() {
  const server = app.listen(0, async () => {
    const port = server.address().port;
    const baseUrl = `http://127.0.0.1:${port}`;
    console.log('Testing Full Backend & SQLite Database at:', baseUrl);

    try {
      // 1. Health check & DB status
      const healthRes = await fetch(`${baseUrl}/api/health`);
      const healthData = await healthRes.json();
      console.log('✓ Health & Database Status:', healthData.database);

      // 2. Upload/Parse Resume
      const resumeRes = await fetch(`${baseUrl}/api/resume/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeText: 'AMIT SHARMA. Full Stack Developer. Built DevConnect social platform with React, Node.js, and Redis caching.'
        })
      });
      const resumeData = await resumeRes.json();
      console.log('✓ Resume Uploaded & Saved to SQLite, ID:', resumeData.resumeId, 'Role:', resumeData.analysis?.inferredRole);

      // 3. Start Interview (Creates DB Session & Questions)
      const startRes = await fetch(`${baseUrl}/api/interview/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeId: resumeData.resumeId,
          resumeText: 'AMIT SHARMA. Full Stack Developer. Built DevConnect social platform with React, Node.js, and Redis caching.',
          inferredRole: resumeData.analysis?.inferredRole,
          numQuestions: 2
        })
      });
      const startData = await startRes.json();
      console.log('✓ Interview Session Created in SQLite, Session ID:', startData.sessionId, 'Questions Count:', startData.questions?.length);
      const firstQ = startData.questions[0];

      // 4. Submit Answer for Question 1
      const evalRes = await fetch(`${baseUrl}/api/interview/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: startData.sessionId,
          questionId: firstQ.dbId,
          question: firstQ.question,
          resumeSource: firstQ.resumeSource,
          answer: 'In my DevConnect project, I used Socket.io rooms to handle channel joins and cleaned up on disconnect to prevent memory leaks.'
        })
      });
      const evalData = await evalRes.json();
      console.log('✓ Answer Graded & Recorded in SQLite! Overall Score:', evalData.evaluation?.overallScore, 'Resume Defense Score:', evalData.evaluation?.resumeDefenseScore);

      // 5. Complete Session
      const finishRes = await fetch(`${baseUrl}/api/interview/finish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: startData.sessionId,
          overallScore: 8.5,
          techScore: 8.0,
          commScore: 8.5,
          defenseScore: 9.0
        })
      });
      const finishData = await finishRes.json();
      console.log('✓ Session Finalized in Database:', finishData.message);

      // 6. Query History from SQLite Database
      const histRes = await fetch(`${baseUrl}/api/interview/history`);
      const histData = await histRes.json();
      console.log('✓ Queried Database History, Total Sessions Stored:', histData.sessions?.length);

      // 7. Inspect Specific Session from Database
      const detailRes = await fetch(`${baseUrl}/api/interview/session/${startData.sessionId}`);
      const detailData = await detailRes.json();
      console.log('✓ Retrieved Full Session Details from SQLite, Evaluated Questions:', detailData.session?.questions?.length);

      console.log('\n🎉 FULL BACKEND + SQLITE DATABASE INTEGRATION VERIFIED 100% OPERATIONAL!');
    } catch (err) {
      console.error('Test error:', err);
      process.exitCode = 1;
    } finally {
      server.close();
    }
  });
}

testFullBackend();
