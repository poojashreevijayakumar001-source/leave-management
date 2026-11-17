import { useEffect, useState } from 'react'
import { api } from './api.js'

const TYPES = ['Casual', 'Sick', 'Earned', 'Maternity/Paternity', 'Other']

function Auth({ onLogin }) {
  const [mode, setMode] = useState('login')
  const [f, setF] = useState({ name: '', email: '', password: '', role: 'employee' })
  const [err, setErr] = useState('')
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  async function submit(e) {
    e.preventDefault()
    setErr('')
    try {
      const data = await api(`/auth/${mode}`, { method: 'POST', body: f })
      onLogin(data)
    } catch (x) { setErr(x.message) }
  }

  return (
    <div className="auth">
      <form className="card" onSubmit={submit}>
        <h1>LeaveDesk</h1>
        <p className="muted">{mode === 'login' ? 'Sign in to manage your leaves' : 'Create your account'}</p>
        {mode === 'register' && <input placeholder="Full name" value={f.name} onChange={set('name')} required />}
        <input type="email" placeholder="Email" value={f.email} onChange={set('email')} required />
        <input type="password" placeholder="Password" value={f.password} onChange={set('password')} required minLength={6} />
        {mode === 'register' && (
          <select value={f.role} onChange={set('role')}>
            <option value="employee">Employee</option>
            <option value="manager">Manager</option>
          </select>
        )}
        {err && <div className="err">{err}</div>}
        <button className="btn">{mode === 'login' ? 'Login' : 'Register'}</button>
        <a className="link" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
          {mode === 'login' ? 'New here? Register' : 'Have an account? Login'}
        </a>
      </form>
    </div>
  )
}

function Dashboard({ user, token, onLogout }) {
  const isManager = user.role === 'manager'
  const [leaves, setLeaves] = useState([])
  const [form, setForm] = useState({ type: TYPES[0], fromDate: '', toDate: '', reason: '' })
  const [msg, setMsg] = useState('')

  const load = () =>
    api(isManager ? '/leaves' : '/leaves/my', { token }).then(setLeaves).catch((e) => setMsg(e.message))
  useEffect(() => { load() }, [])

  async function apply(e) {
    e.preventDefault()
    setMsg('')
    try {
      await api('/leaves', { method: 'POST', body: form, token })
      setForm({ type: TYPES[0], fromDate: '', toDate: '', reason: '' })
      load()
    } catch (x) { setMsg(x.message) }
  }
  async function decide(id, status) {
    await api(`/leaves/${id}`, { method: 'PATCH', body: { status }, token })
    load()
  }

  const count = (s) => leaves.filter((l) => l.status === s).length

  return (
    <div className="wrap">
      <header>
        <h1>LeaveDesk</h1>
        <div>
          <span className="muted">{user.name} · {user.role}</span>
          <button className="btn ghost" onClick={onLogout}>Logout</button>
        </div>
      </header>

      <div className="stats">
        <div className="stat"><b>{count('Pending')}</b>Pending</div>
        <div className="stat ok"><b>{count('Approved')}</b>Approved</div>
        <div className="stat no"><b>{count('Rejected')}</b>Rejected</div>
      </div>

      {!isManager && (
        <form className="card row" onSubmit={apply}>
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            {TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
          <input type="date" value={form.fromDate} onChange={(e) => setForm({ ...form, fromDate: e.target.value })} required />
          <input type="date" value={form.toDate} onChange={(e) => setForm({ ...form, toDate: e.target.value })} required />
          <input placeholder="Reason" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} required />
          <button className="btn">Apply Leave</button>
        </form>
      )}
      {msg && <div className="err">{msg}</div>}

      <div className="card table">
        <table>
          <thead>
            <tr>{isManager && <th>Employee</th>}<th>Type</th><th>From</th><th>To</th><th>Days</th><th>Reason</th><th>Status</th>{isManager && <th></th>}</tr>
          </thead>
          <tbody>
            {leaves.length === 0 && <tr><td colSpan={8} className="muted">No leave records yet</td></tr>}
            {leaves.map((l) => (
              <tr key={l._id}>
                {isManager && <td>{l.user?.name}</td>}
                <td>{l.type}</td>
                <td>{l.fromDate.slice(0, 10)}</td>
                <td>{l.toDate.slice(0, 10)}</td>
                <td>{l.days}</td>
                <td>{l.reason}</td>
                <td><span className={`tag ${l.status}`}>{l.status}</span></td>
                {isManager && (
                  <td>
                    {l.status === 'Pending' && (
                      <>
                        <button className="btn sm" onClick={() => decide(l._id, 'Approved')}>Approve</button>
                        <button className="btn sm danger" onClick={() => decide(l._id, 'Rejected')}>Reject</button>
                      </>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function App() {
  const [session, setSession] = useState(() => JSON.parse(localStorage.getItem('session') || 'null'))
  const login = (s) => { localStorage.setItem('session', JSON.stringify(s)); setSession(s) }
  const logout = () => { localStorage.removeItem('session'); setSession(null) }
  return session ? <Dashboard user={session.user} token={session.token} onLogout={logout} /> : <Auth onLogin={login} />
}
