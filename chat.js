import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'

// Chiffrement XOR simple
function encrypt(text, key) {
  return btoa(text.split('').map((c, i) =>
    String.fromCharCode(c.charCodeAt(0) ^ key.charCodeAt(i % key.length))
  ).join(''))
}
function decrypt(encoded, key) {
  try {
    const raw = atob(encoded)
    return raw.split('').map((c, i) =>
      String.fromCharCode(c.charCodeAt(0) ^ key.charCodeAt(i % key.length))
    ).join('')
  } catch { return '[message illisible]' }
}

const SECRET_KEY = 'vaultmsg_x9#mZ!kP@qR2_secret'

export default function Chat() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef(null)

  useEffect(() => {
    const stored = localStorage.getItem('vault_user')
    if (!stored) { router.push('/'); return }
    setUser(JSON.parse(stored))
    fetchMessages()

    // Actualisation automatique toutes les 3 secondes
    const interval = setInterval(fetchMessages, 3000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function fetchMessages() {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(100)
    if (data) setMessages(data)
    setLoading(false)
  }

  async function sendMessage() {
    if (!input.trim() || !user) return
    const encrypted = encrypt(input.trim(), SECRET_KEY)
    await supabase.from('messages').insert({
      from_user: user.username,
      content: encrypted,
    })
    setInput('')
    fetchMessages()
  }

  function logout() {
    localStorage.removeItem('vault_user')
    router.push('/')
  }

  if (loading) return (
    <div style={styles.loading}>
      <div style={styles.loadingText}>CONNEXION SECURISEE...</div>
    </div>
  )

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={styles.logoText}>VAULT<span style={{ color: '#00ffe0' }}>MSG</span></span>
          <span style={styles.badge}>🔒 CHIFFRE</span>
        </div>
        <div style={styles.headerRight}>
          <span style={styles.userTag}>@{user?.username}</span>
          <button style={styles.logoutBtn} onClick={logout}>DECONNEXION</button>
        </div>
      </div>

      {/* Messages */}
      <div style={styles.messages}>
        {messages.length === 0 && (
          <div style={styles.empty}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🔐</div>
            <div>Aucun message — le salon est securise</div>
          </div>
        )}
        {messages.map(msg => {
          const isMe = msg.from_user === user?.username
          const text = decrypt(msg.content, SECRET_KEY)
          const time = new Date(msg.created_at).toLocaleTimeString('fr-FR', {
            hour: '2-digit', minute: '2-digit'
          })
          return (
            <div key={msg.id} style={{ ...styles.msgRow, justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
              <div style={{ maxWidth: '65%' }}>
                <div style={{ ...styles.msgMeta, textAlign: isMe ? 'right' : 'left' }}>
                  <span style={{ color: isMe ? '#00ffe0' : '#ff2d6b' }}>{msg.from_user}</span>
                  <span style={styles.time}>{time}</span>
                </div>
                <div style={{
                  ...styles.bubble,
                  background: isMe ? 'rgba(0,255,224,0.07)' : 'rgba(255,45,107,0.07)',
                  border: `1px solid ${isMe ? 'rgba(0,255,224,0.2)' : 'rgba(255,45,107,0.2)'}`,
                  borderRadius: isMe ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                }}>
                  {text}
                  <div style={styles.cipherHint}>
                    {msg.content.substring(0, 18)}...
                  </div>
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={styles.inputBar}>
        <span style={styles.lockIcon}>🔒</span>
        <input
          style={styles.input}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
          placeholder="Ecris ton message chiffre..."
        />
        <button
          style={{ ...styles.sendBtn, opacity: input.trim() ? 1 : 0.4 }}
          onClick={sendMessage}
          disabled={!input.trim()}
        >
          ENVOYER
        </button>
      </div>
    </div>
  )
}

const styles = {
  page: {
    height: '100vh', display: 'flex', flexDirection: 'column',
    background: '#07090f', fontFamily: "'Share Tech Mono', monospace",
  },
  loading: {
    height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: '#07090f',
  },
  loadingText: {
    fontFamily: "'Share Tech Mono', monospace",
    color: '#00ffe0', letterSpacing: 4, fontSize: 13,
    animation: 'pulse 1.5s ease-in-out infinite',
  },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '14px 24px', background: '#0d1117',
    borderBottom: '1px solid #1a2233',
  },
  headerLeft: { display: 'flex', alignItems: 'center', gap: 12 },
  logoText: { fontSize: 18, fontWeight: 700, letterSpacing: 4, color: '#c9d1d9' },
  badge: {
    background: 'rgba(0,255,224,0.08)', border: '1px solid rgba(0,255,224,0.2)',
    borderRadius: 4, padding: '3px 10px', color: '#00ffe0', fontSize: 10, letterSpacing: 2,
  },
  headerRight: { display: 'flex', alignItems: 'center', gap: 14 },
  userTag: { color: '#3d4f63', fontSize: 12 },
  logoutBtn: {
    background: 'transparent', border: '1px solid rgba(255,45,107,0.3)',
    borderRadius: 4, color: '#ff2d6b', padding: '5px 12px',
    fontSize: 10, letterSpacing: 2, cursor: 'pointer',
  },
  messages: {
    flex: 1, overflowY: 'auto', padding: '20px 24px',
    display: 'flex', flexDirection: 'column', gap: 12,
  },
  empty: {
    textAlign: 'center', color: '#1a2233',
    margin: 'auto', fontSize: 12, letterSpacing: 2,
  },
  msgRow: { display: 'flex' },
  msgMeta: {
    display: 'flex', gap: 8, alignItems: 'baseline',
    marginBottom: 4, fontSize: 11,
  },
  time: { color: '#1a2233', fontSize: 10 },
  bubble: {
    padding: '10px 14px', fontSize: 13,
    color: '#c9d1d9', lineHeight: 1.5,
  },
  cipherHint: {
    marginTop: 4, fontSize: 9, color: '#1a2233', letterSpacing: 1,
  },
  inputBar: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '14px 24px', background: '#0d1117',
    borderTop: '1px solid #1a2233',
  },
  lockIcon: { fontSize: 14, color: '#1a2233' },
  input: {
    flex: 1, padding: '11px 14px',
    background: '#07090f', border: '1px solid #1a2233',
    borderRadius: 6, color: '#c9d1d9', fontSize: 13, outline: 'none',
  },
  sendBtn: {
    padding: '11px 20px',
    background: 'transparent', border: '1px solid #00ffe0',
    borderRadius: 6, color: '#00ffe0',
    fontSize: 11, letterSpacing: 2, cursor: 'pointer',
  },
}
