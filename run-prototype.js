const { spawn } = require('child_process');
const path = require('path');

console.log('====================================================');
console.log('🚀 Launching AI Interview Preparation Tool (Prototype 1)');
console.log('====================================================\n');

// Start Backend
console.log('📦 Starting Backend API Server on http://localhost:5000 ...');
const backend = spawn('node', ['server.js'], {
  cwd: path.join(__dirname, 'backend'),
  stdio: 'inherit',
  shell: true
});

backend.on('error', (err) => {
  console.error('❌ Failed to start backend:', err);
});

// Start Frontend
console.log('🎨 Starting Frontend Vite App on http://localhost:5173 ...');
const frontend = spawn('npm.cmd', ['run', 'dev', '--', '--host'], {
  cwd: path.join(__dirname, 'frontend'),
  stdio: 'inherit',
  shell: true
});

frontend.on('error', (err) => {
  console.error('❌ Failed to start frontend:', err);
});

process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down Prototype 1 servers...');
  backend.kill();
  frontend.kill();
  process.exit();
});
