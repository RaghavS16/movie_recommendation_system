// src/ChatPage.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Trash2, Film } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import MovieCard from './MovieCard';
import { COLORS, FONTS } from './theme';
import { getSettings } from './SettingsPage';
import { API_BASE_URL } from './config';

const SUGGESTIONS = [
  { label: '😌 Tired after work',  text: "I'm exhausted after a long day at office, suggest something relaxing" },
  { label: '😂 Make me laugh',      text: 'I want something really funny' },
  { label: '❤️ Romantic Tamil',     text: 'Tamil romantic movies' },
  { label: '🔥 Action 2024',        text: 'Best action movies from 2024' },
  { label: '👻 Scare me',           text: 'I want something scary and creepy' },
  { label: '🧠 Mind-bending',       text: 'Suggest a mind-bending thriller' },
  { label: '🎵 Know a song',        text: 'I know the song Kesariya, which movie?' },
  { label: '🎬 Vijay movies',       text: 'Vijay top movies' },
];

const TypingDots = () => (
  <div style={{ display: 'flex', gap: '5px', padding: '4px 2px', alignItems: 'center' }}>
    {[0, 1, 2].map(i => (
      <div key={i} style={{
        width: '7px', height: '7px', borderRadius: '50%', background: '#f5c842',
        animation: 'bounce 1.2s infinite ease-in-out',
        animationDelay: `${i * 0.2}s`, opacity: 0.7,
      }} />
    ))}
  </div>
);

const BotMessage = ({ content }) => (
  <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', maxWidth: '75%' }}>
    <div style={{
      width: '32px', height: '32px', borderRadius: '10px', minWidth: '32px',
      background: 'linear-gradient(135deg, #f5c842, #c9a227)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '15px', boxShadow: '0 0 12px rgba(245,200,66,0.3)', flexShrink: 0,
    }}>🎬</div>
    <div style={{
      background: '#0e0e1a', border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: '18px', borderTopLeftRadius: '4px',
      padding: '14px 18px', color: '#f0eee8',
      fontSize: '15px', lineHeight: '1.65', whiteSpace: 'pre-wrap',
    }}>
      {content}
    </div>
  </div>
);

const UserMessage = ({ content }) => (
  <div style={{
    background: 'linear-gradient(135deg, #f5c842, #c9a227)',
    borderRadius: '18px', borderTopRightRadius: '4px',
    padding: '14px 18px', color: '#0a0a14',
    fontSize: '15px', lineHeight: '1.65', maxWidth: '70%', fontWeight: '500',
    boxShadow: '0 4px 16px rgba(245,200,66,0.2)',
  }}>
    {content}
  </div>
);

const DEFAULT_MSG = [{
  type: 'bot',
  content: "Hey! I'm FilmoBot 🎬\n\nJust tell me how you feel, name a movie, mention an actor, or type a song name — I'll find the perfect film!\n\nTry a suggestion below to get started ↓",
}];

