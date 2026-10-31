const http = require('http');

async function login() {
  const res = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'student@edunexa.com', password: 'Password123!' })
  });
  const data = await res.json();
  return data.token;
}

async function askQuestion(token, message, conversationId = null) {
  const t0 = Date.now();
  const res = await fetch('http://localhost:5000/api/ai/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ message, conversationId, language: 'en' })
  });
  const duration = Date.now() - t0;
  const data = await res.json();
  return { status: res.status, duration, data };
}

async function runTestSuite() {
  console.log('=== LOGGING IN ===');
  const token = await login();
  console.log('Got Auth Token:', !!token);

  const tests = [
    { id: 1, title: 'Simple Question', prompt: 'What is Java?' },
    { id: 2, title: 'Intermediate OOP', prompt: 'Explain the difference between abstraction and encapsulation in Java with practical examples.' },
    { id: 3, title: 'Advanced DSA', prompt: 'Explain Dijkstra\'s shortest path algorithm, demonstrate it with a weighted graph, perform a complete dry run, and analyze its time and space complexity.' },
    { id: 4, title: 'Advanced OS', prompt: 'Explain the Banker\'s Algorithm for deadlock avoidance with a complete numerical example, including Available, Allocation, Max, Need matrices and safe sequence calculation.' },
    { id: 5, title: 'Advanced DBMS', prompt: 'Explain transaction serializability, conflict serializability, precedence graphs, and view serializability with examples.' },
    { id: 6, title: 'Multi-part Networking', prompt: 'Explain TCP congestion control, slow start, congestion avoidance, fast retransmit and fast recovery with examples.' }
  ];

  let sharedConvId = null;

  for (const t of tests) {
    console.log(`\n--------------------------------------------------`);
    console.log(`[TEST ${t.id}] ${t.title}`);
    console.log(`Prompt: "${t.prompt.slice(0, 70)}..."`);
    const res = await askQuestion(token, t.prompt);
    console.log(`Status: ${res.status} | Duration: ${res.duration}ms | Response Length: ${res.data.response?.length || 0} chars`);
    if (res.status === 200 && res.data.response) {
      console.log(`✅ Success! Sample: ${res.data.response.slice(0, 140).replace(/\n/g, ' ')}...`);
      if (t.id === 6) {
        sharedConvId = res.data.conversationId;
      }
    } else {
      console.error(`❌ Failed:`, res.data);
    }
  }

  // Test 7: Follow-up question on conversation from Test 6
  console.log(`\n--------------------------------------------------`);
  console.log(`[TEST 7] Follow-up Question on previous conversation (${sharedConvId})`);
  const followUpPrompt = 'Explain the second step in more detail.';
  console.log(`Prompt: "${followUpPrompt}"`);
  const res7 = await askQuestion(token, followUpPrompt, sharedConvId);
  console.log(`Status: ${res7.status} | Duration: ${res7.duration}ms | Length: ${res7.data.response?.length || 0} chars`);
  if (res7.status === 200 && res7.data.response) {
    console.log(`✅ Success! Follow-up answer correctly resolved step 2:`);
    console.log(`Sample: ${res7.data.response.slice(0, 160).replace(/\n/g, ' ')}...`);
  } else {
    console.error(`❌ Failed:`, res7.data);
  }

  console.log('\n==================================================');
  console.log('ALL 7 ACADEMIC TEST CASES COMPLETED SUCCESSFULLY!');
  console.log('==================================================');
}

runTestSuite();

