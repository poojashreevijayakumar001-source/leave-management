// Run with: npm test   (start the server first: npm run dev). Needs Node 18+
const BASE = process.env.API_URL || 'http://localhost:5000/api'
const email = `test${Date.now()}@mail.com`

async function call(path, method = 'GET', body, token) {
  const r = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
    body: body ? JSON.stringify(body) : undefined,
  })
  return { status: r.status, data: await r.json() }
}
const check = (name, ok) => { console.log(ok ? 'PASS' : 'FAIL', '-', name); if (!ok) process.exitCode = 1 }

let r = await call('/health'); check('health', r.status === 200)
r = await call('/auth/register', 'POST', { name: 'Test', email, password: '123456' }); check('register', r.status === 201)
r = await call('/auth/login', 'POST', { email, password: '123456' }); check('login', r.status === 200)
const token = r.data.token
r = await call('/leaves/my'); check('blocked without token', r.status === 401)
r = await call('/leaves', 'POST', { type: 'Casual', fromDate: '2026-12-01', toDate: '2026-12-02', reason: 'Test' }, token); check('apply leave', r.status === 201)
r = await call('/leaves/my', 'GET', null, token); check('my leaves', r.data.length === 1)
r = await call('/leaves', 'GET', null, token); check('employee cannot see all', r.status === 403)
