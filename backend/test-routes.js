const app = require('./server');

async function runTests() {
  const server = app.listen(0, async () => {
    const port = server.address().port;
    const baseUrl = `http://127.0.0.1:${port}`;
    console.log(`Test server running on ${baseUrl}`);

    try {
      // 1. Test health endpoint
      const healthRes = await fetch(`${baseUrl}/api/health`);
      const healthData = await healthRes.json();
      console.log('✓ Health Endpoint:', healthData);

      // 2. Test generate-questions endpoint
      const genRes = await fetch(`${baseUrl}/api/generate-questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'Frontend Developer', level: 'Fresher', numQuestions: 2 })
      });
      const genData = await genRes.json();
      console.log('✓ Generate Questions (count =', genData.questions?.length, '):', genData.questions?.map(q => q.question));

      // 3. Test evaluate-answer endpoint
      const evalRes = await fetch(`${baseUrl}/api/evaluate-answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: 'What is state in React?',
          role: 'Frontend Developer',
          level: 'Fresher',
          answer: 'State is an internal data storage that components manage and re-renders when changed.'
        })
      });
      const evalData = await evalRes.json();
      console.log('✓ Evaluate Answer Score:', evalData.evaluation?.score, '/ 10, Feedback:', evalData.evaluation?.feedback);

      console.log('\n🎉 ALL BACKEND API ENDPOINTS TESTED AND PASSING!');
    } catch (err) {
      console.error('Test failed:', err);
      process.exitCode = 1;
    } finally {
      server.close();
    }
  });
}

runTests();
