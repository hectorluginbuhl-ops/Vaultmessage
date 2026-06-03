import { useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'

export default function Login() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const [blocked, setBlocked] = useState(false)

  async function handleLogin() {
    if (blocked) return
    if (!username || !password) { setError('Remplis tous les champs.'); return }

    setLoading(true)
    setError('')

    const { data, error: err } = await supabase
      .from('users')
      .select('*')
      .eq('username', username.toLowerCase().trim())
      .eq('password', password)
      .single()

    setLoading(false)

    if (err || !data) {
      const next = attempts + 1
      setAttempts(next)
      if (next >= 4) {
        setBlocked(true)
        setError('Trop de tentatives. Contacte l\'administrateur.')
      } else {
        setError(`Identifiants incorrects. (${4 - next} essai(s) restant)`)
      }
      return
    }

    // Store session in localStorage
    localStorage.setItem('vault_user', JSON.stringify({ id: data.id, username: data.username }))
    router.push('/chat')
  }

  return (
    <div style={styles.page}>
      {/* Animated grid background */}
      <div style={styles.grid} />

      <div style={styles.card}>
        <div style={styles.logo}>
          <div style={styles.logoIcon}>⬡</div>
          <div style={styles.logoText}>VAULT<span style={{ color: '#00ffe0' }}>MSG</span></div>
          <div style={styles.logoSub}>MESSAGERIE PRIVEE CHIFFREE</div>
        </div>

        <div style={styles.divider} />

        <div style={styles.field}>
          <label style={styles.label}>IDENTIFIANT</label>
          <input
            style={styles.input}
            value={username}
            onChange={e => setUsername(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            placeholder="ton_identifiant"
            autoComplete="off"
            disabled={blocked}
          />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>MOT DE PASSE</label>
          <input
            style={styles.input}
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            placeholder="••••••••••"
            disabled={blocked}
          />
        </div>

        {error && (
          <div style={styles.errorBox}>
            <span style={{ color: '#ff2d6b' }}>⚠</span> {error}
          </div>
        )}

        <button
          style={{ ...styles.btn, opacity: blocked || loading ? 0.5 : 1 }}
          onClick={handleLogin}
          disabled={blocked || loading}
        >
          {loading ? 'VERIFICATION...' : blocked ? 'ACCES BLOQUE' : 'ACCEDER →'}
        </button>

        <div style={styles.footer}>
          Acces restreint aux membres autorises uniquement
        </div>
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:.3} 50%{opacity:.7} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#07090f',
    position: 'relative',
    overflow: 'hidden',
  },
  grid: {
    position: 'absolute',
    inset: 0,
    backgroundImage: `
      linear-gradient(rgba(0,255,224,.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(0,255,224,.03) 1px, transparent 1px)
    `,
    backgroundSize: '40px 40px',
    animation: 'pulse 4s ease-in-out infinite',
  },
  card: {
    position: 'relative',
    width: 400,
    background: '#0d1117',
    border: '1px solid #1a2233',
    borderRadius: 12,
    padding: '40px 36px',
    boxShadow: '0 0 60px rgba(0,255,224,.05), 0 0 120px rgba(0,255,224,.02)',
    animation: 'fadeIn .5s ease',
  },
  logo: { textAlign: 'center', marginBottom: 28 },
  logoIcon: { fontSize: 36, color: '#00ffe0', marginBottom: 8 },
  logoText: {
    fontFamily: "'Share Tech Mono', monospace",
    fontSize: 26, fontWeight: 700, letterSpacing: 6, color: '#c9d1d9',
  },
  logoSub: {
    fontFamily: "'Share Tech Mono', monospace",
    fontSize: 9, letterSpacing: 3, color: '#3d4f63', marginTop: 6,
  },
  divider: {
    height: 1, background: 'linear-gradient(90deg,transparent,#1a2233,transparent)',
    marginBottom: 28,
  },
  field: { marginBottom: 18 },
  label: {
    display: 'block',
    fontFamily: "'Share Tech Mono', monospace",
    fontSize: 10, letterSpacing: 3, color: '#3d4f63', marginBottom: 7,
  },
  input: {
    width: '100%', padding: '11px 14px',
    background: '#07090f',
    border: '1px solid #1a2233',
    borderRadius: 6, color: '#c9d1d9', fontSize: 14, outline: 'none',
    transition: 'border-color .2s',
  },
  errorBox: {
    background: '#1a0a0f', border: '1px solid #ff2d6b33',
    borderRadius: 6, padding: '10px 14px',
    fontFamily: "'Share Tech Mono', monospace",
    fontSize: 11, color: '#ff2d6b', marginBottom: 16,
  },
  btn: {
    width: '100%', padding: '13px',
    background: 'transparent',
    border: '1px solid #00ffe0',
    borderRadius: 6,
    color: '#00ffe0',
    fontFamily: "'Share Tech Mono', monospace",
    fontSize: 13, letterSpacing: 3, cursor: 'pointer',
    transition: 'background .2s',
  },
  footer: {
    marginTop: 20, textAlign: 'center',
    fontFamily: "'Share Tech Mono', monospace",
    fontSize: 9, color: '#1a2233', letterSpacing: 2,
  },
}