export default function ChatPage({ watchlist, onToggleWatchlist }) {
  const location = useLocation();
  const endRef   = useRef(null);
  const inputRef = useRef(null);

  const [messages,         setMessages]         = useState(DEFAULT_MSG);
  const [input,            setInput]            = useState('');
  const [loading,          setLoading]          = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [showSuggestions,  setShowSuggestions]  = useState(true);
  const [sessions,         setSessions]         = useState(() => {
    try { return JSON.parse(localStorage.getItem('chat_sessions') || '[]'); }
    catch { return []; }
  });

  // ── REFS that always hold the LATEST values ───────────────────────────────
  // This is the core fix: sendMessage reads from these refs, not from the
  // closure, so switching sessions mid-request doesn't cause stale writes.
  const messagesRef         = useRef(messages);
  const currentSessionIdRef = useRef(currentSessionId);
  const sessionsRef         = useRef(sessions);

  useEffect(() => { messagesRef.current         = messages;         }, [messages]);
  useEffect(() => { currentSessionIdRef.current = currentSessionId; }, [currentSessionId]);
  useEffect(() => { sessionsRef.current         = sessions;         }, [sessions]);

  // ── Scroll to bottom ──────────────────────────────────────────────────────
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

  // ── Load sessions from cloud on mount ─────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    fetch(`${API_BASE_URL}/get-sessions`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          setSessions(data);
          localStorage.setItem('chat_sessions', JSON.stringify(data));
        }
      })
      .catch(() => {});
  }, []);

  // ── Persist sessions locally ──────────────────────────────────────────────
  useEffect(() => {
    localStorage.setItem('chat_sessions', JSON.stringify(sessions));
  }, [sessions]);

  // ── Navigate from sidebar on another page ─────────────────────────────────
  useEffect(() => {
    if (location.state?.sessionId) {
      const s = sessions.find(s => s.id === location.state.sessionId);
      if (s) {
        setCurrentSessionId(s.id);
        setMessages(s.messages);
        setShowSuggestions(false);
      }
      window.history.replaceState({}, document.title);
    }
  }, [location.state, sessions]);

  // ── Sync to DB ────────────────────────────────────────────────────────────
  const syncToDB = (sessionData) => {
    const token = localStorage.getItem('token');
    fetch(`${API_BASE_URL}/sync-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(sessionData),
    }).catch(() => {});
  };

  // ── Session controls ──────────────────────────────────────────────────────
  const handleNewChat = () => {
    setCurrentSessionId(null);
    setMessages(DEFAULT_MSG);
    setShowSuggestions(true);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleSelectSession = (id) => {
    const s = sessions.find(s => s.id === id);
    if (s) {
      setCurrentSessionId(id);
      setMessages(s.messages);
      setShowSuggestions(false);
    }
  };

  const handleDeleteSession = (id) => {
    if (!window.confirm('Delete this chat?')) return;
    setSessions(p => p.filter(s => s.id !== id));
    if (currentSessionId === id) handleNewChat();
    const token = localStorage.getItem('token');
    fetch(`${API_BASE_URL}/delete-session/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {});
  };

  // ── SEND MESSAGE ──────────────────────────────────────────────────────────
  // Always reads messagesRef / currentSessionIdRef / sessionsRef so the
  // response is ALWAYS written to whichever session is active at the time
  // the API call completes — not the session that was active when sent.
  const sendMessage = useCallback(async (text, hidden = false) => {
    if (!text.trim()) return;
    setShowSuggestions(false);

    // Snapshot the active session at send-time
    const sessionIdAtSend = currentSessionIdRef.current;

    // Build outgoing message list from the ref (always fresh)
    let msgs = [...messagesRef.current];
    if (!hidden) {
      msgs.push({ type: 'user', content: text });
      setMessages(msgs);
    }

    setLoading(true);
    const token = localStorage.getItem('token');

    try {
      const res  = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          message: text,
          // inject user's preferred movie count from settings
          count: parseInt(getSettings().movieCount, 10) || 5,
        }),
      });
      const data = await res.json();

      // ── After the await, re-read the CURRENT active session from the ref.
      // If the user switched sessions while waiting, activeId ≠ sessionIdAtSend.
      // In that case we save the result to the original session silently
      // (background update) but do NOT update the visible messages — so the
      // user's current view is never disrupted.
      const activeIdNow = currentSessionIdRef.current;
      const responseIsForActiveSession = (activeIdNow === sessionIdAtSend);

      // Build the final message list for the session that sent the request
      if (data.bot_response) msgs.push({ type: 'bot', content: data.bot_response });
      (data.movies || []).forEach(m => msgs.push({ type: 'bot', content: m, isJson: true }));

      // Only update visible messages if user hasn't switched sessions
      if (responseIsForActiveSession) {
        setMessages([...msgs]);
      }

      // Always persist the result to the correct session
      if (!hidden) {
        if (sessionIdAtSend) {
          // Update existing session
          const ex    = sessionsRef.current.find(s => s.id === sessionIdAtSend);
          const title = ex?.title || 'Chat';
          const up    = { id: sessionIdAtSend, title, messages: msgs };
          setSessions(p => p.map(s => s.id === sessionIdAtSend ? up : s));
          syncToDB(up);
        } else {
          // New session — only create if still on same (new) chat
          if (responseIsForActiveSession) {
            const newId = Date.now();
            const title = text.length > 24 ? text.slice(0, 24) + '…' : text;
            const ns    = { id: newId, title, messages: msgs };
            setSessions(p => [ns, ...p]);
            setCurrentSessionId(newId);
            syncToDB(ns);
          }
        }
      }
    } catch {
      // Only show error if still on the same session
      if (currentSessionIdRef.current === sessionIdAtSend) {
        setMessages(p => [...p, {
          type: 'bot',
          content: "Sorry, I couldn't reach the server. Please try again!",
        }]);
      }
    } finally {
      setLoading(false);
    }
  }, []); // no deps — reads everything from refs

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage(input);
    setInput('');
  };

  return (
    <div style={{
      display: 'flex', height: '100vh',
      background: '#080810', fontFamily: "'DM Sans', sans-serif", overflow: 'hidden',
    }}>
      {/* Ambient glow */}
      <div style={{
        position: 'fixed', top: '10%', left: '40%',
        width: '500px', height: '400px', pointerEvents: 'none', zIndex: 0,
        background: 'radial-gradient(ellipse, rgba(245,200,66,0.03) 0%, transparent 70%)',
      }} />

      <Sidebar
        chatSessions={sessions}
        activeSessionId={currentSessionId}
        onSelectSession={handleSelectSession}
        onNewChat={handleNewChat}
        onDeleteSession={handleDeleteSession}
      />

      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        position: 'relative', zIndex: 1, minWidth: 0,
      }}>

        {/* ── TOP BAR ── */}
        <div style={{
          padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'rgba(8,8,16,0.9)', backdropFilter: 'blur(20px)', flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: 'linear-gradient(135deg, #f5c842, #c9a227)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px',
            }}>🎬</div>
            <div>
              <div style={{
                fontWeight: '700', fontSize: '16px', color: '#f0eee8',
                fontFamily: "'Playfair Display', serif",
              }}>FilmoBot</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#4ade80' }}>
                <div style={{
                  width: '6px', height: '6px', borderRadius: '50%',
                  background: '#4ade80', boxShadow: '0 0 6px #4ade80',
                }} />
                Online
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              if (window.confirm('Clear this screen?')) {
                setMessages(DEFAULT_MSG);
                setShowSuggestions(true);
                sendMessage('reset', true);
              }
            }}
            style={{
              background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)',
              borderRadius: '10px', padding: '7px 14px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '6px',
              color: '#f87171', fontSize: '13px', fontWeight: '500', fontFamily: 'inherit',
            }}
          >
            <Trash2 size={14} /> Clear
          </button>
        </div>

        {/* ── MESSAGES ── */}
        <div
          className="hide-scrollbar"
          style={{ flex: 1, overflowY: 'auto', padding: '24px 20px 190px' }}
        >
          {messages.map((msg, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                justifyContent: msg.type === 'user' ? 'flex-end' : 'flex-start',
                marginBottom: '16px',
                animation: 'fadeUp 0.3s ease',
              }}
            >
              {msg.isJson ? (
                <MovieCard
                  data={msg.content}
                  isLiked={watchlist.some(m => m.title === msg.content.title)}
                  onToggle={onToggleWatchlist}
                  onMoreLikeThis={id => sendMessage(`recommend_id:${id}`, true)}
                />
              ) : msg.type === 'user' ? (
                <UserMessage content={msg.content} />
              ) : (
                <BotMessage content={msg.content} />
              )}
            </div>
          ))}

          {loading && (
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '10px', minWidth: '32px',
                background: 'linear-gradient(135deg, #f5c842, #c9a227)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '15px', flexShrink: 0,
              }}>🎬</div>
              <div style={{
                background: '#0e0e1a', border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: '18px', borderTopLeftRadius: '4px', padding: '12px 16px',
              }}>
                <TypingDots />
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {/* ── SUGGESTIONS ── */}
        {showSuggestions && (
          <div style={{
            position: 'absolute', bottom: '95px', left: '20px', right: '20px',
            display: 'flex', gap: '8px', flexWrap: 'wrap',
          }}>
            {SUGGESTIONS.map((s, i) => (
              <button
                key={i}
                type="button"
                onClick={() => { sendMessage(s.text); setInput(''); }}
                style={{
                  background: '#0e0e1a', border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: '100px', padding: '7px 14px', color: '#7a7a9a',
                  fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit',
                  transition: 'all 0.2s', whiteSpace: 'nowrap',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(245,200,66,0.4)'; e.currentTarget.style.color = '#f5c842'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = '#7a7a9a'; }}
              >
                {s.label}
              </button>
            ))}
          </div>
        )}

        {/* ── INPUT BAR ── */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          padding: '14px 20px',
          background: 'linear-gradient(to top, rgba(8,8,16,1) 70%, transparent)',
        }}>
          <form onSubmit={handleSend} style={{
            display: 'flex', gap: '10px', maxWidth: '860px', margin: '0 auto',
            background: '#0e0e1a', border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '18px', padding: '6px 6px 6px 16px',
          }}>
            <Film size={18} color="#4a4a6a" style={{ alignSelf: 'center', minWidth: 18, flexShrink: 0 }} />
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Describe your mood, name a movie, or ask anything…"
              style={{
                flex: 1, background: 'transparent', border: 'none', outline: 'none',
                color: '#f0eee8', fontSize: '15px', padding: '10px 0', fontFamily: 'inherit',
              }}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              style={{
                background: (loading || !input.trim()) ? '#1a1a2e' : 'linear-gradient(135deg, #f5c842, #c9a227)',
                border: 'none', borderRadius: '12px', width: '46px', height: '46px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: (loading || !input.trim()) ? 'default' : 'pointer',
                transition: 'all 0.2s', flexShrink: 0,
              }}
            >
              <Send size={18} color={(loading || !input.trim()) ? '#4a4a6a' : '#0a0a14'} />
            </button>
          </form>
          <p style={{ textAlign: 'center', color: '#4a4a6a', fontSize: '11px', marginTop: '6px' }}>
            Try: "Tamil thriller 2023" · "Movies like Interstellar" · "Vijay top movies" · "Song Kesariya which movie"
          </p>
        </div>
      </div>

      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes bounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-6px)} }
        .hide-scrollbar::-webkit-scrollbar { display:none; }
        .hide-scrollbar { -ms-overflow-style:none; scrollbar-width:none; }
      `}</style>
    </div>
  );
}